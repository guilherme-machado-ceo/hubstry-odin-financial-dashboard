// ODIN — teste hermético do pipeline v1.1 (gerador → gate → promoção → Briefing),
// SEM rede e SEM custo de modelo. Roda os scripts reais num diretório
// temporário, com entradas congeladas (contracts/contract-v1.1/pipeline/data)
// e o mock scripts/pipeline-mock.mjs (relógio fixo, Open-Meteo sintético,
// respostas do modelo no formato v1.1).
// Cenários: ok (gate PASS + promoção), retry (lente com recomendação corrigida
// no retry de contrato), block (gate BLOQUEIA, mas o artefato é escrito para
// virar amostra de calibração).
import { mkdtemp, cp, mkdir, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { checkBriefingItems } from "./briefing-literal-check.mjs";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

async function workspace() {
  const dir = await mkdtemp(path.join(tmpdir(), "odin-pipeline-"));
  await cp(path.join(root, "scripts"), path.join(dir, "scripts"), { recursive: true });
  await cp(path.join(root, "contracts"), path.join(dir, "contracts"), { recursive: true });
  await mkdir(path.join(dir, "public/data"), { recursive: true });
  await cp(path.join(root, "contracts/contract-v1.1/pipeline/data"), path.join(dir, "public/data"), { recursive: true });
  return dir;
}
function run(dir, script, env = {}, args = []) {
  const r = spawnSync(process.execPath, ["--import", "./scripts/pipeline-mock.mjs", script, ...args], {
    cwd: dir, encoding: "utf8",
    env: { ...process.env, AI_PROVIDER: "nvidia", NVIDIA_API_KEY: "mock", NVIDIA_ENDPOINT: "https://mock.invalid/v1/chat/completions", AI_TIMEOUT_MS: "5000", GITHUB_ACTIONS: "", GITHUB_STEP_SUMMARY: "", ...env },
  });
  return { code: r.status, out: `${r.stdout}\n${r.stderr}` };
}
const readJson = async (dir, rel) => JSON.parse(await readFile(path.join(dir, rel), "utf8"));

// Briefing (frontend) empacotado para renderizar o artefato promovido.
const bundleDir = path.join(root, "node_modules/.cache/odin-pipeline");
await mkdir(bundleDir, { recursive: true });
await build({
  stdin: { contents: `
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { BriefingView } from "@/components/BriefingODIN";
import { setLocale } from "@/i18n";
export { buildBriefing } from "@/data/briefing";
export function render(items, locale) { setLocale(locale); return renderToStaticMarkup(createElement(BriefingView, { items, locale, updatedAt: null })); }
`, resolveDir: root, loader: "ts" },
  bundle: true, format: "esm", platform: "node", outfile: path.join(bundleDir, "bundle.mjs"),
  jsx: "automatic", loader: { ".tsx": "tsx", ".ts": "ts" }, alias: { "@": path.join(root, "src") }, logLevel: "error",
  external: ["react", "react-dom", "react-dom/server", "lucide-react"],
});
const ui = await import(pathToFileURL(path.join(bundleDir, "bundle.mjs")).href);

// ── ok ──────────────────────────────────────────────────────────────────────
{
  const dir = await workspace();
  const g = run(dir, "scripts/generate-insights-shadow.mjs", { ODIN_MOCK_SCENARIO: "ok" });
  assert(g.code === 0, `[ok] gerador falhou:\n${g.out.slice(-1500)}`);
  const v = run(dir, "scripts/validate-insights-shadow.mjs", { ODIN_MOCK_SCENARIO: "ok" });
  assert(v.code === 0 && /Shadow gate: PASS/.test(v.out), `[ok] gate deveria passar:\n${v.out.slice(-2500)}`);
  const shadow = await readJson(dir, "public/data/insights.v2.shadow.json");
  assert(shadow.intelligenceContractVersion === "1.1" && shadow.promptVersion === "4.0.0", "[ok] shadow deveria ser contrato 1.1 / prompt 4.0.0");
  for (const [id, s] of Object.entries(shadow.data.sections)) {
    assert(s.intelligenceContractVersion === "1.1", `[ok] ${id} não é 1.1`);
    assert(s.decisionLens?.lens === "founder_ceo" && s.decisionLens.implications.length >= 1, `[ok] ${id} sem lente Founder/CEO`);
    assert(s.whatToWatch.every((w) => w.signalPt && w.signalEn && w.whyItMattersPt && w.whyItMattersEn && w.sourceId && "expectedDate" in w), `[ok] ${id} What to Watch não é bilíngue v1.1`);
    assert(s.provenance.every((p) => p.verification && p.derivation), `[ok] ${id} provenance sem os dois eixos`);
  }
  assert(shadow.data.sections.carbon.events?.length === 2, "[ok] carbon deveria ter os 2 eventos regulatórios montados pelo código");
  assert(!shadow.data.sections.blockchain.events, "[ok] blockchain (snapshot) não deve ter eventos");
  assert(shadow.data.sections.climate.provenance[0].derivation === "derived", "[ok] clima é agregado da série diária: derivation=derived");
  // Janela inclusiva de 365 observações diárias (início e fim entram na consulta ao Open-Meteo).
  const meteo = await readJson(dir, shadow.data.sections.climate.provenance[0].dataPath);
  assert(meteo.daily?.time?.length === 365, `[ok] janela do clima deveria ter 365 dias, tem ${meteo.daily?.time?.length}`);
  const report = await readJson(dir, "public/data/generationReport.json");
  assert(report.validation?.contractV11Valid === true, "[ok] generationReport sem contractV11Valid=true");
  const p = run(dir, "scripts/promote-insights.mjs", { ODIN_PROMOTE_APPROVED: "true", ODIN_REVIEWER: "pipeline-test", ODIN_SHADOW_RUN_ID: "0" }, ["public/data/insights.v2.shadow.json", "public/data/insights.v2.promoted.json"]);
  assert(p.code === 0, `[ok] promoção falhou:\n${p.out.slice(-1500)}`);
  const prod = await readJson(dir, "public/data/insights.v2.promoted.json");
  assert(prod.intelligenceContractVersion === "1.1", "[ok] promoção deveria preservar a versão 1.1");
  assert(Object.values(prod.data.sections).every((s) => s.reviewedBy === "pipeline-test" && s.reviewStatus === "approved"), "[ok] promoção sem autoria da revisão");
  // Briefing sobre o artefato promovido: regra literal + 4 respostas (3 minutos, CI).
  const items = ui.buildBriefing(prod.data.sections);
  assert(items.length === 3 && items.every((i) => i.whyFrom === "lens"), `[ok] Briefing deveria usar a lente nas 3 seções (veio ${items.map((i) => `${i.sectionId}:${i.whyFrom}`)})`);
  for (const e of checkBriefingItems(items, prod.data.sections)) assert(false, `[ok] ${e}`);
  for (const locale of ["pt", "en"]) {
    const html = ui.render(items, locale);
    for (const it of items) {
      assert(html.includes(locale === "pt" ? it.watchSignalPt : it.watchSignalEn), `[ok/${locale}] Briefing sem o What to Watch no idioma (${it.sectionId})`);
      assert(html.includes(`href="${it.sourceUrl.replace(/&/g, "&amp;")}"`), `[ok/${locale}] Briefing sem link da fonte (${it.sectionId})`);
    }
  }
  await rm(dir, { recursive: true, force: true });
}

// ── retry ───────────────────────────────────────────────────────────────────
{
  const dir = await workspace();
  const g = run(dir, "scripts/generate-insights-shadow.mjs", { ODIN_MOCK_SCENARIO: "retry" });
  assert(g.code === 0, `[retry] gerador falhou:\n${g.out.slice(-1500)}`);
  const v = run(dir, "scripts/validate-insights-shadow.mjs", { ODIN_MOCK_SCENARIO: "retry" });
  assert(v.code === 0, `[retry] gate deveria passar após o retry de contrato:\n${v.out.slice(-2000)}`);
  const report = await readJson(dir, "public/data/generationReport.json");
  const fixed = report.providerEvents.filter((e) => e.phase === "schema_retry" && e.decision === "fixed").length;
  const asked = report.providerEvents.filter((e) => e.phase === "schema_retry" && e.decision === "retry");
  assert(fixed === 3, `[retry] esperava 3 retries corrigidos, obteve ${fixed}`);
  assert(asked.every((e) => e.schemaErrors.some((x) => x.includes("recommendation_language"))), "[retry] o retry deveria devolver ao modelo o erro de linguagem de recomendação");
  await rm(dir, { recursive: true, force: true });
}

// ── block ───────────────────────────────────────────────────────────────────
{
  const dir = await workspace();
  const g = run(dir, "scripts/generate-insights-shadow.mjs", { ODIN_MOCK_SCENARIO: "block" });
  assert(g.code === 0, `[block] gerador deveria escrever o artefato mesmo com violação (o gate decide):\n${g.out.slice(-1500)}`);
  const v = run(dir, "scripts/validate-insights-shadow.mjs", { ODIN_MOCK_SCENARIO: "block" });
  assert(v.code !== 0 && /Shadow gate: BLOCK/.test(v.out), "[block] gate deveria bloquear");
  const report = await readJson(dir, "public/data/generationReport.json");
  assert(report.validation?.contractV11Valid === false, "[block] contractV11Valid deveria ser false");
  const errs = (report.validation?.contractV11Errors ?? []).join("\n");
  for (const rule of ["recommendation_language", "lens_new_number"]) assert(errs.includes(rule), `[block] gate deveria registrar ${rule}`);
  const p = run(dir, "scripts/promote-insights.mjs", { ODIN_PROMOTE_APPROVED: "true", ODIN_REVIEWER: "pipeline-test", ODIN_SHADOW_RUN_ID: "0" }, ["public/data/insights.v2.shadow.json", "public/data/insights.v2.promoted.json"]);
  assert(p.code !== 0, "[block] promoção deveria recusar artefato bloqueado");
  await rm(dir, { recursive: true, force: true });
}

if (failures) { console.error(`pipeline v1.1: ${failures} falha(s)`); process.exit(1); }
console.log("OK — pipeline v1.1 (gerador → gate → promoção → Briefing) sem rede e sem custo: ok, retry e block.");
