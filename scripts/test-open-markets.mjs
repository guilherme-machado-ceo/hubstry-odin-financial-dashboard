// ODIN — teste do PR 2c (dados abertos, procedência em dois eixos, retiradas).
// Sem rede e sem LLM: lê src/data/generated/open-markets.json (gerado no CI
// pelo workflow open-markets.yml) e confere:
//  1. contrato do snapshot: blocos com verification + derivation + método,
//     séries com URL e datas, lacunas com motivo em PT e EN, coerência
//     aritmética (bps = (local − EUA) × 100; Δ12m e tendência pela regra);
//  2. procedência em dois eixos em TODO indicador das camadas
//     (verification ∈ {verified, unverified}; derivation ∈ {direct,
//     transformed, derived, estimated}) e marcação na interface;
//  3. a interface mostra os números do snapshot (diferencial, volatilidade,
//     petróleo) e lista as lacunas — sem substituto de outra definição;
//  4. o score de estabilidade e a série Bloomberg sumiram do código da
//     interface, das camadas, do filtro regional e das exportações.
import { build } from "esbuild";
import { readFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import SpreadsTable from "@/components/SpreadsTable";
import VolatilityChart from "@/components/VolatilityChart";
import SectionLayers from "@/components/SectionLayers";
import { setLocale } from "@/i18n";
export { openMarkets, latestFullYear } from "@/data/openMarkets";
export { SECTION_LAYERS, getSectionLayers } from "@/data/sectionLayers";
export { REGION_FILTERED_SECTIONS } from "@/data/regions";
export * as lc from "@/data/lcBondsData";
export * as goldOil from "@/data/goldOilData";
const noop = () => {};
export function renderSpreads(locale, region = "all") { setLocale(locale); return renderToStaticMarkup(createElement(SpreadsTable, { onSourceClick: noop, onEmbedClick: noop, regionFilter: region })); }
export function renderVol(locale, region = "all") { setLocale(locale); return renderToStaticMarkup(createElement(VolatilityChart, { onSourceClick: noop, onEmbedClick: noop, regionFilter: region })); }
export function renderLayers(id, locale) { setLocale(locale); return renderToStaticMarkup(createElement(SectionLayers, { id })); }
`;
const outdir = path.join(root, "node_modules/.cache/odin-open-markets");
await mkdir(outdir, { recursive: true });
await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node", outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts", ".json": "json" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react", "recharts"],
});
const m = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);
const om = m.openMarkets;

// ── 1. Contrato do snapshot ────────────────────────────────────────────────
const ISO = /^\d{4}-\d{2}-\d{2}/;
assert(om.schemaVersion && om.methodVersion && ISO.test(om.retrievedAt), "snapshot sem versão/data de coleta");
for (const [id, s] of Object.entries(om.series)) {
  assert(/^https:\/\//.test(s.url) && ISO.test(s.firstDate) && ISO.test(s.lastDate) && s.n > 0 && s.title, `série ${id} incompleta`);
}
for (const k of ["yieldDifferential", "fxVolatility", "oil"]) {
  const b = om[k];
  assert(b.verification === "verified" && ["direct", "transformed", "derived", "estimated"].includes(b.derivation), `${k}: procedência inválida`);
  assert(b.methodPt?.length > 40 && b.methodEn?.length > 40, `${k}: método ausente`);
}
const yd = om.yieldDifferential;
assert(yd.countries.length >= 2, "diferencial com menos de 2 países");
assert(/EMBI/.test(yd.methodPt) && /EMBI/.test(yd.methodEn), "método do diferencial deve declarar que não é EMBI");
for (const c of yd.countries) {
  const at = `[diferencial ${c.flag}]`;
  assert(om.series[c.seriesId], `${at} série sem metadados`);
  assert(Math.abs(Math.round((c.latest.localPct - c.latest.usPct) * 100) - c.latest.bps) <= 1, `${at} bps ≠ (local − EUA) × 100`);
  if (c.delta12mBps != null) {
    const exp = Math.abs(c.delta12mBps) < 25 ? "stable" : c.delta12mBps > 0 ? "widening" : "narrowing";
    assert(c.trend === exp, `${at} tendência ${c.trend} ≠ regra (${exp})`);
  }
}
for (const g of [...yd.gaps, ...om.fxVolatility.gaps]) assert(g.reasonPt && g.reasonEn && g.countryPt, `lacuna ${g.flag} sem motivo`);
const gapFlags = new Set(yd.gaps.map((g) => g.flag));
for (const f of ["BR", "CN", "RU", "CO", "AR"]) assert(gapFlags.has(f) || yd.countries.some((c) => c.flag === f), `diferencial: ${f} nem com série nem em lacunas`);
const fx = om.fxVolatility;
const fxYear = m.latestFullYear(fx.currencies.map((c) => c.annual));
assert(fxYear >= 2025, `ano completo de volatilidade inesperado: ${fxYear}`);
for (const c of fx.currencies) {
  for (const [y, v] of Object.entries(c.annual)) assert(v > 0 && v < 100, `[vol ${c.code} ${y}] valor fora de faixa: ${v}`);
}
assert(fx.currencies.some((c) => c.code === "BRL"), "volatilidade sem BRL");
for (const k of ["brent", "wti"]) {
  const o = om.oil[k];
  assert(o && o.annual["2025"] > 0 && o.latest.value > 0 && ISO.test(o.latest.date), `petróleo ${k} incompleto`);
}

// ── 2. Procedência em dois eixos em todo indicador ─────────────────────────
const VER = new Set(["verified", "unverified"]);
const DER = new Set(["direct", "transformed", "derived", "estimated"]);
let n = 0;
const allSpecs = [...m.SECTION_LAYERS, ...["BRICS", "LATAM"].flatMap((r) => m.REGION_FILTERED_SECTIONS.map((s) => m.getSectionLayers(s.id, r)))];
for (const s of allSpecs) {
  for (const ind of s.indicators) {
    n += 1;
    assert(VER.has(ind.verification) && DER.has(ind.derivation), `[${s.id}] "${ind.labelPt}" sem procedência válida (${ind.verification}/${ind.derivation})`);
    assert(!("estimated" in ind) && !("unverified" in ind), `[${s.id}] "${ind.labelPt}" ainda usa os campos antigos`);
  }
}
for (const id of ["spreads", "volatility", "oil"]) {
  const s = m.SECTION_LAYERS.find((x) => x.id === id);
  assert(s.indicators.every((i) => i.verification === "verified"), `[${id}] dados abertos devem estar verificados`);
  assert(s.indicators.some((i) => i.derivation === "derived"), `[${id}] deveria ter indicador derivado`);
  for (const locale of ["pt", "en"]) {
    const html = m.renderLayers(id, locale);
    assert(/data-verification="verified"/.test(html) && /data-derivation="derived"/.test(html), `[${id}/${locale}] HTML sem atributos de procedência`);
  }
}

// ── 3. Interface mostra o snapshot e as lacunas ────────────────────────────
for (const locale of ["pt", "en"]) {
  const sp = m.renderSpreads(locale);
  for (const c of yd.countries) {
    assert(sp.includes(`data-yield-row="${c.flag}"`), `[spreads/${locale}] sem linha ${c.flag}`);
    assert(sp.includes(`${c.latest.bps > 0 ? "+" : ""}${c.latest.bps}<`), `[spreads/${locale}] valor ${c.latest.bps} de ${c.flag} ausente`);
  }
  assert(sp.includes('data-gaps="spreads"'), `[spreads/${locale}] lacunas não exibidas`);
  for (const g of yd.gaps) assert(sp.includes(locale === "pt" ? g.countryPt : g.country), `[spreads/${locale}] lacuna ${g.flag} não listada`);
  assert(!/Bloomberg|Alpha Vantage|2025e/.test(sp), `[spreads/${locale}] resquício da série antiga`);
  const brics = m.renderSpreads(locale, "BRICS");
  for (const c of yd.countries) assert(brics.includes(`data-yield-row="${c.flag}"`) === ["BR", "CN", "IN", "RU", "ZA"].includes(c.flag), `[spreads/BRICS/${locale}] filtro errado para ${c.flag}`);

  const vol = m.renderVol(locale);
  for (const c of fx.currencies) assert(vol.includes(`data-fx-row="${c.code}"`), `[vol/${locale}] sem linha ${c.code}`);
  const brl = fx.currencies.find((c) => c.code === "BRL");
  const brlTxt = brl.annual[fxYear].toLocaleString(locale === "pt" ? "pt-BR" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  assert(vol.includes(`${brlTxt}%`), `[vol/${locale}] BRL ${fxYear} (${brlTxt}%) ausente`);
  assert(vol.includes('data-gaps="volatility"'), `[vol/${locale}] lacunas não exibidas`);
  assert(!/Bloomberg|Alpha Vantage|2025e/.test(vol), `[vol/${locale}] resquício da série antiga`);
}

// ── 4. Retiradas: score de estabilidade e Bloomberg ────────────────────────
assert(!m.SECTION_LAYERS.some((s) => s.id === "stability"), "camada de estabilidade ainda existe");
assert(!m.REGION_FILTERED_SECTIONS.some((s) => s.id === "stability"), "estabilidade ainda está no filtro regional");
for (const k of ["stabilityScores", "spreadsData", "volatilityData", "volatilityDetails", "volatilityRanking"]) assert(!(k in m.lc), `lcBondsData ainda exporta ${k}`);
assert(!("oilData" in m.goldOil), "goldOilData ainda exporta oilData");
assert(!m.lc.sourceRefs.some((r) => r.id === "bloomberg"), "sourceRef bloomberg ainda existe");
async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else if (/\.(tsx?|json)$/.test(e.name)) out.push(p);
  }
  return out;
}
for (const f of await walk(path.join(root, "src"))) {
  const rel = path.relative(root, f);
  const txt = await readFile(f, "utf8");
  if (rel.endsWith("dataAudit.ts")) continue; // o registro de auditoria documenta o que foi retirado
  assert(!/stabilityScore|StabilityScatter|stabilityScores/.test(txt), `${rel} ainda referencia o score de estabilidade`);
  assert(!/["']bloomberg["']|Bloomberg Terminal/.test(txt), `${rel} ainda referencia a série Bloomberg`);
  assert(!/petroyuan|bricsProduction/i.test(txt), `${rel} ainda referencia petroyuan/produção BRICS+`);
}
const app = await readFile(path.join(root, "src/App.tsx"), "utf8");
assert(!/stability/i.test(app), "App.tsx ainda monta a seção de estabilidade");

console.log(`open markets: ${yd.countries.length} diferenciais (${yd.gaps.length} lacunas), ${fx.currencies.length} moedas (${fx.gaps.length} lacunas), petróleo ok · ${n} indicadores com procedência em dois eixos`);
if (failures) { console.error(`${failures} falha(s)`); process.exit(1); }
console.log("OK — dados abertos com método, procedência em dois eixos e retiradas completas.");
