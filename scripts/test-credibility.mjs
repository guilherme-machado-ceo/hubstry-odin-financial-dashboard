// ODIN — teste de credibilidade pré-prospecção, sem rede e sem LLM.
// Cobre: selo CBAM (renderizado via CarbonBadge + funções puras), textos
// duráveis, remoção de Bloomberg e links comerciais no rodapé e no Briefing.
//
// CarbonBadge é o sub-componente exportado por CarbonPricingSection.tsx que
// encapsula exatamente o JSX do selo. Testá-lo via renderToStaticMarkup
// equivale a testar o selo real sem depender do Recharts.
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
import { CarbonBadge } from "@/components/CarbonPricingSection";
import { setLocale, t } from "@/i18n";
import { CBAM_CERT_PRICES, selectLastPublished, formatBadgeDate, formatBadgePrice } from "@/data/carbonData";

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
export function renderBadge(cert, locale) {
  setLocale(locale);
  return renderToStaticMarkup(createElement(CarbonBadge, { currentCert: cert, updatedAt: null }));
}
export function getT(key, locale) { setLocale(locale); return t(key); }
export { CBAM_CERT_PRICES, selectLastPublished, formatBadgeDate, formatBadgePrice };
`;

await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node",
  outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
  define: {
    "import.meta.env.BASE_URL": '""',
    "import.meta.env.DEV": "false",
    "import.meta.env.PROD": "true",
  },
});

const mod = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);
const { renderFooter, renderBriefing, renderBadge, getT, CBAM_CERT_PRICES, selectLastPublished, formatBadgeDate, formatBadgePrice } = mod;

let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

const DEMO_HREF = "mailto:guilhermemachado.ceo@hubstry.dev";

// ── A. selectLastPublished — lógica de seleção ────────────────────────────────

// A1. Retorna Q3 2026 (último com priceEur válido e published válido)
const cert = selectLastPublished(CBAM_CERT_PRICES);
assert(cert?.quarter === "Q3 2026",
  `selectLastPublished deve retornar Q3 2026; obteve ${cert?.quarter}`);
assert(cert?.priceEur === 82.32,
  `preço Q3 deve ser 82.32; obteve ${cert?.priceEur}`);
assert(cert?.published === "2026-10-05",
  `publicação Q3 deve ser 2026-10-05; obteve ${cert?.published}`);

// A2. Q4 com priceEur null nunca é selecionado
const q4only = [{ quarter: "Q4 2026", published: "2027-01-04", priceEur: null }];
assert(selectLastPublished(q4only) === undefined,
  "Q4 com priceEur null não deve ser selecionado");

// A3. Lista vazia → undefined (fallback explícito)
assert(selectLastPublished([]) === undefined,
  "lista vazia deve retornar undefined");

// ── B. formatBadgeDate — datas legíveis ──────────────────────────────────────

// B1. PT → DD/MM/AAAA
const datePt = formatBadgeDate("2026-10-05", "pt");
assert(datePt === "05/10/2026",
  `formatBadgeDate PT deve ser "05/10/2026"; obteve "${datePt}"`);

// B2. EN → Mmm D, YYYY
const dateEn = formatBadgeDate("2026-10-05", "en");
assert(/Oct\s+5/.test(dateEn) && /2026/.test(dateEn),
  `formatBadgeDate EN deve conter "Oct 5" e "2026"; obteve "${dateEn}"`);

// ── C. formatBadgePrice — preço localizado ───────────────────────────────────

// C1. PT → € com vírgula decimal
const pricePt = formatBadgePrice(82.32, "pt");
assert(pricePt === "€82,32",
  `formatBadgePrice PT deve ser "€82,32"; obteve "${pricePt}"`);

// C2. EN → € com ponto decimal
const priceEn = formatBadgePrice(82.32, "en");
assert(priceEn === "€82.32",
  `formatBadgePrice EN deve ser "€82.32"; obteve "${priceEn}"`);

// ── D. CarbonBadge renderizado — HTML real do selo ───────────────────────────

// D1. PT: Q3 2026, data 05/10/2026 e preço €82,32
{
  const html = renderBadge(cert, "pt");
  assert(html.includes("Q3 2026"),
    `CarbonBadge PT deve conter "Q3 2026"; html: ${html.slice(0, 300)}`);
  assert(html.includes("05/10/2026"),
    `CarbonBadge PT deve conter "05/10/2026"; html: ${html.slice(0, 300)}`);
  assert(html.includes("€82,32"),
    `CarbonBadge PT deve conter "€82,32"; html: ${html.slice(0, 300)}`);
  assert(html.includes("DADO OFICIAL"),
    `CarbonBadge PT deve conter "DADO OFICIAL"`);
}

// D2. EN: Q3 2026, data legível e preço €82.32
{
  const html = renderBadge(cert, "en");
  assert(html.includes("Q3 2026"),
    `CarbonBadge EN deve conter "Q3 2026"; html: ${html.slice(0, 300)}`);
  assert(/Oct\s+5/.test(html) && html.includes("2026"),
    `CarbonBadge EN deve conter data legível "Oct 5, 2026"; html: ${html.slice(0, 300)}`);
  assert(html.includes("€82.32"),
    `CarbonBadge EN deve conter "€82.32"; html: ${html.slice(0, 300)}`);
  assert(html.includes("OFFICIAL DATA"),
    `CarbonBadge EN deve conter "OFFICIAL DATA"`);
}

// D3. Fallback explícito quando cert é undefined
{
  const html = renderBadge(undefined, "pt");
  assert(html.includes("—"),
    "CarbonBadge sem cert deve exibir fallback '—'");
  assert(!html.includes("Q3"),
    "CarbonBadge sem cert não deve exibir trimestre");
}

// ── E. Textos duráveis ────────────────────────────────────────────────────────

// E1. certPendingNote: não menciona Q3, menciona Q4
{
  const notePt = getT("carbon.certPendingNote", "pt");
  const noteEn = getT("carbon.certPendingNote", "en");
  assert(!/Q3/.test(notePt), `certPendingNote PT não deve mencionar Q3; obteve: "${notePt}"`);
  assert(!/Q3/.test(noteEn), `certPendingNote EN não deve mencionar Q3; obteve: "${noteEn}"`);
  assert(/Q4/.test(notePt), `certPendingNote PT deve mencionar Q4`);
  assert(/Q4/.test(noteEn), `certPendingNote EN deve mencionar Q4`);
}

// E2. instrumentsNote: sem referência fixa a Q2 ou Q3
{
  const notePt = getT("carbon.instrumentsNote", "pt");
  const noteEn = getT("carbon.instrumentsNote", "en");
  assert(!/Q2|Q3/.test(notePt), `instrumentsNote PT não deve conter Q2/Q3; obteve: "${notePt}"`);
  assert(!/Q2|Q3/.test(noteEn), `instrumentsNote EN não deve conter Q2/Q3; obteve: "${noteEn}"`);
  assert(/World Bank/i.test(notePt), "instrumentsNote PT deve referenciar World Bank");
  assert(/World Bank/i.test(noteEn), "instrumentsNote EN deve referenciar World Bank");
}

// E3. footer.snapshot: texto durável, sem Q2/Q3 nem edição fixa
{
  const snapPt = getT("footer.snapshot", "pt");
  const snapEn = getT("footer.snapshot", "en");
  assert(!/Q2|Q3|2026\.07|2026\.10/.test(snapPt),
    `footer.snapshot PT não deve conter edição fixa; obteve: "${snapPt}"`);
  assert(!/Q2|Q3|edition 2026/.test(snapEn),
    `footer.snapshot EN não deve conter edição fixa; obteve: "${snapEn}"`);
  assert(/verificação|verification/i.test(snapPt + snapEn),
    "footer.snapshot deve mencionar verificação");
}

// ── F. Rodapé — Bloomberg e link comercial ────────────────────────────────────
{
  const htmlPt = renderFooter("pt");
  const htmlEn = renderFooter("en");

  assert(!htmlPt.includes("Bloomberg"), "rodapé PT não deve conter Bloomberg");
  assert(!htmlEn.includes("Bloomberg"), "rodapé EN não deve conter Bloomberg");
  assert(htmlPt.includes("BIS") && htmlPt.includes("TCX"),
    "rodapé PT deve manter BIS e TCX");
  assert(htmlPt.includes(DEMO_HREF), "rodapé PT deve conter link comercial");
  assert(htmlEn.includes(DEMO_HREF), "rodapé EN deve conter link comercial");
  assert(htmlPt.includes("demonstração"), "rodapé PT: texto 'demonstração'");
  assert(htmlEn.includes("demo"), "rodapé EN: texto 'demo'");
}

// ── G. Briefing — link comercial ─────────────────────────────────────────────
{
  const htmlPt = renderBriefing("pt");
  const htmlEn = renderBriefing("en");

  assert(htmlPt.includes("data-demo-link"), "Briefing PT deve conter data-demo-link");
  assert(htmlEn.includes("data-demo-link"), "Briefing EN deve conter data-demo-link");
  assert(htmlPt.includes(DEMO_HREF), "Briefing PT deve conter link comercial");
  assert(htmlEn.includes(DEMO_HREF), "Briefing EN deve conter link comercial");
}

if (failures) { console.error(`credibility: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN credibility: PASS — 26 casos testados (CarbonBadge renderizado, funções puras, textos, rodapé, Briefing)");
