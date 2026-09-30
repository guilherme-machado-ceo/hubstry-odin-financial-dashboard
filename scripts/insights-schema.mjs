// ODIN Insights v2 — contrato estrutural compartilhado por geração e validação.

export const SCHEMA_VERSION = "2.0";
export const INTELLIGENCE_CONTRACT_VERSION = "1.0";
export const PROMPT_VERSION = "3.1.0";

export const LEVELS = new Set(["high", "medium", "low"]);
export const CLAIM_KINDS = new Set(["fact", "interpretation", "hypothesis"]);
export const GENERATION_STATUSES = new Set([
  "shadow", "generated", "preserved_after_error", "preserved_after_timeout", "failed_controlled"
]);

export function isIsoDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(value ?? ""); }
export function isIsoDateTime(value) { return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value ?? ""); }
export function isRunId(value) { return /^odin-\d{8}-\d{6}-[0-9a-f]{4}$/.test(value ?? ""); }

function validateBilingual(value, path) {
  const errors = [];
  if (!value || typeof value !== "object") return [`${path} deve ser objeto`];
  if (typeof value.pt !== "string" || !value.pt.trim()) errors.push(`${path}.pt ausente/vazio`);
  if (typeof value.en !== "string" || !value.en.trim()) errors.push(`${path}.en ausente/vazio`);
  return errors;
}

export function validateClaim(claim, path = "claim") {
  const errors = [];
  if (!claim || typeof claim !== "object") return [`${path} must be an object`];
  if (typeof claim.id !== "string" || !claim.id) errors.push(`${path}.id ausente`);
  if (!CLAIM_KINDS.has(claim.kind)) errors.push(`${path}.kind inválido: ${claim.kind}`);
  errors.push(...validateBilingual({pt: claim.textPt, en: claim.textEn}, `${path}.text`));
  if (!Array.isArray(claim.evidenceRefs)) errors.push(`${path}.evidenceRefs deve ser array`);
  if (!LEVELS.has(claim.confidence?.data)) errors.push(`${path}.confidence.data inválido`);
  if (!LEVELS.has(claim.confidence?.interpretation)) errors.push(`${path}.confidence.interpretation inválido`);
  if (claim.kind === "fact" && claim.evidenceRefs.length === 0) errors.push(`${path}: fact sem evidenceRefs`);
  return errors;
}

export function validateProvenance(ref, path = "provenance") {
  const errors = [];
  if (!ref || typeof ref !== "object") return [`${path} must be an object`];
  for (const field of ["sourceId", "sourceUrl", "asOf", "dataPath", "metricId", "hash"]) {
    if (typeof ref[field] !== "string" || !ref[field]) errors.push(`${path}.${field} ausente`);
  }
  return errors;
}

function validateStakeholders(value, path) {
  const errors = [];
  const prescriptive = /\b(recomenda-se|recomendamos|recommendation|recommends|buy|sell|comprar|vender|escolha|choose)\b/i;
  if (!Array.isArray(value)) return [`${path} deve ser array`];
  for (const [i, item] of value.entries()) {
    if (!item || typeof item !== "object") { errors.push(`${path}[${i}] inválido`); continue; }
    if (!["government", "corporate", "investors", "startups"].includes(item.audience))
      errors.push(`${path}[${i}].audience inválido`);
    errors.push(...validateBilingual({pt:item.textPt,en:item.textEn}, `${path}[${i}].text`));
    if (prescriptive.test(item.textPt ?? "") || prescriptive.test(item.textEn ?? "")) errors.push(`${path}[${i}].text linguagem prescritiva`);
  }
  return errors;
}

