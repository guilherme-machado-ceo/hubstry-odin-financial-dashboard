// ODIN — resumo de revisão humana (MVP Readiness Gate).
// Renderiza em Markdown o que o revisor está aprovando: decisão do gate,
// claims (tipo, texto, evidência, confiança), What to Watch, implicações e
// evidências com hash. No GitHub Actions, é anexado ao $GITHUB_STEP_SUMMARY.
// Uso: node scripts/review-summary.mjs <insights.json> [generationReport.json]
import { readFile, appendFile } from "node:fs/promises";
import path from "node:path";

const esc = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");

export function renderReviewSummary(doc, report = null, { runUrl = null, shadowRunId = null } = {}) {
  const v = report?.validation;
  const lines = [];
  lines.push(`# ODIN — revisão do run \`${doc.runId}\``);
  lines.push("");
  lines.push(`- Status do artefato: **${doc.status}** · provider/model: \`${doc.provider}\` / \`${doc.model}\` · prompt \`${doc.promptVersion}\``);
  if (v) {
    lines.push(`- Gate: **${v.decision === "publish_candidate" ? "PASS — publish_candidate" : "BLOCK"}**`);
    const flags = ["sectionProfileValid", "evidenceConsistent", "freshnessValid", "provenanceReproducible", "economicLawHighHasNorms"]
      .filter((k) => k in v).map((k) => `${k}=${v[k] ? "✅" : "❌"}`);
    if (flags.length) lines.push(`- ${flags.join(" · ")}`);
  }
  if (shadowRunId) lines.push(`- Para promover após revisar: Actions → **ODIN Insights Controlled Promotion** → \`shadow_run_id = ${shadowRunId}\`, \`approve = true\``);
  if (runUrl) lines.push(`- Run: ${runUrl}`);
  lines.push("");
  if (v?.errors?.length) {
    lines.push("## Bloqueios do gate");
    for (const e of v.errors) lines.push(`- ${esc(e)}`);
    lines.push("");
  }
  for (const [id, s] of Object.entries(doc.data?.sections ?? {})) {
    lines.push(`## ${id}`);
    lines.push(`validAsOf \`${s.validAsOf ?? "?"}\` · nextReviewAt \`${s.nextReviewAt ?? "?"}\` · confiança dados/interp. \`${s.confidence?.data}/${s.confidence?.interpretation}\`${s.sectionProfile ? ` · profile \`${s.sectionProfile}@${s.profileVersion}\`` : ""}`);
    lines.push("");
    lines.push(`> ${esc(s.pt)}`);
    lines.push("");
    lines.push("| claim | tipo | texto (pt) | evidência | confiança |");
    lines.push("|---|---|---|---|---|");
    for (const c of s.claims ?? []) lines.push(`| ${esc(c.id)} | ${c.kind} | ${esc(c.textPt)} | ${esc((c.evidenceRefs ?? []).join(", "))} | ${c.confidence?.data}/${c.confidence?.interpretation} |`);
    lines.push("");
    if ((s.whatToWatch ?? []).length) {
      lines.push("**What to Watch**");
      for (const w of s.whatToWatch) lines.push(`- ${esc(w.signal)} — ${esc(w.source)}${w.expectedDate ? ` · ${w.expectedDate}` : ""}`);
      lines.push("");
    }
    if ((s.stakeholderImplications ?? []).length) {
      lines.push("**Implicações**");
      for (const st of s.stakeholderImplications) lines.push(`- \`${st.audience}\`: ${esc(st.textPt)}`);
      lines.push("");
    }
    lines.push("**Evidências**");
    for (const p of s.provenance ?? []) lines.push(`- \`${p.sourceId}\` · ${esc(p.dataPath)} · \`${String(p.hash).slice(0, 23)}…\``);
    lines.push("");
  }
  return lines.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2] || "public/data/insights.v2.shadow.json";
  const reportFile = process.argv[3];
  const doc = JSON.parse(await readFile(path.resolve(file), "utf8"));
  let report = null;
  if (reportFile) { try { report = JSON.parse(await readFile(path.resolve(reportFile), "utf8")); } catch {} }
  const { GITHUB_SERVER_URL, GITHUB_REPOSITORY, GITHUB_RUN_ID, GITHUB_STEP_SUMMARY, ODIN_SUMMARY_SHADOW } = process.env;
  const runUrl = GITHUB_RUN_ID && GITHUB_REPOSITORY ? `${GITHUB_SERVER_URL ?? "https://github.com"}/${GITHUB_REPOSITORY}/actions/runs/${GITHUB_RUN_ID}` : null;
  const md = renderReviewSummary(doc, report, { runUrl, shadowRunId: ODIN_SUMMARY_SHADOW === "true" ? GITHUB_RUN_ID : null });
  if (GITHUB_STEP_SUMMARY) await appendFile(GITHUB_STEP_SUMMARY, md + "\n");
  console.log(md);
}
