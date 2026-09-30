// ODIN — teste do resumo de revisão humana (determinístico, sem LLM).
import { readFile } from "node:fs/promises";
import { renderReviewSummary } from "./review-summary.mjs";

const fx = JSON.parse(await readFile("contracts/consistency/fixtures/df75-carbon.fail.json", "utf8"));
const doc = { runId: "odin-20260930-134927-df75", status: "shadow", provider: "nvidia", model: "m", promptVersion: "3.0.0", data: { sections: { carbon: fx.entry } } };
const report = { validation: { decision: "blocked", evidenceConsistent: false, errors: ["sections.carbon [key_date_mismatch] claims[claim-2].pt: …"] } };
const md = renderReviewSummary(doc, report, { shadowRunId: "123" });
const must = ["BLOCK", "claim-2", "O regime definitivo do CBAM começa em 2027-09-30.", "evidenceConsistent=❌", "Bloqueios do gate", "shadow_run_id = 123", "source-carbon-ec"];
const missing = must.filter((m) => !md.includes(m));
if (missing.length) { console.error("FALHA: resumo sem", missing); process.exit(1); }
console.log("ODIN review summary: PASS");
