// ODIN — teste da auditoria de fontes públicas (PR 2a), sem rede e sem LLM.
// Confere que:
//  1. todo registro de src/data/dataAudit.ts tem status válido e, se
//     verified/corrected, ao menos uma evidência com URL https e data ISO;
//  2. os valores corrigidos/verificados no código batem com as evidências;
//  3. todo sourceRef tem URL https e data válida;
//  4. indicadores e KPIs de dados não verificados aparecem marcados na interface.
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import HeroSection from "@/components/HeroSection";
import SectionLayers from "@/components/SectionLayers";
import { setLocale } from "@/i18n";
export { DATA_AUDIT, isUnverified, auditEntry } from "@/data/dataAudit";
export { kpis, tcxHedgingData, countryDebtData, sourceRefs, inflectionPoints } from "@/data/lcBondsData";
export { goldReserves, goldShare } from "@/data/goldOilData";
export { SECTION_LAYERS } from "@/data/sectionLayers";
export function renderHero(locale) { setLocale(locale); return renderToStaticMarkup(createElement(HeroSection, { regionFilter: "all", onRegionChange: () => {} })); }
export function renderLayers(id, locale) { setLocale(locale); return renderToStaticMarkup(createElement(SectionLayers, { id })); }
`;
const outdir = path.join(root, "node_modules/.cache/odin-audit");
await mkdir(outdir, { recursive: true });
await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node", outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
});
const m = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);

// 1. Estrutura do registro
const STATUSES = new Set(["verified", "corrected", "unverified", "replace_2c"]);
const ids = m.DATA_AUDIT.map((e) => e.id);
assert(new Set(ids).size === ids.length, "ids duplicados na auditoria");
for (const e of m.DATA_AUDIT) {
  assert(STATUSES.has(e.status), `[${e.id}] status inválido: ${e.status}`);
  assert(e.notePt && e.noteEn && e.datasetPt && e.datasetEn && e.location, `[${e.id}] campos de texto incompletos`);
  if (e.status === "verified" || e.status === "corrected") {
    assert(e.evidence.length >= 1, `[${e.id}] ${e.status} sem evidência`);
    for (const ev of e.evidence) {
      assert(/^https:\/\//.test(ev.url), `[${e.id}] evidência sem URL https: ${ev.url}`);
      assert(/^\d{4}-\d{2}-\d{2}$/.test(ev.publishedAt), `[${e.id}] data inválida: ${ev.publishedAt}`);
      assert(ev.claim && ev.publisher && ev.value, `[${e.id}] evidência incompleta`);
    }
  }
  if (e.status === "corrected") assert(e.previous, `[${e.id}] corrigido sem valor anterior`);
}

// 2. Código ↔ evidência
const year = (arr, y) => arr.find((r) => r.year === y);
assert(year(m.tcxHedgingData, 2025).annualHedged === 2.84, "TCX 2025 deve ser 2.84");
assert(year(m.tcxHedgingData, 2023).annualHedged === 2.3, "TCX 2023 deve ser 2.3");
assert(year(m.tcxHedgingData, 2022).annualHedged === 1.38, "TCX 2022 deve ser 1.38");
assert(m.kpis.tcxHedgedValue === 20 && /20/.test(m.kpis.tcxHedgedCumulative), "KPI TCX acumulado deve ser ~20 bi");
assert(m.kpis.tcxCurrencies === 71, "TCX moedas desde 2007 deve ser 71");
assert(m.kpis.ndbLCTarget === 30, "meta NDB deve ser 30%");
assert(m.kpis.cipsValue === 175, "CIPS 2024 deve ser 175");
assert(m.kpis.dividaBrutaBR === 82.6, "DBGG deve ser 82.6 (jul/2026)");
assert(m.countryDebtData.find((c) => c.flag === "BR").debtToGDP === m.kpis.dividaBrutaBR, "DBGG do Brasil divergente entre KPI e countryDebtData");
const swap = m.inflectionPoints.find((p) => p.event.startsWith("PBOC↔BCB"));
assert(swap && /157/.test(swap.value) && /190/.test(swap.value), "swap PBOC↔BCB deve citar 190/157");
const g25 = year(m.goldReserves, 2025);
const goldEv = m.auditEntry("gold-reserves").evidence[0].value.split("/").map(Number);
assert(JSON.stringify([g25.China, g25.Russia, g25.India, g25.Brazil, g25.Turkey, g25.Poland]) === JSON.stringify(goldEv), `ouro 2025 diverge da evidência: ${JSON.stringify(g25)}`);
assert(m.goldReserves.length === 11 && m.goldReserves[0].year === 2015, "série de ouro deve cobrir 2015–2025");
assert(!m.goldShare.some((g) => g.flag === "RU"), "Rússia não deve aparecer em ouro % das reservas (sem total publicado)");

// 3. sourceRefs
for (const r of m.sourceRefs) {
  assert(/^https:\/\//.test(r.url), `sourceRef ${r.id} sem URL https`);
  assert(!Number.isNaN(Date.parse(r.lastUpdated)), `sourceRef ${r.id} com data inválida`);
  assert(!/%%/.test(r.methodologyPt + r.methodology), `sourceRef ${r.id} com "%%" (não passa pelo i18n)`);
}
const bbg = m.sourceRefs.find((r) => r.id === "bloomberg");
assert(/não registrada/.test(bbg.methodologyPt) && /No methodology recorded/.test(bbg.methodology), "Bloomberg deve declarar metodologia não registrada");

// 4. Marcação na interface
for (const locale of ["pt", "en"]) {
  const hero = m.renderHero(locale);
  for (const id of ["lc-market-total", "brics-trade-lc", "ndb-lc-share-disbursed"]) {
    assert(m.isUnverified(id), `[${id}] deveria estar não verificado`);
    assert(hero.includes(`data-unverified="${id}"`), `[${locale}] KPI ${id} sem marca de não verificado`);
  }
  assert(!/desatualizado|outdated/i.test(hero), `[${locale}] hero não deve exibir "desatualizado"`);
  assert(!hero.includes("%%"), `[${locale}] hero exibe "%%" literal`);
}
let flagged = 0;
for (const s of m.SECTION_LAYERS) {
  for (const ind of s.indicators) if (ind.unverified) flagged += 1;
  if (s.indicators.some((i) => i.unverified)) {
    const html = m.renderLayers(s.id, "pt");
    assert(html.includes("não verificado"), `[${s.id}] indicador não verificado sem marca no HTML`);
  }
}
assert(flagged >= 10, `esperava ≥10 indicadores marcados, obteve ${flagged}`);
const gold = m.SECTION_LAYERS.find((s) => s.id === "gold");
assert(gold.indicators.every((i) => !i.unverified && i.sourceId === "wgc-ifs"), "ouro deve estar verificado e citar wgc-ifs");

const counts = m.DATA_AUDIT.reduce((a, e) => ({ ...a, [e.status]: (a[e.status] ?? 0) + 1 }), {});
console.log("auditoria:", JSON.stringify(counts), "· indicadores marcados:", flagged);
if (failures) { console.error(`${failures} falha(s)`); process.exit(1); }
console.log("OK — auditoria de fontes consistente com o código e a interface.");
