// ODIN — teste do Briefing (PR 2b) e do vocabulário controlado, sem rede e sem LLM.
//
// Briefing — regra "seleção + condensação, sem inferência nova":
//  · só seções com M1 revisado (reviewStatus "approved" + reviewedBy);
//  · cada linha exibida é trecho LITERAL de um campo da MESMA seção
//    (claim do tipo fato, tese sem o rótulo "Interpretação:", What to Watch);
//  · nenhuma linha vem de outra seção (nada de tese entre seções);
//  · mutações do M1 (claim novo, seção não revisada) refletem/excluem como esperado.
//
// Vocabulário controlado — só rótulos, títulos, selos e estados (data-term):
//  · todo elemento data-term="k" exibe exatamente GLOSSARY[k] no idioma;
//  · termos obrigatórios presentes no Briefing, em Fontes e sinais e no topo;
//  · as camadas do Contrato (M1) usam em InsightBox.tsx os nomes do glossário;
//  · o cabeçalho antigo ("Camadas ODIN · estruturais") não volta.
// Texto editorial do M1 NÃO é verificado aqui (redação livre).
import { build } from "esbuild";
import { readFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { BriefingView } from "@/components/BriefingODIN";
import SectionLayers from "@/components/SectionLayers";
import HeroSection from "@/components/HeroSection";
import { setLocale } from "@/i18n";
export { buildBriefing, stripInterpretationLabel, BRIEFING_SECTIONS } from "@/data/briefing";
export { GLOSSARY, term } from "@/data/glossary";
export { SECTION_LAYERS } from "@/data/sectionLayers";
export function renderBriefing(items, locale) { setLocale(locale); return renderToStaticMarkup(createElement(BriefingView, { items, locale, updatedAt: "2026-09-30T17:53:41.209Z" })); }
export function renderLayers(id, locale) { setLocale(locale); return renderToStaticMarkup(createElement(SectionLayers, { id, region: id === "spreads" ? "BRICS" : "all" })); }
export function renderHero(locale) { setLocale(locale); return renderToStaticMarkup(createElement(HeroSection, { regionFilter: "all", onRegionChange: () => {} })); }
`;
const outdir = path.join(root, "node_modules/.cache/odin-briefing");
await mkdir(outdir, { recursive: true });
await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node", outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
});
const m = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);

// ── Briefing ───────────────────────────────────────────────────────────────
const v2 = JSON.parse(await readFile(path.join(root, "public/data/insights.v2.json"), "utf8"));
const sections = v2.data.sections;
const items = m.buildBriefing(sections);
const approved = m.BRIEFING_SECTIONS.filter((s) => sections[s.id]?.reviewStatus === "approved" && sections[s.id]?.reviewedBy).map((s) => s.id);
assert(items.length >= 1, "Briefing vazio com M1 revisado publicado");
assert(JSON.stringify(items.map((i) => i.sectionId)) === JSON.stringify(approved), `Briefing deve ter exatamente as seções revisadas, na ordem da página: ${items.map((i) => i.sectionId)} vs ${approved}`);

const fieldsOf = (e) => ({
  claimsPt: (e.claims ?? []).filter((c) => c.kind === "fact").map((c) => c.textPt ?? c.pt),
  claimsEn: (e.claims ?? []).filter((c) => c.kind === "fact").map((c) => c.textEn ?? c.en),
  thesisPt: e.thesis?.pt ?? "", thesisEn: e.thesis?.en ?? "",
  watch: (e.whatToWatch ?? []).flatMap((w) => [w.signal, w.whyItMatters]),
});
for (const it of items) {
  const own = fieldsOf(sections[it.sectionId]);
  const at = `[briefing:${it.sectionId}]`;
  assert(own.claimsPt.includes(it.happenedPt), `${at} "O que aconteceu" (PT) não é um claim de fato literal da seção`);
  assert(own.claimsEn.includes(it.happenedEn), `${at} "O que aconteceu" (EN) não é um claim de fato literal da seção`);
  const sameTail = (full, part) => full.toLowerCase().endsWith(part.toLowerCase()) && full.endsWith(part.slice(1));
  assert(it.whyPt.length > 20 && sameTail(own.thesisPt, it.whyPt), `${at} "Por que importa" (PT) não é a tese literal da seção`);
  assert(it.whyEn.length > 20 && sameTail(own.thesisEn, it.whyEn), `${at} "Por que importa" (EN) não é a tese literal da seção`);
  const rest = own.thesisPt.replace(/^Interpretação\s*:\s*/, "");
  assert(rest.charAt(0).toUpperCase() + rest.slice(1) === it.whyPt, `${at} tese PT alterada além do rótulo e da maiúscula inicial`);
  assert(own.watch.includes(it.watchSignal) && own.watch.includes(it.watchWhy), `${at} "O que observar" não vem do What to Watch da seção`);
  assert(it.anchor === `#${it.sectionId}`, `${at} âncora errada`);
  // Nenhuma linha pode vir de outra seção.
  for (const other of items.filter((o) => o.sectionId !== it.sectionId)) {
    const o = fieldsOf(sections[other.sectionId]);
    const pool = [...o.claimsPt, ...o.claimsEn, o.thesisPt, o.thesisEn, ...o.watch].join("\n");
    for (const line of [it.happenedPt, it.whyPt, it.watchSignal]) assert(!pool.includes(line), `${at} linha aparece em ${other.sectionId}: "${line.slice(0, 60)}"`);
  }
}
// Mutações: seção não revisada sai; seção sem fato sai; ordem fixa.
const clone = structuredClone(sections);
clone.carbon.reviewStatus = "pending";
assert(!m.buildBriefing(clone).some((i) => i.sectionId === "carbon"), "seção não aprovada entrou no Briefing");
const clone2 = structuredClone(sections);
delete clone2.climate.reviewedBy;
assert(!m.buildBriefing(clone2).some((i) => i.sectionId === "climate"), "seção sem reviewedBy entrou no Briefing");
const clone3 = structuredClone(sections);
clone3.blockchain.claims = clone3.blockchain.claims.map((c) => ({ ...c, kind: "interpretation" }));
assert(!m.buildBriefing(clone3).some((i) => i.sectionId === "blockchain"), "seção sem claim de fato entrou no Briefing");
assert(m.stripInterpretationLabel("Interpretação: abc") === "Abc" && m.stripInterpretationLabel("abc Interpretação: x") === "abc Interpretação: x", "stripInterpretationLabel deve remover só o rótulo inicial");

