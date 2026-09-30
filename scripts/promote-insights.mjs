import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { validateInsightEntry, checkFreshness, checkLayerCompleteness, SCHEMA_VERSION, INTELLIGENCE_CONTRACT_VERSION, LEVELS } from "./insights-schema.mjs";
import { validateSectionProfile } from "./insights-profile-validator.mjs";
import { checkEvidenceConsistency, formatConsistencyError } from "./evidence-consistency.mjs";
import { verifyProvenance } from "./verify-provenance.mjs";
import { annotateErrors } from "./gh-annotations.mjs";

const input = path.resolve(process.argv[2] || "public/data/insights.v2.shadow.json");
const output = path.resolve(process.argv[3] || "public/data/insights.v2.json");
const reportFile = path.resolve(process.argv[4] || "public/data/generationReport.json");
const manualApproval = process.env.ODIN_PROMOTE_APPROVED === "true";
// Revisão humana auditável: quem aprovou e a partir de qual run shadow.
const reviewer = (process.env.ODIN_REVIEWER ?? "").trim();
const shadowRunId = (process.env.ODIN_SHADOW_RUN_ID ?? "").trim() || null;

const shadow = JSON.parse(await readFile(input, "utf8"));
const report = JSON.parse(await readFile(reportFile, "utf8"));
const errors = [];
if (!manualApproval) errors.push("promoção exige ODIN_PROMOTE_APPROVED=true");
if (!reviewer) errors.push("promoção exige ODIN_REVIEWER (identidade de quem revisou e aprovou)");
if (report.runId !== shadow.runId) errors.push("generationReport.runId não corresponde ao shadow");
if (report.validation?.decision !== "publish_candidate") errors.push("generationReport não autoriza publish_candidate");

if (shadow.schemaVersion !== SCHEMA_VERSION) errors.push("schemaVersion inválido");
if (shadow.intelligenceContractVersion !== INTELLIGENCE_CONTRACT_VERSION) errors.push("intelligenceContractVersion inválido");
if (shadow.status !== "shadow") errors.push("artefato de entrada deve ter status shadow");
if (typeof shadow.runId !== "string") errors.push("runId ausente");

const sections = shadow.data?.sections;
if (!sections || typeof sections !== "object" || Object.keys(sections).length === 0) errors.push("data.sections vazio");

for (const [id, entry] of Object.entries(sections ?? {})) {
  errors.push(...validateInsightEntry(entry, id));
  errors.push(...validateSectionProfile(entry, id, { strict: true }));
  errors.push(...checkFreshness(entry, id));
  errors.push(...checkLayerCompleteness(entry, id));
  if (entry.status !== "shadow") errors.push(`sections.${id}.status não é shadow`);

}

const facts = Object.values(sections ?? {}).flatMap(e => e.claims ?? []).filter(c => c.kind === "fact");
const evidenceCoverage = facts.length === 0 ? 1 : facts.filter(c => (c.evidenceRefs ?? []).length > 0).length / facts.length;
const generatedCount = Object.values(sections ?? {}).filter(e => e.status === "shadow").length;
const legalOk = Object.values(sections ?? {}).every(e =>
  e.economicLaw?.relevance !== "high" ||
  ["norms","institutions","sourceRefs"].every(k => Array.isArray(e.economicLaw[k]) && e.economicLaw[k].length > 0)
);
const confidencePresent = Object.values(sections ?? {}).every(e =>
  LEVELS.has(e.confidence?.data) && LEVELS.has(e.confidence?.interpretation)
);
const bannedClaims = Object.values(sections ?? {}).flatMap(e => e.claims ?? [])
  .filter(c => /\b(always|never|guaranteed|certainly)\b/i.test(c.textEn ?? "")).length;
const sectionProfileValid = Object.values(sections ?? {}).every(e => validateSectionProfile(e, e.sectionId, { strict: true }).length === 0);

const evidenceBySection = new Map((report.sections ?? []).map(s => [s.sectionId, s.evidence]));
for (const [id, entry] of Object.entries(sections ?? {}))
  for (const e of checkEvidenceConsistency(entry, evidenceBySection.get(id))) errors.push(`sections.${id} ${formatConsistencyError(e)}`);

// Proveniência reproduzível: as cópias de evidência do run devem estar no repo
// (o workflow as copia do artefato shadow antes de chamar este script).
errors.push(...(await verifyProvenance(shadow, { require: true })).errors);

if (generatedCount === 0) errors.push("nenhuma seção gerada");
if (evidenceCoverage < 0.5) errors.push(`evidenceCoverage abaixo de 0.5: ${evidenceCoverage.toFixed(2)}`);
if (!legalOk) errors.push("economicLaw high sem norms/institutions/sourceRefs");
if (!confidencePresent) errors.push("confidence ausente/inválida");
if (bannedClaims > 0) errors.push(`claims banidos detectados: ${bannedClaims}`);
if (!sectionProfileValid) errors.push("sectionProfileValid=false");

if (errors.length) {
  annotateErrors("ODIN promote BLOCK", errors);
  for (const e of errors) console.error("ERRO:", e);
  process.exit(1);
}

const now = new Date().toISOString();
const productionSections = Object.fromEntries(
  Object.entries(sections).map(([id, entry]) => [id, {
    ...entry,
    status: "generated",
    reviewStatus: "approved",
    reviewedBy: reviewer,
    reviewedAt: now,
    reviewSource: { shadowRunId, generationRunId: shadow.runId },
    generatedAt: entry.generatedAt || now
  }])
);

const production = {
  schemaVersion: SCHEMA_VERSION,
  intelligenceContractVersion: INTELLIGENCE_CONTRACT_VERSION,
  status: "generated",
  runId: shadow.runId,
  generatedAt: shadow.generatedAt || now,
  updatedAt: now,
  provider: shadow.provider,
  model: shadow.model,
  promptVersion: shadow.promptVersion,
  data: { sections: productionSections }
};

await writeFile(output, JSON.stringify(production, null, 2) + "\n");
console.log(`PROMOTED ${shadow.runId} -> ${output} | sections=${generatedCount} evidenceCoverage=${evidenceCoverage.toFixed(2)} sectionProfileValid=${sectionProfileValid}`);
