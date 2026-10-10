// ODIN — teste da trava de vencimento de Insights (expiry lock), sem LLM.
// Empacota InsightBoxPresentation e as funções puras de insightReview com esbuild
// e valida todos os casos com data controlada.
import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const outdir = path.join(root, "node_modules/.cache/odin-insight-review");
await mkdir(outdir, { recursive: true });

const MAX_DELAY_MS = 24 * 60 * 60 * 1000; // 24 h em ms

const entry = `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { InsightBoxPresentation } from "@/components/InsightBox";
import { reviewState, nextCheckDelay, shouldSchedule } from "@/data/insightReview";
import { setLocale } from "@/i18n";
export function render(props, locale) {
  setLocale(locale);
  return renderToStaticMarkup(createElement(InsightBoxPresentation, props));
}
export { reviewState, nextCheckDelay, shouldSchedule };
`;

await build({
  stdin: { contents: entry, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node",
  outfile: path.join(outdir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" },
  alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
});

const mod = await import(pathToFileURL(path.join(outdir, "bundle.mjs")).href);
const { render, reviewState, nextCheckDelay, shouldSchedule } = mod;

let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

// ── Instantes de referência ───────────────────────────────────────────────────
const NOW = Date.now();
// "2026-10-17T02:00:00Z" = "2026-10-16T23:00:00" em America/Sao_Paulo (UTC-3)
const REVIEW_AT_TZ = "2026-10-17T02:00:00Z";
const AFTER_TZ = new Date(REVIEW_AT_TZ).getTime() + 1000; // 1 s depois do vencimento
const FUTURE = new Date(NOW + 30 * 24 * 3600 * 1000).toISOString(); // +30 dias
const FAR_FUTURE = new Date(NOW + 80 * 24 * 3600 * 1000).toISOString(); // +80 dias
const FIVE_MIN_MS = 5 * 60 * 1000;
const FUTURE_5MIN = new Date(NOW + FIVE_MIN_MS).toISOString();

// ── Mocks de entrada ─────────────────────────────────────────────────────────
const entryValid = {
  pt: "Contexto estratégico PT.", en: "Strategic context EN.",
  thesis: { pt: "Tese ODIN PT.", en: "ODIN Thesis EN." },
  nextReviewAt: FUTURE,
};
const entryExpired = {
  pt: "Contexto estratégico PT.", en: "Strategic context EN.",
  thesis: { pt: "Tese ODIN PT.", en: "ODIN Thesis EN." },
  nextReviewAt: REVIEW_AT_TZ,
};
const entryStaleValid = {
  pt: "Contexto estratégico PT.", en: "Strategic context EN.",
  thesis: { pt: "Tese ODIN PT.", en: "ODIN Thesis EN." },
  nextReviewAt: FUTURE, freshness: "stale",
};
const entryExpiredAndStale = {
  pt: "Contexto estratégico PT.", en: "Strategic context EN.",
  thesis: { pt: "Tese ODIN PT.", en: "ODIN Thesis EN." },
  nextReviewAt: REVIEW_AT_TZ, freshness: "stale",
};
const legacyFresh = {
  pt: "Conteúdo legado PT.", en: "Legacy content EN.", freshness: "fresh",
};
const legacyStale = {
  pt: "Conteúdo legado stale PT.", en: "Legacy stale content EN.", freshness: "stale",
};

// ── 1–2. reviewState: ausente e inválido → não vencido ───────────────────────
{
  const s1 = reviewState(undefined, NOW);
  assert(!s1.expired && s1.msUntilExpiry === null,
    "reviewState(undefined) deve retornar { expired: false, msUntilExpiry: null }");

  const s2 = reviewState("not-a-date", NOW);
  assert(!s2.expired && s2.msUntilExpiry === null,
    "reviewState(inválido) deve retornar { expired: false, msUntilExpiry: null }");
}

// ── 3. v2 dentro do prazo → renderiza conteúdo e tese ───────────────────────
{
  const html = render({ entry: entryValid, legacy: null, updatedAt: null, nowMs: NOW }, "pt");
  assert(html.includes("Tese ODIN PT."), "v2 válido PT deve renderizar a tese");
  assert(html.includes("Contexto estratégico PT."), "v2 válido PT deve renderizar o contexto");
}

// ── 4. v2 vencido → aviso datado, tese e contexto ausentes ──────────────────
{
  const html = render({ entry: entryExpired, legacy: null, updatedAt: null, nowMs: AFTER_TZ }, "pt");
  assert(!html.includes("Tese ODIN PT."), "v2 vencido não deve renderizar a tese");
  assert(!html.includes("Contexto estratégico PT."), "v2 vencido não deve renderizar o contexto");
  assert(html.includes("revisão"), "v2 vencido deve conter aviso de revisão");
}

// ── 5. Aviso PT com data no fuso America/Sao_Paulo ───────────────────────────
// 2026-10-17T02:00:00Z = 2026-10-16T23:00:00 SP → deve exibir "16/10"
{
  const html = render({ entry: entryExpired, legacy: null, updatedAt: null, nowMs: AFTER_TZ }, "pt");
  assert(html.includes("16/10"),
    `aviso PT deve mostrar 16/10 (fuso SP); HTML: ${html.slice(0, 200)}`);
  assert(!html.includes("17/10"),
    "aviso PT não deve mostrar 17/10 (data UTC incorreta)");
}

// ── 6. Aviso EN com data no fuso America/Sao_Paulo ───────────────────────────
{
  const html = render({ entry: entryExpired, legacy: null, updatedAt: null, nowMs: AFTER_TZ }, "en");
  assert(html.includes("10/16"),
    `aviso EN deve mostrar 10/16 (fuso SP); HTML: ${html.slice(0, 200)}`);
  assert(!html.includes("10/17"),
    "aviso EN não deve mostrar 10/17 (data UTC incorreta)");
}

// ── 7. v2 vencido + legacy disponível → legacy não aparece ───────────────────
{
  const html = render({ entry: entryExpired, legacy: legacyFresh, updatedAt: null, nowMs: AFTER_TZ }, "pt");
  assert(!html.includes("Conteúdo legado PT."),
    "v2 vencido não deve exibir conteúdo legado");
  assert(html.includes("revisão"),
    "v2 vencido + legacy deve mostrar aviso datado");
}

// ── 8. v2 stale (prazo válido) → aviso genérico, tese e contexto ausentes ────
{
  const html = render({ entry: entryStaleValid, legacy: null, updatedAt: null, nowMs: NOW }, "pt");
  assert(!html.includes("Tese ODIN PT."),
    "v2 stale (prazo válido) não deve renderizar a tese");
  assert(!html.includes("Contexto estratégico PT."),
    "v2 stale (prazo válido) não deve renderizar o contexto");
  assert(html.includes("revisão"),
    "v2 stale (prazo válido) deve mostrar aviso genérico");
}

// ── 9. v2 vencido + stale → aviso DATADO (precedência) ──────────────────────
{
  const html = render({ entry: entryExpiredAndStale, legacy: null, updatedAt: null, nowMs: AFTER_TZ }, "pt");
  assert(html.includes("16/10"),
    "vencido + stale deve mostrar aviso DATADO (16/10), não genérico");
  assert(!html.includes("Tese ODIN PT."),
    "vencido + stale não deve mostrar a tese");
  assert(!html.includes("Contexto estratégico PT."),
    "vencido + stale não deve mostrar o contexto");
}

// ── 10. Legacy stale → aviso genérico, conteúdo oculto ──────────────────────
{
  const html = render({ entry: null, legacy: legacyStale, updatedAt: null, nowMs: NOW }, "pt");
  assert(!html.includes("Conteúdo legado stale PT."),
    "legacy stale não deve exibir o conteúdo");
  assert(html.includes("revisão"),
    "legacy stale deve exibir aviso genérico");
}

// ── 11–13. nextCheckDelay ─────────────────────────────────────────────────────
{
  const delay80d = nextCheckDelay(80 * 24 * 3600 * 1000);
  assert(delay80d === MAX_DELAY_MS,
    `nextCheckDelay(80 dias) deve ser 24 h (${MAX_DELAY_MS} ms); obteve ${delay80d}`);

  const delay5m = nextCheckDelay(FIVE_MIN_MS);
  assert(delay5m === FIVE_MIN_MS,
    `nextCheckDelay(5 min) deve ser ${FIVE_MIN_MS} ms; obteve ${delay5m}`);

  const delayZero = nextCheckDelay(0);
  assert(delayZero >= 0,
    `nextCheckDelay(0) deve ser não-negativo; obteve ${delayZero}`);
}

// ── 14–17. shouldSchedule ─────────────────────────────────────────────────────
{
  assert(shouldSchedule(FUTURE_5MIN, NOW),
    "shouldSchedule(futuro) deve retornar true");

  assert(!shouldSchedule(REVIEW_AT_TZ, AFTER_TZ),
    "shouldSchedule(vencido) deve retornar false");

  assert(!shouldSchedule(undefined, NOW),
    "shouldSchedule(undefined) deve retornar false");

  assert(!shouldSchedule("not-a-date", NOW),
    "shouldSchedule(inválido) deve retornar false");
}

// ── 18–23. Badge de revisão humana ───────────────────────────────────────────
// Usa "2026-10-15T12:00:00Z" → 2026-10-15T09:00-03:00 em SP → dia 15, mês 10
// PT: "15/10"   EN: "Oct 15, 2026"  (dia ≠ mês, formatos claramente distintos)
const REVIEWED_AT = "2026-10-15T12:00:00Z";
const entryApproved = {
  pt: "Contexto estratégico PT.", en: "Strategic context EN.",
  nextReviewAt: FUTURE,
  reviewStatus: "approved", reviewedAt: REVIEWED_AT, reviewedBy: "analyst-1",
};
{
  // 18. PT: badge presente e data "15/10"
  const html = render({ entry: entryApproved, legacy: null, updatedAt: null, nowMs: NOW }, "pt");
  assert(html.includes('data-human-reviewed="true"'),
    "badge PT: data-human-reviewed deve estar presente");
  assert(html.includes("15/10"),
    "badge PT: data deve ser 15/10");

  // 19. EN: badge presente e data legível com mês abreviado
  const htmlEn = render({ entry: entryApproved, legacy: null, updatedAt: null, nowMs: NOW }, "en");
  assert(htmlEn.includes('data-human-reviewed="true"'),
    "badge EN: data-human-reviewed deve estar presente");
  assert(htmlEn.includes("Oct") && htmlEn.includes("15"),
    "badge EN: data deve conter mês abreviado e dia 15");

  // 20. reviewedAt ausente → sem badge
  const noDate = { ...entryApproved, reviewedAt: undefined };
  const htmlNoDate = render({ entry: noDate, legacy: null, updatedAt: null, nowMs: NOW }, "pt");
  assert(!htmlNoDate.includes('data-human-reviewed'),
    "sem reviewedAt: badge não deve aparecer");

  // 21. reviewedAt inválido → sem badge
  const badDate = { ...entryApproved, reviewedAt: "not-a-date" };
  const htmlBad = render({ entry: badDate, legacy: null, updatedAt: null, nowMs: NOW }, "pt");
  assert(!htmlBad.includes('data-human-reviewed'),
    "reviewedAt inválido: badge não deve aparecer");

  // 22. reviewedBy vazio → sem badge
  const noBy = { ...entryApproved, reviewedBy: "" };
  const htmlNoBy = render({ entry: noBy, legacy: null, updatedAt: null, nowMs: NOW }, "pt");
  assert(!htmlNoBy.includes('data-human-reviewed'),
    "reviewedBy vazio: badge não deve aparecer");

  // 23. Caminho legado → sem badge, badge de legado preservado
  const htmlLegacy = render({ entry: null, legacy: legacyFresh, updatedAt: null, nowMs: NOW }, "pt");
  assert(!htmlLegacy.includes('data-human-reviewed'),
    "caminho legado: data-human-reviewed não deve aparecer");
  assert(htmlLegacy.includes("IA assistida"),
    "caminho legado: badge original deve ser preservado");
}

if (failures) { console.error(`insight-review: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN insight-review: PASS — 23 casos testados");
