// ODIN — vocabulário controlado da interface determinística, sem rede e sem LLM.
// Confere data-term, completude/unicidade do glossário e estado "não verificado".
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
let failures = 0;
const assert = (condition, message) => {
  if (!condition) { failures += 1; console.error("FALHA:", message); }
};

const entry = 'import { renderToStaticMarkup } from "react-dom/server";\\n' +
  'import { createElement } from "react";\\n' +
  'import SectionLayers from "@/components/SectionLayers";\\n' +
  'import HeroSection from "@/components/HeroSection";\\n' +
  'import { setLocale } from "@/i18n";\\n' +
  'export { GLOSSARY } from "@/data/glossary";\\n' +
  'export { SECTION_LAYERS } from "@/data/sectionLayers";\\n' +
  'export function renderLayers(id, locale) { setLocale(locale); return renderToStaticMarkup(createElement(SectionLayers, { id, region: id === "spreads" ? "BRICS" : "all" })); }\\n' +
  'export function renderHero(locale) { setLocale(locale); return renderToStaticMarkup(createElement(HeroSection, { regionFilter: "all", onRegionChange: () => {} })); }\\n';

const outdir = path.join(root, "node_modules/.cache/odin-vocabulary");
await mkdir(outdir, { recursive: true });
await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node", outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
});
const m = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);
const glossary = m.GLOSSARY;

for (const [key, term] of Object.entries(glossary)) {
  assert(term.pt && term.en && term.defPt && term.defEn, "glossário: " + key + " incompleto");
}
const portugueseTerms = Object.values(glossary).map((term) => term.pt.toLowerCase());
const duplicates = portugueseTerms.filter((term, index) => portugueseTerms.indexOf(term) !== index && term !== "what to watch");
assert(!duplicates.length, "glossário: termos PT duplicados " + duplicates);

const decode = (text) => text.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
function checkTerms(html, locale, context, required) {
  const seen = new Set();
  const re = /data-term="(\w+)"[^>]*>([^<]*)</g;
  let match;
  while ((match = re.exec(html))) {
    const [, key, text] = match;
    assert(key in glossary, "[" + context + "/" + locale + "] data-term desconhecido: " + key);
    if (key in glossary) assert(decode(text).trim() === glossary[key][locale], "[" + context + "/" + locale + "] " + key + " diverge do glossário");
    seen.add(key);
  }
  for (const key of required) assert(seen.has(key), "[" + context + "/" + locale + "] termo obrigatório ausente: " + key);
}

for (const locale of ["pt", "en"]) {
  for (const section of m.SECTION_LAYERS) {
    const html = m.renderLayers(section.id, locale);
    const required = ["sourcesAndSignals", "noAI", "sourcesAndReferenceDate", "keyIndicators", "eventsAndMilestones", "whatToWatch", "economicLawLens", "source"];
    if (section.indicators.some((indicator) => indicator.verification === "unverified")) required.push("unverified");
    checkTerms(html, locale, "layers:" + section.id, required);
    assert(!/Camadas ODIN|ODIN Layers|estruturais|structural ·/.test(html), "[layers:" + section.id + "/" + locale + "] cabeçalho antigo ainda presente");
    assert(!/text-\[#FF8C00\][^>]*data-unverified/.test(html), "[layers:" + section.id + "/" + locale + "] não verificado ainda em laranja");
  }
  const spreads = m.renderLayers("spreads", locale);
  checkTerms(spreads, locale, "layers:spreads(BRICS)", ["region"]);
  const hero = m.renderHero(locale);
  checkTerms(hero, locale, "hero", ["unverified"]);
  assert((hero.match(/data-unverified-legend/g) ?? []).length === 1, "[hero/" + locale + "] legenda não verificado deve aparecer uma vez");
}
if (failures) { console.error("vocabulary: " + failures + " falha(s)"); process.exit(1); }
console.log("OK — vocabulário controlado confere em PT e EN para " + Object.keys(glossary).length + " termos.");
