// ODIN — teste de credibilidade pré-prospecção, sem rede e sem LLM.
// Cobre: selo CBAM dinâmico, textos duráveis, remoção de Bloomberg,
// links comerciais no rodapé e no Briefing.
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const outdir = path.join(root, "node_modules/.cache/odin-credibility");
await mkdir(outdir, { recursive: true });

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import Footer from "@/components/Footer";
import { BriefingView } from "@/components/BriefingODIN";
import { setLocale, t } from "@/i18n";
import { CBAM_CERT_PRICES } from "@/data/carbonData";
export function renderFooter(locale) {
  setLocale(locale);
  return renderToStaticMarkup(createElement(Footer, { onSourceClick: () => {} }));
}
export function renderBriefing(locale) {
  setLocale(locale);
  const items = [{
    sectionId: "carbon", titlePt: "Carbono", titleEn: "Carbon",
    happenedPt: "Q3 subiu.", happenedEn: "Q3 rose.",
    whyPt: "Importa.", whyEn: "Matters.",
    watchSignalPt: "Sinal.", watchSignalEn: "Signal.",
    watchWhyPt: "Por quê.", watchWhyEn: "Why.",
    anchor: "#carbon", validAsOf: "2026-10-05", sourceUrl: null,
  }];
  return renderToStaticMarkup(createElement(BriefingView, { items, locale, updatedAt: null }));
}
export function getT(key, locale) { setLocale(locale); return t(key); }
export { CBAM_CERT_PRICES };
`;

await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node",
  outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
  define: { "import.meta.env.BASE_URL": '""', "import.meta.env.DEV": "false", "import.meta.env.PROD": "true" },
});

const mod = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);
const { renderFooter, renderBriefing, getT, CBAM_CERT_PRICES } = mod;

let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

const DEMO_HREF = "mailto:guilhermemachado.ceo@hubstry.dev";

// ── A. CBAM — dados e badge dinâmico ─────────────────────────────────────────

// A1. Último preço publicado é Q3 2026 (não Q2, não Q4 com priceEur null)
const lastPublished = CBAM_CERT_PRICES.filter((c) => c.priceEur !== null && c.published !== null).at(-1);
assert(lastPublished?.quarter === "Q3 2026",
  `último preço publicado deve ser Q3 2026; obteve ${lastPublished?.quarter}`);
assert(lastPublished?.priceEur === 82.32,
  `preço Q3 deve ser 82.32; obteve ${lastPublished?.priceEur}`);
assert(lastPublished?.published === "2026-10-05",
  `data de publicação Q3 deve ser 2026-10-05; obteve ${lastPublished?.published}`);

// A2. badgeOfficialLabel não contém trimestre fixo
{
  const labelPt = getT("carbon.badgeOfficialLabel", "pt");
  const labelEn = getT("carbon.badgeOfficialLabel", "en");
  assert(labelPt === "DADO OFICIAL", `badgeOfficialLabel PT deve ser "DADO OFICIAL"; obteve "${labelPt}"`);
  assert(labelEn === "OFFICIAL DATA", `badgeOfficialLabel EN deve ser "OFFICIAL DATA"; obteve "${labelEn}"`);
  assert(!/Q[1-4]|2026|2027/.test(labelPt), "badgeOfficialLabel PT não deve conter trimestre fixo");
  assert(!/Q[1-4]|2026|2027/.test(labelEn), "badgeOfficialLabel EN não deve conter trimestre fixo");
}

// ── B. Textos duráveis ────────────────────────────────────────────────────────

// B1. certPendingNote: não menciona Q3, menciona Q4
{
  const notePt = getT("carbon.certPendingNote", "pt");
  const noteEn = getT("carbon.certPendingNote", "en");
  assert(!/Q3/.test(notePt), `certPendingNote PT não deve mencionar Q3; obteve: "${notePt}"`);
  assert(!/Q3/.test(noteEn), `certPendingNote EN não deve mencionar Q3; obteve: "${noteEn}"`);
  assert(/Q4/.test(notePt), `certPendingNote PT deve mencionar Q4`);
  assert(/Q4/.test(noteEn), `certPendingNote EN deve mencionar Q4`);
}

// B2. instrumentsNote: sem referência fixa a Q2 ou Q3
{
  const notePt = getT("carbon.instrumentsNote", "pt");
  const noteEn = getT("carbon.instrumentsNote", "en");
  assert(!/Q2|Q3/.test(notePt), `instrumentsNote PT não deve conter Q2/Q3; obteve: "${notePt}"`);
  assert(!/Q2|Q3/.test(noteEn), `instrumentsNote EN não deve conter Q2/Q3; obteve: "${noteEn}"`);
  assert(/World Bank/i.test(notePt), "instrumentsNote PT deve referenciar World Bank");
  assert(/World Bank/i.test(noteEn), "instrumentsNote EN deve referenciar World Bank");
}

// B3. footer.snapshot: texto durável, sem Q2/Q3 fixo
{
  const snapPt = getT("footer.snapshot", "pt");
  const snapEn = getT("footer.snapshot", "en");
  assert(!/Q2|Q3|2026\.07|2026\.10/.test(snapPt),
    `footer.snapshot PT não deve conter edição trimestral fixa; obteve: "${snapPt}"`);
  assert(!/Q2|Q3|edition 2026/.test(snapEn),
    `footer.snapshot EN não deve conter edição trimestral fixa; obteve: "${snapEn}"`);
  assert(/verificação|verification/i.test(snapPt + snapEn),
    "footer.snapshot deve mencionar verificação em PT ou EN");
}

// ── C. Rodapé — Bloomberg e link comercial ────────────────────────────────────
{
  const htmlPt = renderFooter("pt");
  const htmlEn = renderFooter("en");

  // C1. Bloomberg removido
  assert(!htmlPt.includes("Bloomberg"),
    "rodapé PT não deve conter Bloomberg");
  assert(!htmlEn.includes("Bloomberg"),
    "rodapé EN não deve conter Bloomberg");

  // C2. Demais fontes da lista estática presentes
  assert(htmlPt.includes("BIS") && htmlPt.includes("TCX"),
    "rodapé PT deve manter BIS e TCX na lista estática");

  // C3. Link comercial presente em PT e EN
  assert(htmlPt.includes(DEMO_HREF),
    "rodapé PT deve conter link comercial (mailto)");
  assert(htmlEn.includes(DEMO_HREF),
    "rodapé EN deve conter link comercial (mailto)");

  // C4. Texto demoLink em PT e EN
  assert(htmlPt.includes("demonstração"),
    "rodapé PT: texto do link comercial deve conter 'demonstração'");
  assert(htmlEn.includes("demo"),
    "rodapé EN: texto do link comercial deve conter 'demo'");
}

// ── D. Briefing — link comercial ─────────────────────────────────────────────
{
  const htmlPt = renderBriefing("pt");
  const htmlEn = renderBriefing("en");

  // D1. data-demo-link presente em PT e EN
  assert(htmlPt.includes("data-demo-link"),
    "Briefing PT deve conter data-demo-link");
  assert(htmlEn.includes("data-demo-link"),
    "Briefing EN deve conter data-demo-link");

  // D2. mailto presente em PT e EN
  assert(htmlPt.includes(DEMO_HREF),
    "Briefing PT deve conter link comercial (mailto)");
  assert(htmlEn.includes(DEMO_HREF),
    "Briefing EN deve conter link comercial (mailto)");
}

if (failures) { console.error(`credibility: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN credibility: PASS — 18 casos testados");
