// ODIN Insights v2 — contrato estrutural compartilhado por geração e validação.

export const SCHEMA_VERSION = "2.0";
export const INTELLIGENCE_CONTRACT_VERSION = "1.0";
/** Versões aceitas pelo gate. "1.1" = Data & Intelligence Contract v1.1 (docs/odin-intelligence-contract-v1.1.md), regras extras em contract-v11.mjs. */
export const SUPPORTED_CONTRACT_VERSIONS = new Set(["1.0", "1.1"]);
export const PROMPT_VERSION = "3.3.0";

export const LEVELS = new Set(["high", "medium", "low"]);

// Idade máxima do dado por seção (dias), herdada do gerador v2.x (freshness).
export const MAX_AGE_DAYS = { carbon: 100, blockchain: 7, climate: 45 };
export const DEFAULT_MAX_AGE_DAYS = 30;

/**
 * Freshness como condição de publicação (MVP Readiness Gate):
 * - validAsOf deve estar dentro do maxAge da seção;
 * - validAsOf no futuro é inválido;
 * - nextReviewAt vencido bloqueia (o dado precisa ser revisto antes).
 */
export function checkFreshness(entry, sectionId, now = Date.now()) {
  const errors = [];
  const p = `sections.${sectionId}`;
  const asOf = Date.parse(entry?.validAsOf ?? "");
  if (!Number.isFinite(asOf)) return [`${p}.validAsOf ausente/inválido para freshness`];
  const maxAgeDays = MAX_AGE_DAYS[sectionId] ?? DEFAULT_MAX_AGE_DAYS;
  const ageDays = (now - asOf) / 864e5;
  if (ageDays < -1) errors.push(`${p}.validAsOf no futuro: ${entry.validAsOf}`);
  if (ageDays > maxAgeDays) errors.push(`${p} stale: dado de ${entry.validAsOf} tem ${Math.floor(ageDays)} dias (máx. ${maxAgeDays})`);
  const review = Date.parse(entry?.nextReviewAt ?? "");
  if (Number.isFinite(review) && review < now) errors.push(`${p}.nextReviewAt vencido: ${entry.nextReviewAt}`);
  return errors;
}
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
  if (!SUPPORTED_CONTRACT_VERSIONS.has(entry.intelligenceContractVersion)) errors.push(`${p}.intelligenceContractVersion não suportada: ${entry.intelligenceContractVersion}`);
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
  // v1.1: What to Watch bilíngue é validado em contract-v11.mjs (checkWatchV11).
  if (entry.intelligenceContractVersion !== "1.1") errors.push(...validateWatch(entry.whatToWatch, `${p}.whatToWatch`, knownSources));
  const law = entry.economicLaw;
  if (!law || !["high","medium","low","not_material"].includes(law.relevance)) errors.push(`${p}.economicLaw.relevance inválido`);
  if (law?.relevance === "high") {
    for (const f of ["norms","institutions","sourceRefs"])
      if (!Array.isArray(law[f]) || law[f].length === 0) errors.push(`${p}.economicLaw high sem ${f}`);
  }
  return errors;
}


// ── M1 · Emergency MVP Gate: 5 camadas mínimas por seção ─────────────────────
// Contexto (pt/en), Tese, Direito Econômico, ≥2 Stakeholders, exatamente 1
// What to Watch (temporário no M1; volta a até 3 no M2). `not_material`
// declara ausência de incidência e exige listas vazias.
export const M1_WATCH_ITEMS = 1;
export const M1_MIN_STAKEHOLDERS = 2;
export const NOT_MATERIAL_PT = "Não foi identificada incidência material de Direito Econômico no conjunto de evidências analisado.";
export const NOT_MATERIAL_EN = "No material Economic Law incidence was identified in the analyzed evidence set.";

const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;

/** Completude das 5 camadas (usada no retry de contrato, no gate e no promote). */
export function checkLayerCompleteness(entry, sectionId = entry?.sectionId ?? "?") {
  const errors = [];
  const p = `sections.${sectionId}`;
  if (!nonEmpty(entry?.pt) || !nonEmpty(entry?.en)) errors.push(`${p} camada Contexto: pt/en ausente`);
  if (!nonEmpty(entry?.thesis?.pt) || !nonEmpty(entry?.thesis?.en)) errors.push(`${p} camada Tese: thesis.pt/en ausente`);
  const law = entry?.economicLaw;
  if (!law || !["high", "medium", "low", "not_material"].includes(law.relevance)) errors.push(`${p} camada Direito Econômico: relevance ausente/inválida`);
  else {
    if (!nonEmpty(law.pt) || !nonEmpty(law.en)) errors.push(`${p} camada Direito Econômico: pt/en ausente`);
    if (law.relevance === "not_material" && ((law.norms ?? []).length || (law.institutions ?? []).length)) errors.push(`${p} camada Direito Econômico: not_material exige norms e institutions vazios`);
  }
  const st = entry?.stakeholderImplications;
  if (!Array.isArray(st) || st.length < M1_MIN_STAKEHOLDERS) errors.push(`${p} camada Stakeholders: mínimo ${M1_MIN_STAKEHOLDERS} (recebido ${Array.isArray(st) ? st.length : 0})`);
  const w = entry?.whatToWatch;
  if (!Array.isArray(w) || w.length !== M1_WATCH_ITEMS) errors.push(`${p} camada What to Watch: exatamente ${M1_WATCH_ITEMS} item (recebido ${Array.isArray(w) ? w.length : 0})`);
  return errors;
}

/** Contrato da saída crua do modelo, para o retry de contrato (estrutura, não semântica). */
export function validateModelOutput(parsed, sectionId, allowedSourceIds = []) {
  if (!parsed || typeof parsed !== "object") return ["saída não é objeto JSON"];
  const errors = [...checkLayerCompleteness(parsed, sectionId)];
  const known = new Set(allowedSourceIds);
  for (const [i, c] of (parsed.claims ?? []).entries()) {
    errors.push(...validateClaim(c, `claims[${i}]`));
    for (const ref of c?.evidenceRefs ?? []) if (known.size && !known.has(ref)) errors.push(`claims[${i}].evidenceRefs: ${ref} fora da provenance permitida`);
  }
  for (const [i, s] of (parsed.stakeholderImplications ?? []).entries()) {
    if (!["government", "corporate", "investors", "startups"].includes(s?.audience)) errors.push(`stakeholderImplications[${i}].audience inválido`);
    if (!nonEmpty(s?.textPt) || !nonEmpty(s?.textEn)) errors.push(`stakeholderImplications[${i}] textPt/textEn ausente`);
  }
  for (const [i, w] of (parsed.whatToWatch ?? []).entries()) {
    for (const f of ["signal", "source", "whyItMatters"]) if (!nonEmpty(w?.[f])) errors.push(`whatToWatch[${i}].${f} ausente`);
    if (known.size && nonEmpty(w?.source) && !known.has(w.source)) errors.push(`whatToWatch[${i}].source deve ser um sourceId permitido`);
    if (w?.expectedDate != null && !isIsoDate(w.expectedDate)) errors.push(`whatToWatch[${i}].expectedDate deve ser YYYY-MM-DD ou null`);
  }
  if (!LEVELS.has(parsed.confidence?.data) || !LEVELS.has(parsed.confidence?.interpretation)) errors.push("confidence inválida");
  if (!nonEmpty(parsed.limitations)) errors.push("limitations ausente");
  return errors;
}
