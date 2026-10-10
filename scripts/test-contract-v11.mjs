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
import { classifyRecommendation, checkContractV11, checkDecisionLens, structuralCorrectionCount, formatContractError, validateModelOutputV11 } from "./contract-v11.mjs";
import { validateInsightEntry, SUPPORTED_CONTRACT_VERSIONS } from "./insights-schema.mjs";
import { checkEvidenceConsistency, formatConsistencyError } from "./evidence-consistency.mjs";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };
const load = async (p) => JSON.parse(await readFile(path.join(root, p), "utf8"));

// ── 1. Recomendação ─────────────────────────────────────────────────────────
const rec = await load("contracts/contract-v1.1/recommendation-fixtures.json");
for (const s of rec.contextual) { const r = classifyRecommendation(s); assert(!r, `falso positivo (${r?.rule}): "${s}"`); }
for (const { text, legalAnchors } of rec.legal_description) { const r = classifyRecommendation(text, { legalAnchors }); assert(!r, `obrigação legal ancorada bloqueada (${r?.rule}): "${text}"`); }
for (const s of rec.legal_without_anchor) assert(classifyRecommendation(s), `obrigação legal SEM âncora deveria bloquear: "${s}"`);
for (const s of rec.recommendation) assert(classifyRecommendation(s), `recomendação não bloqueada: "${s}"`);
// Âncora não vira passe livre: recomendação continua bloqueada mesmo com norma na seção.
for (const s of rec.recommendation) assert(classifyRecommendation(s, { legalAnchors: ["Regulation (EU) 2023/956"] }), `âncora jurídica liberou recomendação: "${s}"`);
assert(rec.contextual.length >= 15 && rec.recommendation.length >= 20 && rec.legal_description.length >= 2, "fixtures de recomendação insuficientes");

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
// lens_claim_coverage: casos reais dos shadows #34 e #32 (métrica usada sem o claim que a sustenta).
{
  const c = (id, textPt, textEn) => ({ id, kind: "fact", textPt, textEn, evidenceRefs: ["source-carbon-ec"], confidence: { data: "high", interpretation: "medium" } });
  const lensCase = (claims, imp) => ({ claims, decisionLens: { lens: "founder_ceo", implications: [imp] } });
  const cov = (e, ev = base.evidence) => checkDecisionLens(e, ev).filter((x) => x.rule === "lens_claim_coverage");
  const realCases = [
    ["#34 blockchain (TVL → claim de stablecoins)", lensCase([
      c("claim-0", "A capitalização de mercado de stablecoins totaliza US$ 283,8 bilhões, com Tether representando US$ 184,1 bilhões.", "Stablecoin market capitalization totals US$ 283.8 billion, with Tether at US$ 184.1 billion."),
      c("claim-1", "O TVL de protocolos RWA inclui Invesco USTB (US$ 597,7 milhões), Ethena USDtb (US$ 470,3 milhões) e Re (US$ 405,5 milhões).", "RWA protocol TVL includes Invesco USTB (US$ 597.7 million), Ethena USDtb (US$ 470.3 million) and Re (US$ 405.5 million)."),
    ], { textPt: "Startups com modelos de RWA podem usar o TVL atual de protocolos como referência para alocação inicial de capital.", textEn: "Startups with RWA models may use current protocol TVL as a reference for initial capital allocation.", claimRefs: ["claim-0"] }), ["claim-1"], "TVL"],
    ["#34 clima (precipitação sem o claim de precipitação)", lensCase([
      c("claim-1", "A temperatura média em Brasília foi de 22,4°C no período de 2025-10-06 a 2026-10-05.", "Mean temperature in Brasília was 22.4°C from 2025-10-06 to 2026-10-05."),
      c("claim-2", "A precipitação total em Brasília foi de 1361 mm no período de 2025-10-06 a 2026-10-05.", "Total precipitation in Brasília was 1361 mm from 2025-10-06 to 2026-10-05."),
    ], { textPt: "Startups com sede em Brasília podem usar os valores atuais de temperatura e precipitação para planejar resiliência climática local.", textEn: "Brasília-based startups may use current temperature and precipitation values to plan local climate resilience.", claimRefs: ["claim-1"] }), ["claim-1", "claim-2"], "precipitação"],
    ["#32 carbono (emissões → só claim de preço)", lensCase([
      c("claim-0", "O preço do CBAM no Q3 2026 foi de 82,32 €/tCO2e, acima do Q2 2026 (75,28 €/tCO2e).", "The CBAM price in Q3 2026 was 82.32 €/tCO2e, above Q2 2026 (75.28 €/tCO2e)."),
      c("claim-2", "Pelo Regulamento (UE) 2023/956, o importador autorizado na UE é legalmente responsável por declarar as emissões embutidas no regime definitivo do CBAM.", "Under Regulation (EU) 2023/956, the authorized EU importer is legally responsible for declaring embedded emissions in the definitive CBAM regime."),
    ], { textPt: "Startups com exportações para a UE podem precisar acompanhar os requisitos de dados de emissões.", textEn: "Startups exporting to the EU may need to track emissions data requirements.", claimRefs: ["claim-0"] }), ["claim-0", "claim-2"], "emissões"],
  ];
  for (const [name, e, fixedRefs, group] of realCases) {
    const errs = cov(e);
    assert(errs.length && errs.every((x) => x.detail.includes(group)), `${name}: deveria bloquear por ${group}: ${errs.map(formatContractError).join(" | ")}`);
    // Mesma regra no gate final (checkContractV11) e na validação da nova tentativa automática.
    assert(v11(e).some((x) => x.rule === "lens_claim_coverage"), `${name}: gate final deveria acusar`);
    assert(validateModelOutputV11(e, "carbon", { provenance: base.entry.provenance, evidence: base.evidence }).some((x) => x.startsWith("[lens_claim_coverage]")), `${name}: validação da nova tentativa deveria acusar`);
    const fixed = structuredClone(e); fixed.decisionLens.implications[0].claimRefs = fixedRefs;
    assert(!cov(fixed).length, `${name}: com claimRefs ${fixedRefs.join(", ")} deveria passar`);
  }
  // Shadow #35: claim-3 falava só em "dados verificáveis de instalação" (sem "emissões"), e a regra
  // não tinha métrica para ancorar. Com o contexto 4.3.0 o claim explicita emissões embutidas:
  // a lente sobre monitoramento de emissões que cita só claims de preço passa a bloquear.
  {
    const price0 = c("claim-0", "O preço do CBAM no Q3 2026 foi de 82,32 €/tCO2e.", "The CBAM price in Q3 2026 was 82.32 €/tCO2e.");
    const price1 = c("claim-1", "O preço do CBAM no Q2 2026 foi de 75,28 €/tCO2e, e o preço do Q3 2026 está acima do do Q2 2026.", "The CBAM price in Q2 2026 was 75.28 €/tCO2e, and the Q3 2026 price is above Q2 2026.");
    const lens35 = { textPt: "Startups com exposição a cadeias de exportação de bens CBAM-cobertos podem usar o preço atual do CBAM para avaliar a possibilidade de investir em sistemas de monitoramento de emissões.", textEn: "Startups exposed to export chains of CBAM-covered goods may use the current CBAM price to assess investing in emissions monitoring systems.", claimRefs: ["claim-0", "claim-1"] };
    const claim3Old = c("claim-3", "A obrigação formal do CBAM recai sobre o declarante autorizado da UE; exportadores brasileiros podem enfrentar pedidos indiretos de dados verificáveis de instalação para bens cobertos.", "The formal CBAM obligation lies with the authorized EU declarant; Brazilian exporters may face indirect requests for verifiable installation data for covered goods.");
    const claim3New = c("claim-3", "A obrigação formal do CBAM recai sobre o declarante autorizado da UE; exportadores brasileiros de bens cobertos podem receber de importadores da UE pedidos de dados verificáveis de emissões embutidas por instalação.", "The formal CBAM obligation lies with the authorized EU declarant; Brazilian exporters of covered goods may receive requests from EU importers for verifiable installation-level embedded-emissions data.");
    assert(!cov(lensCase([price0, price1, claim3Old], lens35)).length, "#35 como gerado: sem métrica no claim-3, a regra não tem como acusar (lacuna documentada)");
    const e35 = lensCase([price0, price1, claim3New], lens35);
    assert(cov(e35).some((x) => x.detail.includes("emissões") && x.detail.includes("claim-3")), `#35 com claim-3 explícito: lente só com preço deveria bloquear: ${cov(e35).map(formatContractError).join(" | ")}`);
    assert(validateModelOutputV11(e35, "carbon", { provenance: base.entry.provenance, evidence: base.evidence }).some((x) => x.startsWith("[lens_claim_coverage]")), "#35: validação da nova tentativa deveria acusar");
    const fixed35 = structuredClone(e35); fixed35.decisionLens.implications[0].claimRefs = ["claim-0", "claim-3"];
    assert(!cov(fixed35).length, "#35: citando preço e o claim de emissões deveria passar");
  }
  // Termo de público, não métrica: "clientes importadores" não exige claim de importador.
  assert(!cov(base.entry).length, "base v1.1 (founders com clientes importadores) não deve acusar lens_claim_coverage");
  // Métrica ausente de todos os claims não é tratada aqui (não há claim a citar).
  assert(!cov(lensCase([c("claim-1", "O preço do CBAM foi de 82,32 €/tCO2e.", "The CBAM price was 82.32 €/tCO2e.")], { textPt: "Exportadores podem acompanhar a precipitação regional.", textEn: "Exporters may track regional precipitation.", claimRefs: ["claim-1"] })).length, "métrica sem claim correspondente não aciona a regra");
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

console.log(`contrato v1.1: ${rec.contextual.length} contextuais, ${rec.legal_description.length} obrigações legais ancoradas, ${rec.recommendation.length} recomendações · ${cases.length} mutações · ${Object.keys(pub).length} seções v1.0 compatíveis`);
if (failures) { console.error(`${failures} falha(s)`); process.exit(1); }
console.log("OK — Data & Intelligence Contract v1.1 coerente e retrocompatível.");