// ── Vocabulário controlado ─────────────────────────────────────────────────
const G = m.GLOSSARY;
for (const [k, t] of Object.entries(G)) {
  assert(t.pt && t.en && t.defPt && t.defEn, `glossário: ${k} incompleto`);
}
const ptTerms = Object.values(G).map((t) => t.pt.toLowerCase());
const dup = ptTerms.filter((x, i) => ptTerms.indexOf(x) !== i && x !== "what to watch");
assert(!dup.length, `glossário: termos PT duplicados ${dup}`);

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function checkTerms(html, locale, where, required) {
  const seen = new Set();
  const re = /data-term="(\w+)"[^>]*>([^<]*)</g;
  let mm;
  while ((mm = re.exec(html))) {
    const [, k, text] = mm;
    assert(k in G, `[${where}/${locale}] data-term desconhecido: ${k}`);
    if (k in G) assert(decode(text).trim() === G[k][locale], `[${where}/${locale}] "${k}" exibe "${decode(text).trim()}", glossário diz "${G[k][locale]}"`);
    seen.add(k);
  }
  for (const k of required) assert(seen.has(k), `[${where}/${locale}] termo obrigatório ausente: ${k}`);
}
for (const locale of ["pt", "en"]) {
  const b = m.renderBriefing(items, locale);
  checkTerms(b, locale, "briefing", ["briefing", "humanReviewed", "whatHappened", "whyItMatters", "whatToObserve", "seeEvidence", "referenceDate"]);
  for (const it of items) assert(b.includes(`href="${it.anchor}"`), `[briefing/${locale}] sem link de evidência para ${it.sectionId}`);
  assert(!/undefined|NaN/.test(b), `[briefing/${locale}] valor inválido no HTML`);

  for (const s of m.SECTION_LAYERS) {
    const html = m.renderLayers(s.id, locale);
    const req = ["sourcesAndSignals", "noAI", "sourcesAndReferenceDate", "keyIndicators", "eventsAndMilestones", "whatToWatch", "economicLawLens", "source"];
    if (s.indicators.some((i) => i.unverified)) req.push("unverified");
    checkTerms(html, locale, `layers:${s.id}`, req);
    assert(!/Camadas ODIN|ODIN Layers|estruturais|structural ·/.test(html), `[layers:${s.id}/${locale}] cabeçalho antigo ainda presente`);
    assert(!/text-\[#FF8C00\][^>]*data-unverified/.test(html), `[layers:${s.id}/${locale}] "não verificado" ainda em laranja`);
  }
  const spreads = m.renderLayers("spreads", locale);
  checkTerms(spreads, locale, "layers:spreads(BRICS)", ["region"]);

  const hero = m.renderHero(locale);
  checkTerms(hero, locale, "hero", ["unverified"]);
  assert((hero.match(/data-unverified-legend/g) ?? []).length === 1, `[hero/${locale}] legenda de "não verificado" deve aparecer uma vez`);
}
// Camadas do Contrato M1: nomes em InsightBox.tsx iguais aos do glossário.
const insightSrc = await readFile(path.join(root, "src/components/InsightBox.tsx"), "utf8");
for (const k of ["strategicContext", "odinThesis", "economicLawLens", "stakeholderImplications", "whatToWatch"]) {
  assert(insightSrc.includes(`"${G[k].pt}"`) && insightSrc.includes(`"${G[k].en}"`) || (k === "whatToWatch" && insightSrc.includes("What to Watch")), `InsightBox: camada ${k} diverge do glossário`);
}
// Página monta o Briefing antes do banner de contexto.
const app = await readFile(path.join(root, "src/App.tsx"), "utf8");
assert(app.indexOf("<BriefingODIN />") > 0 && app.indexOf("<BriefingODIN />") < app.indexOf("<ContextBanner />"), "App deve montar o Briefing no topo, antes do banner de contexto");

console.log(`Briefing: ${items.map((i) => i.sectionId).join(", ")} · glossário: ${Object.keys(G).length} termos`);
if (failures) { console.error(`${failures} falha(s)`); process.exit(1); }
console.log("OK — Briefing reaproveita o M1 literalmente e o vocabulário controlado confere em PT e EN.");
