// ODIN Insights v2 — contrato estrutural compartilhado por geração e validação.
// O contrato epistemológico está documentado em docs/odin-intelligence-contract-v1.md.

export const SCHEMA_VERSION = "2.0";
export const INTELLIGENCE_CONTRACT_VERSION = "1.0";
export const PROMPT_VERSION = "3.0.0";

export const LEVELS = new Set(["high", "medium", "low"]);
export const CLAIM_KINDS = new Set(["fact", "interpretation", "hypothesis"]);
export const GENERATION_STATUSES = new Set(["shadow", "generated", "preserved_after_error", "preserved_after_timeout", "failed_controlled"]);

export function isIsoDate(value) { return /^\\d{4}-\\d{2}-\\d{2}$/.test(value ?? ""); }
export function isIsoDateTime(value) { return /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}/.test(value ?? ""); }
export function isRunId(value) { return /^odin-\\d{8}-\\d{6}-[0-9a-f]{4}$/.test(value ?? ""); }

export function validateClaim(claim, path = "claim") {
  const errors = [];
  if (!claim || typeof claim !== "object") return [`${path} must be an object`];
  if (typeof claim.id !== "string" || !claim.id) errors.push(`${path}.id ausente`);
  if (!CLAIM_KINDS.has(claim.kind)) errors.push(`${path}.kind inválido: ${claim.kind}`);
  if (typeof claim.textPt !== "string" || !claim.textPt.trim()) errors.push(`${path}.textPt ausente/vazio`);
  if (typeof claim.textEn !== "string" || !claim.textEn.trim()) errors.push(`${path}.textEn ausente/vazio`);
  if (!Array.isArray(claim.evidenceRefs)) errors.push(`${path}.evidenceRefs deve ser array`);
  if (!LEVELS.has(claim.confidence?.data)) errors.push(`${path}.confidence.data inválido`);
  if (!LEVELS.has(claim.confidence?.interpretation)) errors.push(`${path}.confidence.interpretation inválido`);
  if (claim.kind === "fact" && (!claim.evidenceRefs || claim.evidenceRefs.length === 0)) errors.push(`${path}: fact sem evidenceRefs`);
  return errors;
}

export function validateProvenance(ref, path = "provenance") {
  const errors = [];
  if (!ref || typeof ref !== "object") return [`${path} must be an object`];
  for (const field of ["sourceId", "sourceUrl", "asOf", "dataPath", "hash"]) if (typeof ref[field] !== "string" || !ref[field]) errors.push(`${path}.${field} ausente`);
  if (typeof ref.metricId !== "string" || !ref.metricId) errors.push(`${path}.metricId ausente`);
  return errors;
}

export function validateInsightEntry(entry, sectionId = "unknown") {
  const errors = [];
  const p = `sections.${sectionId}`;
  if (!entry || typeof entry !== "object") return [`${p} deve ser objeto`];
  if (entry.schemaVersion !== SCHEMA_VERSION) errors.push(`${p}.schemaVersion deve ser ${SCHEMA_VERSION}`);
  if (entry.intelligenceContractVersion !== INTELLIGENCE_CONTRACT_VERSION) errors.push(`${p}.intelligenceContractVersion deve ser ${INTELLIGENCE_CONTRACT_VERSION}`);
  if (typeof entry.sectionId !== "string" || !entry.sectionId) errors.push(`${p}.sectionId ausente`);
  if (!["pt", "en"].includes(entry.locale)) errors.push(`${p}.locale inválido`);
  if (!GENERATION_STATUSES.has(entry.status)) errors.push(`${p}.status inválido: ${entry.status}`);
  if (typeof entry.promptVersion !== "string") errors.push(`${p}.promptVersion ausente`);
  if (typeof entry.provider !== "string" || !entry.provider) errors.push(`${p}.provider ausente`);
  if (typeof entry.model !== "string" || !entry.model) errors.push(`${p}.model ausente`);
  if (!isIsoDateTime(entry.generatedAt)) errors.push(`${p}.generatedAt inválido`);
  if (!(isIsoDate(entry.validAsOf) || isIsoDateTime(entry.validAsOf))) errors.push(`${p}.validAsOf inválido`);
  if (entry.nextReviewAt !== undefined && !isIsoDateTime(entry.nextReviewAt)) errors.push(`${p}.nextReviewAt inválido`);
  if (!isRunId(entry.runId)) errors.push(`${p}.runId inválido`);
  if (!["unreviewed", "reviewed", "approved"].includes(entry.reviewStatus)) errors.push(`${p}.reviewStatus inválido`);
  if (!Array.isArray(entry.claims)) errors.push(`${p}.claims deve ser array`);
  if (!Array.isArray(entry.provenance)) errors.push(`${p}.provenance deve ser array`);
  if (!LEVELS.has(entry.confidence?.data)) errors.push(`${p}.confidence.data inválido`);
  if (!LEVELS.has(entry.confidence?.interpretation)) errors.push(`${p}.confidence.interpretation inválido`);
  if (typeof entry.limitations !== "string" || !entry.limitations.trim()) errors.push(`${p}.limitations ausente`);
  for (const [i, claim] of (entry.claims ?? []).entries()) errors.push(...validateClaim(claim, `${p}.claims[${i}]`));
  for (const [i, ref] of (entry.provenance ?? []).entries()) errors.push(...validateProvenance(ref, `${p}.provenance[${i}]`));
  const refs = new Set((entry.provenance ?? []).map((r) => r.sourceId));
  for (const [i, claim] of (entry.claims ?? []).entries()) for (const ref of claim.evidenceRefs ?? []) if (!refs.has(ref)) errors.push(`${p}.claims[${i}].evidenceRefs referencia sourceId inexistente: ${ref}`);
  if (entry.economicLaw?.relevance === "high") {
    if (!Array.isArray(entry.economicLaw.norms) || entry.economicLaw.norms.length === 0) errors.push(`${p}.economicLaw high sem norms`);
    if (!Array.isArray(entry.economicLaw.institutions) || entry.economicLaw.institutions.length === 0) errors.push(`${p}.economicLaw high sem institutions`);
    if (!Array.isArray(entry.economicLaw.sourceRefs) || entry.economicLaw.sourceRefs.length === 0) errors.push(`${p}.economicLaw high sem sourceRefs`);
  }
  return errors;
}
