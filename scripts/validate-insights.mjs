// ============================================================
// ODIN INSIGHTS — validação de schema, proveniência e regressão editorial
// Primeiro teste automatizado do projeto (CHANGELOG auditoria-v1.2).
// Uso: npm run insights:validate
// Erros de schema/proveniência/siglas reprovam o artefato (exit 1);
// heurísticas editoriais (RN-006) emitem AVISO sem bloquear.
// ============================================================
import { readFile } from "node:fs/promises";
import path from "node:path";
import { SCHEMA_VERSION, SUPPORTED_CONTRACT_VERSIONS, LEVELS, GENERATION_STATUSES, validateInsightEntry } from "./insights-schema.mjs";

const FILE = path.resolve(process.cwd(), "public/data", "insights.json");
const errors = [];
const warnings = [];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
const RUN_ID = /^odin-\d{8}-\d{6}-[0-9a-f]{4}$/;
const LEGACY_STATUSES = new Set(["generated", "preserved_after_timeout", "preserved_after_error"]);
const STATUSES = new Set(["generated", "preserved_after_timeout", "preserved_after_error"]);

let json;
try {
  json = JSON.parse(await readFile(FILE, "utf8"));
} catch (e) {
  console.error(`ERRO: insights.json ilegível ou ausente (${e.message})`);
  process.exit(1);
}

// ── nível global ─────────────────────────────────────────────
const isV2 = json.schemaVersion === SCHEMA_VERSION;
if (isV2) {
  if (!SUPPORTED_CONTRACT_VERSIONS.has(json.intelligenceContractVersion)) errors.push(`global.intelligenceContractVersion não suportada: ${json.intelligenceContractVersion}`);
} else if (json.schemaVersion !== undefined) {
  errors.push(`global.schemaVersion não suportado: ${json.schemaVersion}`);
}
if (typeof json.promptVersion !== "string") errors.push("global.promptVersion ausente");
if (typeof json.model !== "string") errors.push("global.model ausente");
if (!ISO_DT.test(json.updatedAt ?? "")) errors.push("global.updatedAt não é ISO datetime");
if (json.runId !== undefined && !RUN_ID.test(json.runId)) errors.push(`global.runId fora do padrão: ${json.runId}`);

const sections = json.data?.sections;
if (!sections || typeof sections !== "object" || Object.keys(sections).length === 0) {
  errors.push("data.sections ausente ou vazio");
}

// ── por seção ────────────────────────────────────────────────
for (const [id, s] of Object.entries(sections ?? {})) {
  const at = `sections.${id}`;
  if (isV2) {
    errors.push(...validateInsightEntry(s, id));
    continue;
  }
  if (typeof s.pt !== "string" || !s.pt.trim()) errors.push(`${at}.pt ausente/vazio`);
  if (typeof s.en !== "string" || !s.en.trim()) errors.push(`${at}.en ausente/vazio`);
  if (!(ISO_DATE.test(s.dataAsOf ?? "") || ISO_DT.test(s.dataAsOf ?? ""))) errors.push(`${at}.dataAsOf inválido: ${s.dataAsOf}`);
  if (!["fresh", "stale"].includes(s.freshness)) errors.push(`${at}.freshness inválido: ${s.freshness}`);
  if (!LEVELS.has(s.confidence?.data)) errors.push(`${at}.confidence.data inválido: ${s.confidence?.data}`);
  if (!LEVELS.has(s.confidence?.interpretation)) errors.push(`${at}.confidence.interpretation inválido: ${s.confidence?.interpretation}`);
  if (typeof s.promptVersion !== "string") errors.push(`${at}.promptVersion ausente (proveniência)`);
  if (!ISO_DT.test(s.generatedAt ?? "")) errors.push(`${at}.generatedAt ausente/inválido (proveniência)`);
  if (!STATUSES.has(s.generationStatus)) errors.push(`${at}.generationStatus inválido: ${s.generationStatus}`);
  if (s.runId !== undefined && !RUN_ID.test(s.runId)) errors.push(`${at}.runId fora do padrão: ${s.runId}`);

  // ── regressão editorial: sigla expandida na 1ª ocorrência (bloqueante) ──
  for (const lang of ["pt", "en"]) {
    const text = s[lang] ?? "";
    if (/\bCBAM\b/.test(text) && !/Carbon Border Adjustment Mechanism/.test(text))
      errors.push(`${at}.${lang}: sigla CBAM sem expansão na 1ª ocorrência`);
    if (/\bRWA\b/.test(text) && !/real[ -]world assets/i.test(text))
      errors.push(`${at}.${lang}: sigla RWA sem expansão`);
    if (/BRICS\+/.test(text) && !/Brasil, Rússia, Índia, China|Brazil, Russia, India, China/i.test(text))
      errors.push(`${at}.${lang}: BRICS+ sem expansão`);
    // RN-006 (heurística): possível total derivado — aviso, não bloqueia
    if (/(somam?|totaliza\w*|no total de)\s+(US\$|€|R\$)/i.test(text))
      warnings.push(`${at}.${lang}: possível total derivado ("somam/total" + valor) — verificar RN-006 manualmente`);
  }
}


