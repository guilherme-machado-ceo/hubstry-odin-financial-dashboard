// ODIN — teste do Data & Intelligence Contract v1.1 (sem LLM, sem rede).
// 1. Linguagem de recomendação: fixtures de aprovação e bloqueio (PT/EN),
//    incluindo frases descritivas com "deve"/"must" que NÃO são recomendação.
// 2. Fixture base v1.1 (carbon) passa em schema, consistência com evidência e
//    todas as regras v1.1.
// 3. Mutações: cada violação dispara exatamente a regra esperada.
// 4. Compatibilidade: o M1 publicado (v1.0) continua válido.
// 5. Gate e promoção aceitam 1.0 e 1.1 e aplicam as regras v1.1.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { classifyRecommendation, checkContractV11, checkDecisionLens, structuralCorrectionCount, formatContractError } from "./contract-v11.mjs";
import { validateInsightEntry, SUPPORTED_CONTRACT_VERSIONS } from "./insights-schema.mjs";
import { checkEvidenceConsistency, formatConsistencyError } from "./evidence-consistency.mjs";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };
const load = async (p) => JSON.parse(await readFile(path.join(root, p), "utf8"));

// ── 1. Recomendação ─────────────────────────────────────────────────────────
const rec = await load("contracts/contract-v1.1/recommendation-fixtures.json");
for (const s of rec.pass) { const r = classifyRecommendation(s); assert(!r, `falso positivo (${r?.rule}): "${s}"`); }
for (const s of rec.block) assert(classifyRecommendation(s), `recomendação não bloqueada: "${s}"`);
assert(rec.pass.length >= 15 && rec.block.length >= 15, "fixtures de recomendação insuficientes");

// ── 2. Base v1.1 ────────────────────────────────────────────────────────────
const base = await load("contracts/contract-v1.1/carbon-v1.1.pass.json");
const clone = () => structuredClone(base.entry);
const v11 = (entry) => checkContractV11(entry, base.evidence);
assert(SUPPORTED_CONTRACT_VERSIONS.has("1.0") && SUPPORTED_CONTRACT_VERSIONS.has("1.1"), "versões suportadas devem incluir 1.0 e 1.1");
const schemaErr = validateInsightEntry(base.entry, "carbon");
assert(!schemaErr.length, `base v1.1 falha no schema: ${schemaErr.join("; ")}`);
const consErr = checkEvidenceConsistency(base.entry, base.evidence);
assert(!consErr.length, `base v1.1 falha na consistência: ${consErr.map(formatConsistencyError).join("; ")}`);
const baseErr = v11(base.entry);
assert(!baseErr.length, `base v1.1 falha nas regras v1.1: ${baseErr.map(formatContractError).join("; ")}`);

