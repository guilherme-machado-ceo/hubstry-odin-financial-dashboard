// ODIN — teste das camadas estruturais (M2), sem LLM.
// Empacota src/data/sectionLayers.ts e src/components/SectionLayers.tsx com o
// esbuild (já instalado pelo Vite) e RENDERIZA os 10 blocos em PT e EN com
// react-dom/server. Verifica registro e HTML: fontes resolvidas, datas válidas,
// ≥2 indicadores, What to Watch com fonte da seção, lente jurídica, bloco
// fechado por padrão, nenhum "undefined"/"NaN" e App.tsx montando cada bloco.
import { build } from "esbuild";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const EXPECTED = ["hero", "brazil", "market-size", "spreads", "volatility", "tcx", "debt", "gold", "oil"];
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import SectionLayers from "@/components/SectionLayers";
import { SECTION_LAYERS, sourceFreshness, getSectionLayers } from "@/data/sectionLayers";
import { REGION_FLAGS, REGION_FILTERED_SECTIONS } from "@/data/regions";
import { countryDebtData } from "@/data/lcBondsData";
import { openMarkets } from "@/data/openMarkets";
import { setLocale } from "@/i18n";
export function render(id, locale, region = "all") { setLocale(locale); return renderToStaticMarkup(createElement(SectionLayers, { id, region })); }
export { SECTION_LAYERS, sourceFreshness, getSectionLayers, REGION_FLAGS, REGION_FILTERED_SECTIONS, countryDebtData, openMarkets };
`;
// Dentro do projeto, para o Node resolver react/react-dom do node_modules.
const outdir = path.join(root, "node_modules/.cache/odin-layers");
await mkdir(outdir, { recursive: true });
await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node", outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
});
const mod = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);
const { SECTION_LAYERS, render, sourceFreshness, getSectionLayers, REGION_FLAGS, REGION_FILTERED_SECTIONS } = mod;

const ids = SECTION_LAYERS.map((s) => s.id);
assert(JSON.stringify([...ids].sort()) === JSON.stringify([...EXPECTED].sort()), `seções esperadas ${EXPECTED} ≠ ${ids}`);
assert(new Set(ids).size === ids.length, "ids duplicados");

for (const s of SECTION_LAYERS) {
  const at = `[${s.id}]`;
  assert(s.sources.length >= 1, `${at} sem fonte`);
  for (const src of s.sources) {
    assert(src.asOf === "live" || !Number.isNaN(Date.parse(src.asOf)), `${at} fonte ${src.id} com data inválida: ${src.asOf}`);
    assert(/^https?:\/\//.test(src.url), `${at} fonte ${src.id} sem URL`);
    assert(["live", "current", "stale"].includes(sourceFreshness(src)), `${at} frescor inválido`);
  }
  const srcIds = new Set(s.sources.map((x) => x.id));
  assert(s.indicators.length >= 2, `${at} menos de 2 indicadores`);
  for (const ind of s.indicators) {
    assert(srcIds.has(ind.sourceId), `${at} indicador "${ind.labelPt}" cita fonte fora da seção: ${ind.sourceId}`);
    for (const v of [ind.valuePt, ind.valueEn]) assert(typeof v === "string" && v.trim() && !/undefined|NaN|null/.test(v), `${at} valor inválido em "${ind.labelPt}": ${v}`);
  }
  assert(srcIds.has(s.watch.sourceId), `${at} What to Watch cita fonte fora da seção: ${s.watch.sourceId}`);
  assert(s.watch.signalPt && s.watch.signalEn && s.watch.whyPt && s.watch.whyEn, `${at} What to Watch incompleto`);
  assert(s.legal?.status === "not_applicable" && s.legal.notePt && s.legal.noteEn, `${at} status da lente jurídica ausente`);

  for (const locale of ["pt", "en"]) {
    const html = render(s.id, locale);
    assert(html.includes(`data-section-layers="${s.id}"`), `${at}/${locale} bloco não renderizou`);
    assert(!/<details[^>]*\sopen/.test(html), `${at}/${locale} bloco deve iniciar fechado`);
    assert(!/undefined|NaN/.test(html), `${at}/${locale} HTML com undefined/NaN`);
    const heads = locale === "pt"
      ? ["Fontes e data de referência", "Indicadores-chave", "Eventos e marcos", "What to Watch", "Lente de Direito Econômico"]
      : ["Sources and reference date", "Key indicators", "Events and milestones", "What to Watch", "Economic Law Lens"];
    for (const h of heads) assert(html.includes(h), `${at}/${locale} sem a camada "${h}"`);
    // UX (01/10/2026): data de referência é fato; nenhum rótulo editorial de "desatualizado".
    assert(!/desatualizad|outdated/i.test(html), `${at}/${locale} a interface não deve exibir "desatualizado"`);
    const live = s.sources.filter((x) => x.asOf === "live").length;
    const liveLabel = locale === "pt" ? "ao vivo" : "live";
    assert(!live || html.includes(liveLabel), `${at}/${locale} fonte ao vivo sem o rótulo "${liveLabel}"`);
  }
}

// ── Filtro regional: nenhum país fora da região nos indicadores recalculados. ──
const flagOf = new Map();
const om = mod.openMarkets;
for (const row of [...om.yieldDifferential.countries, ...om.yieldDifferential.gaps, ...mod.countryDebtData]) { flagOf.set(row.country, row.flag); flagOf.set(row.countryPt, row.flag); }
for (const row of [...om.fxVolatility.currencies, ...om.fxVolatility.gaps]) { flagOf.set(row.code, row.flag); flagOf.set(row.country, row.flag); flagOf.set(row.countryPt, row.flag); }
const names = [...flagOf.keys()].filter((n) => n.length > 2 || /^[A-Z]{3}$/.test(n));
for (const sec of REGION_FILTERED_SECTIONS) {
  for (const region of ["BRICS", "LATAM"]) {
    const spec = getSectionLayers(sec.id, region);
    const at = `[${sec.id}/${region}]`;
    assert(spec?.scope === region, `${at} escopo deveria ser ${region}, veio ${spec?.scope}`);
    for (const ind of spec.indicators) {
      for (const label of [ind.labelPt, ind.labelEn]) {
        for (const n of names) {
          if (new RegExp(`(^|[^A-Za-zÀ-ÿ])${n}([^A-Za-zÀ-ÿ]|$)`).test(label) && !REGION_FLAGS[region].includes(flagOf.get(n))) {
            assert(false, `${at} indicador "${label}" cita ${n}, fora da região ${region}`);
          }
        }
      }
    }
    const html = render(sec.id, "pt", region);
    assert(html.includes(`data-layers-scope="${region}"`), `${at} bloco sem o rótulo de região`);
  }
  assert(!render(sec.id, "pt", "all").includes("data-layers-scope"), `[${sec.id}/all] visão global não deve exibir rótulo de região`);
}
// Global (sem filtro) cita todos os países com série; BRICS só os do bloco.
const spreadsAll = getSectionLayers("spreads", "all");
assert(spreadsAll.indicators.length === om.yieldDifferential.countries.length, "visão global do diferencial deveria listar todos os países com série aberta");
const spreadsBrics = getSectionLayers("spreads", "BRICS");
assert(spreadsBrics.indicators.every((i) => om.yieldDifferential.countries.some((c) => i.labelPt.startsWith(c.countryPt) && REGION_FLAGS.BRICS.includes(c.flag))), "diferencial/BRICS só pode citar países do BRICS");

// Fonte única de região nas seções filtráveis + aviso no topo + blocos recebendo a região.
const comps = { spreads: "SpreadsTable", volatility: "VolatilityChart", debt: "DebtComposition" };
for (const [id, comp] of Object.entries(comps)) {
  const src = await readFile(path.join(root, `src/components/${comp}.tsx`), "utf8");
  assert(src.includes("inRegion("), `${comp} deve usar inRegion (fonte única de região)`);
  assert(!/\["BR", "CN", "IN", "RU", "ZA"\]/.test(src), `${comp} ainda tem lista de região própria`);
}
const vol = await readFile(path.join(root, "src/components/VolatilityChart.tsx"), "utf8");
assert(vol.includes("detailsFiltered.map("), "tabela de detalhes da volatilidade deve obedecer ao filtro");
const hero = await readFile(path.join(root, "src/components/HeroSection.tsx"), "utf8");
assert(hero.includes("REGION_FILTERED_SECTIONS") && hero.includes("data-region-applied"), "topo deve indicar onde o filtro age");

const app = await readFile(path.join(root, "src/App.tsx"), "utf8");
for (const id of EXPECTED) {
  const filtered = REGION_FILTERED_SECTIONS.some((x) => x.id === id);
  const tag = filtered ? `<SectionLayers id="${id}" region={regionFilter} />` : `<SectionLayers id="${id}" />`;
  assert(app.includes(tag), `App.tsx deveria montar ${tag}`);
}
assert(!/Earth2ForecastSection[^\n]*SectionLayers/.test(app), "Earth-2 está fora do escopo do M2");

if (failures) { console.error(`section layers: ${failures} falha(s)`); process.exit(1); }
console.log(`ODIN section layers (M2): PASS — ${ids.length} seções × 5 camadas, renderizadas em PT e EN`);