// ── generation gate ─────────────────────────────────────────
if (isV2) {
  const entries = Object.values(sections ?? {});
  const generatedCount = entries.filter((s) => s.status === "generated").length;
  const controlledFailures = entries.filter((s) => s.status === "failed_controlled").length;
  const allProvenance = entries.flatMap((s) => s.provenance ?? []);
  const evidenceClaims = entries.flatMap((s) => s.claims ?? []).filter((c) => c.kind === "fact");
  const evidenceCovered = evidenceClaims.length === 0
    ? 1
    : evidenceClaims.filter((c) => (c.evidenceRefs ?? []).length > 0).length / evidenceClaims.length;
  const provenanceCoverage = allProvenance.length === 0 ? 0 : evidenceCovered;
  const confidencePresent = entries.every((s) => LEVELS.has(s.confidence?.data) && LEVELS.has(s.confidence?.interpretation));
  const freshnessOk = entries.every((s) => s.freshness === undefined || s.freshness === "fresh" || s.freshness === "stale");
  const bannedClaims = entries.flatMap((s) => s.claims ?? []).filter((c) => /\b(always|never|guaranteed|certainly)\b/i.test(c.textEn)).length;
  const economicLawHighHasNorms = entries.every((s) =>
    s.economicLaw?.relevance !== "high" ||
    (Array.isArray(s.economicLaw.norms) && s.economicLaw.norms.length > 0 &&
     Array.isArray(s.economicLaw.institutions) && s.economicLaw.institutions.length > 0 &&
     Array.isArray(s.economicLaw.sourceRefs) && s.economicLaw.sourceRefs.length > 0)
  );
  const publishAllowed = errors.length === 0 && generatedCount > 0 && controlledFailures === 0 &&
    provenanceCoverage >= 0.5 && confidencePresent && freshnessOk && bannedClaims === 0 && economicLawHighHasNorms;
  console.log(`Generation gate: ${publishAllowed ? "PASS" : "BLOCK"} | generated=${generatedCount} provenanceCoverage=${provenanceCoverage.toFixed(2)}`);
  if (!publishAllowed) errors.push("generation gate bloqueou publicação do artefato v2");
}

// ── relatório ────────────────────────────────────────────────
for (const w of warnings) console.warn(`AVISO: ${w}`);
if (errors.length) {
  for (const e of errors) console.error(`ERRO: ${e}`);
  console.error(`\n${errors.length} erro(s), ${warnings.length} aviso(s) — insights.json REPROVADO.`);
  process.exit(1);
}
console.log(`insights.json APROVADO — ${Object.keys(sections).length} seção(ões), ${warnings.length} aviso(s).`);
console.log(`Global: prompt v${json.promptVersion} · modelo ${json.model} · ${json.runId ?? "sem runId (artefato anterior ao runId)"}`);