// ── 3. Mutações ─────────────────────────────────────────────────────────────
const cases = [
  ["lens_new_number", (e) => { e.decisionLens.implications[0].textPt = "Empresas exportadoras podem precisar acompanhar o preço do CBAM, hoje 81,40 €/tCO2e."; }],
  ["lens_new_date", (e) => { e.decisionLens.implications[0].textEn = "Exporters may need to track the CBAM price until 2028-03-31."; }],
  ["lens_new_source", (e) => { e.decisionLens.implications[0].textPt += " Ver https://example.com/cbam."; }],
  ["lens_new_causality", (e) => { e.decisionLens.implications[0].textPt = "Empresas exportadoras podem precisar acompanhar o preço do CBAM, porque ele determina a competitividade do setor."; }],
  ["recommendation_language", (e) => { e.decisionLens.implications[0].textPt = "Empresas exportadoras devem reduzir a exposição aos setores abrangidos."; }],
  ["recommendation_language", (e) => { e.decisionLens.implications[1].textEn = "Founders should renegotiate contracts with EU importers."; }],
  ["recommendation_language", (e) => { e.stakeholderImplications.find((s) => s.audience === "startups").textPt = "Explorar oportunidades em soluções de verificação de emissões."; }],
  ["lens_without_claims", (e) => { e.decisionLens.implications[0].claimRefs = []; }],
  ["lens_claim_ref", (e) => { e.decisionLens.implications[0].claimRefs = ["claim-99"]; }],
  ["lens_count", (e) => { e.decisionLens.implications = []; }],
  ["lens_count", (e) => { const i = e.decisionLens.implications[0]; e.decisionLens.implications = [i, i, i, i]; }],
  ["lens_type", (e) => { e.decisionLens.lens = "investor"; }],
  ["lens_missing", (e) => { delete e.decisionLens; }],
  ["watch_v11_field", (e) => { delete e.whatToWatch[0].signalEn; }],
  ["watch_v11_field", (e) => { delete e.whatToWatch[0].expectedDate; }],
  ["watch_v11_language", (e) => { e.whatToWatch[0].signalEn = e.whatToWatch[0].signalPt; }],
  ["watch_v11_source", (e) => { e.whatToWatch[0].sourceId = "source-inexistente"; }],
  ["data_verification", (e) => { delete e.provenance[0].verification; }],
  ["data_derivation", (e) => { e.provenance[0].derivation = "guessed"; }],
  ["event_date_not_in_source", (e) => { e.events[0].date = "2026-02-15"; }],
  ["event_without_data", (e) => { e.events[0].dataRefs = []; }],
  ["claim_event_ref", (e) => { e.claims[0].eventRefs = ["evt-inexistente"]; }],
  ["correction_misclassified", (e) => { e.editorialCorrection = { correctedAt: "2026-10-02", changes: [{ field: "claims[claim-1]", kind: "wording", reason: "teste" }] }; }],
  ["correction_shape", (e) => { e.editorialCorrection = { correctedAt: "2026-10-02", fields: ["thesis"] }; }],
];
for (const [rule, mutate] of cases) {
  const e = clone();
  mutate(e);
  const got = v11(e).map((x) => x.rule);
  assert(got.includes(rule), `mutação deveria disparar ${rule}; obteve [${got.join(", ")}]`);
}
// EVENT é opcional: sem eventos e sem eventRefs, a base continua válida.
{
  const e = clone(); delete e.events; for (const c of e.claims) delete c.eventRefs;
  assert(!v11(e).length, "EVENT deve ser opcional (CLAIM → DATA direto)");
}
// Causalidade é permitida quando o claim citado já a contém.
{
  const e = clone();
  e.claims.push({ id: "claim-c", kind: "interpretation", textPt: "Exportadores podem receber pedidos de dados devido à estrutura de responsabilidade do CBAM.", textEn: "Exporters may receive data requests due to the CBAM responsibility structure.", evidenceRefs: ["source-carbon-ec"], confidence: { data: "medium", interpretation: "medium" } });
  e.decisionLens.implications[0] = { textPt: "Exportadores podem precisar acompanhar pedidos de dados de instalação, devido à estrutura de responsabilidade do CBAM.", textEn: "Exporters may need to track installation data requests, due to the CBAM responsibility structure.", claimRefs: ["claim-c"] };
  const errs = checkDecisionLens(e, base.evidence);
  assert(!errs.some((x) => x.rule === "lens_new_causality"), "causalidade presente no claim citado não deve bloquear");
}
// Métrica de aceite do M3: mudanças estruturais pós-revisão.
{
  const e = clone();
  e.editorialCorrection = { correctedAt: "2026-10-02", changes: [{ field: "thesis", kind: "wording", reason: "grafia" }, { field: "stakeholderImplications[corporate]", kind: "wording", reason: "concordância" }] };
  assert(structuralCorrectionCount(e) === 0 && !v11(e).length, "correção só de redação deve contar 0 estruturais e passar");
  e.editorialCorrection.changes.push({ field: "whatToWatch.sourceId", kind: "structural", reason: "fonte errada" });
  assert(structuralCorrectionCount(e) === 1, "mudança estrutural deve ser contada");
}

// ── 4. Compatibilidade v1.0 ─────────────────────────────────────────────────
const pub = (await load("public/data/insights.v2.json")).data.sections;
for (const [id, entry] of Object.entries(pub)) {
  assert(entry.intelligenceContractVersion === "1.0", `${id}: publicado deveria seguir v1.0`);
  const errs = validateInsightEntry(entry, id);
  assert(!errs.length, `${id}: M1 publicado (v1.0) deixou de validar: ${errs.join("; ")}`);
}

// ── 5. Gate e promoção ──────────────────────────────────────────────────────
for (const f of ["scripts/validate-insights-shadow.mjs", "scripts/promote-insights.mjs"]) {
  const src = await readFile(path.join(root, f), "utf8");
  assert(src.includes("checkContractV11"), `${f} deve aplicar as regras v1.1`);
  assert(src.includes("SUPPORTED_CONTRACT_VERSIONS"), `${f} deve aceitar 1.0 e 1.1`);
}
const doc = await readFile(path.join(root, "docs/odin-intelligence-contract-v1.1.md"), "utf8");
for (const term of ["SOURCE", "DATA", "(EVENT)", "CLAIM", "CONTEXT", "INTERPRETATION", "DECISION LENS", "verification", "derivation", "signalEn", "whyItMattersEn", "structural"]) assert(doc.includes(term), `documento v1.1 sem "${term}"`);

console.log(`contrato v1.1: ${rec.pass.length} frases contextuais e ${rec.block.length} recomendações classificadas · ${cases.length} mutações · ${Object.keys(pub).length} seções v1.0 compatíveis`);
if (failures) { console.error(`${failures} falha(s)`); process.exit(1); }
console.log("OK — Data & Intelligence Contract v1.1 coerente e retrocompatível.");