function validateWatch(value, path, knownSources = new Set()) {
  const errors = [];
  if (!Array.isArray(value)) return [`${path} deve ser array`];
  for (const [i, item] of value.entries()) {
    if (!item || typeof item !== "object") { errors.push(`${path}[${i}] inválido`); continue; }
    for (const f of ["signal", "source", "whyItMatters"]) if (typeof item[f] !== "string" || !item[f]) errors.push(`${path}[${i}].${f} ausente`);
    if (typeof item.source === "string" && knownSources.size > 0) {
      const normalized = item.source.toLowerCase();
      const sourceMatch = [...knownSources].some(s => normalized.includes(String(s).toLowerCase())) || /https?:\/\//i.test(item.source);
      if (!sourceMatch) errors.push(`${path}[${i}].source sem referência reconhecível`);
    }
    if (item.expectedDate !== undefined && item.expectedDate !== null && !isIsoDate(item.expectedDate)) errors.push(`${path}[${i}].expectedDate inválido`);
  }
  return errors;
}

export function validateInsightEntry(entry, sectionId = "unknown") {
  const errors = [];
  const p = `sections.${sectionId}`;
  if (!entry || typeof entry !== "object") return [`${p} deve ser objeto`];
  if (entry.schemaVersion !== SCHEMA_VERSION) errors.push(`${p}.schemaVersion deve ser ${SCHEMA_VERSION}`);
  if (entry.intelligenceContractVersion !== INTELLIGENCE_CONTRACT_VERSION) errors.push(`${p}.intelligenceContractVersion deve ser ${INTELLIGENCE_CONTRACT_VERSION}`);
  if (entry.sectionId !== sectionId) errors.push(`${p}.sectionId inconsistente`);
  if (!GENERATION_STATUSES.has(entry.status)) errors.push(`${p}.status inválido: ${entry.status}`);
  for (const f of ["promptVersion","provider","model","runId","limitations"]) if (typeof entry[f] !== "string" || !entry[f]) errors.push(`${p}.${f} ausente`);
  if (!isIsoDateTime(entry.generatedAt)) errors.push(`${p}.generatedAt inválido`);
  if (!(isIsoDate(entry.validAsOf) || isIsoDateTime(entry.validAsOf))) errors.push(`${p}.validAsOf inválido`);
  if (entry.nextReviewAt !== undefined && !isIsoDateTime(entry.nextReviewAt)) errors.push(`${p}.nextReviewAt inválido`);
  if (!["unreviewed", "reviewed", "approved"].includes(entry.reviewStatus)) errors.push(`${p}.reviewStatus inválido`);
  errors.push(...validateBilingual(entry, p));
  if (!LEVELS.has(entry.confidence?.data)) errors.push(`${p}.confidence.data inválido`);
  if (!LEVELS.has(entry.confidence?.interpretation)) errors.push(`${p}.confidence.interpretation inválido`);
  if (!Array.isArray(entry.claims)) errors.push(`${p}.claims deve ser array`);
  if (!Array.isArray(entry.provenance)) errors.push(`${p}.provenance deve ser array`);
  for (const [i,c] of (entry.claims ?? []).entries()) errors.push(...validateClaim(c, `${p}.claims[${i}]`));
  for (const [i,r] of (entry.provenance ?? []).entries()) errors.push(...validateProvenance(r, `${p}.provenance[${i}]`));
  const refs = new Set((entry.provenance ?? []).map(r => r.sourceId));
  for (const [i,c] of (entry.claims ?? []).entries())
    for (const ref of c.evidenceRefs ?? [])
      if (!refs.has(ref)) errors.push(`${p}.claims[${i}].evidenceRefs referencia sourceId inexistente: ${ref}`);
  errors.push(...validateStakeholders(entry.stakeholderImplications, `${p}.stakeholderImplications`));
  const knownSources = new Set((entry.provenance ?? []).flatMap(r => [r.sourceId, r.sourceUrl]));
  errors.push(...validateWatch(entry.whatToWatch, `${p}.whatToWatch`, knownSources));
  const law = entry.economicLaw;
  if (!law || !["high","medium","low","not_material"].includes(law.relevance)) errors.push(`${p}.economicLaw.relevance inválido`);
  if (law?.relevance === "high") {
    for (const f of ["norms","institutions","sourceRefs"])
      if (!Array.isArray(law[f]) || law[f].length === 0) errors.push(`${p}.economicLaw high sem ${f}`);
  }
  return errors;
}
