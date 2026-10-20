// ODIN — testes determinísticos da consistência claim ↔ evidência.
// Fixtures em contracts/consistency/fixtures: *.fail.json devem ser bloqueadas
// pelas regras esperadas; *.pass.json não podem gerar erro.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  checkEvidenceConsistency, formatConsistencyError, extractDates, numberCandidates, checkComparisons,
} from "./evidence-consistency.mjs";

const dir = path.resolve(process.cwd(), "contracts/consistency/fixtures");
let failures = 0;
const assert = (cond, msg) => { if (!cond) { failures += 1; console.error("FALHA:", msg); } };

// Normalização numérica e de datas.
const has = (token, n) => numberCandidates(token).includes(n);
assert(has("1321", 1321), "1321");
assert(has("1.321", 1321) && has("1,321", 1321), "separador de milhar pt/en");
assert(has("22,4", 22.4) && has("22.4", 22.4), "decimal pt/en");
assert(has("1.234.567,8", 1234567.8), "milhar + decimal pt");
assert(has("1,234,567.8", 1234567.8), "milhar + decimal en");
assert(extractDates("25 de setembro de 2025").dates.has("2025-09-25"), "data pt por extenso");
assert(extractDates("September 25, 2025").dates.has("2025-09-25"), "data en por extenso");
assert(extractDates("1º de janeiro de 2026").dates.has("2026-01-01"), "data pt com ordinal");
assert(extractDates("prazo 30/09/2027").dates.has("2027-09-30"), "data dd/mm/aaaa");

// Material ausente bloqueia.
assert(checkEvidenceConsistency({ sectionId: "x", claims: [] }, undefined).some(e => e.rule === "evidence_material_missing"), "material ausente deve bloquear");

// Número inventado em fact bloqueia.
const invented = checkEvidenceConsistency(
  { sectionId: "x", claims: [{ id: "c1", kind: "fact", textPt: "O valor foi 99,9 mm.", textEn: "The value was 99.9 mm." }] },
  { material: "value 12.5 mm", keyDates: [], comparisons: [] },
);
assert(invented.some(e => e.rule === "fact_number_not_in_source"), "número inventado em fact deve bloquear");

// Contrato editorial (gate v1.4): unidades e falsos positivos.

const { hasTerm, checkEconomicLaw, checkWatch } = await import("./editorial-contract.mjs");
assert(hasTerm("Atualizações da SEC", "sec") && !hasTerm("setor secundário", "sec"), "termo curto casa só palavra inteira");
assert(hasTerm("Precipitação em Brasília", "precipitac*"), "prefixo sem acento");
const LEGAL = [
  { id: "eu-reg-2023-956", kind: "norm", labels: ["Regulation (EU) 2023/956", "Regulamento (UE) 2023/956", "2023/956"] },
  { id: "european-commission", kind: "institution", labels: ["European Commission", "Comissão Europeia"] },
];
const base = { provenance: [{ sourceId: "source-carbon-ec" }] };
const mismatch = checkEconomicLaw({ ...base, economicLaw: { relevance: "high", pt: "Obrigações sob o Regulamento (UE) 2023/956.", en: "Obligations for EU importers.", norms: ["Regulation (EU) 2023/956"], institutions: ["European Commission"], sourceRefs: ["source-carbon-ec"] } }, { legalRefs: LEGAL });
assert(mismatch.some((e) => e.rule === "law_pt_en_mismatch"), "pt cita norma que en não cita → law_pt_en_mismatch");
const equivalent = checkEconomicLaw({ ...base, economicLaw: { relevance: "high", pt: "Obrigações sob o Regulamento (UE) 2023/956.", en: "Obligations under Regulation (EU) 2023/956.", norms: ["Regulamento (UE) 2023/956"], institutions: ["Comissão Europeia"], sourceRefs: ["source-carbon-ec"] } }, { legalRefs: LEGAL });
assert(equivalent.length === 0, `nomes diferentes da mesma norma em pt/en devem passar: ${equivalent.map(formatConsistencyError)}`);
const incomplete = checkEconomicLaw({ ...base, economicLaw: { relevance: "high", pt: "x", en: "x", norms: [], institutions: [], sourceRefs: [] } }, { legalRefs: LEGAL });
assert(incomplete.some((e) => e.rule === "law_high_incomplete"), "high sem norma/instituição → law_high_incomplete");
const notMaterial = checkEconomicLaw({ ...base, economicLaw: { relevance: "not_material", pt: "Sem lente jurídica.", en: "No legal lens.", norms: [], institutions: [], sourceRefs: [] } }, { legalRefs: [] });
assert(notMaterial.length === 0, "not_material com listas vazias deve passar");
const annual = checkWatch({ whatToWatch: [{ signal: "Prazo da primeira declaração anual do CBAM", source: "source-carbon-ec", expectedDate: "2027-09-30", whyItMatters: "x" }] }, { material: "due by 2027-09-30", keyDates: [] });
assert(annual.length === 0, `"declaração anual" sem métrica de preço não é erro de cadência: ${annual.map(formatConsistencyError)}`);

// Comparações com atribuição determinística (dados reais do CBAM: Q3 2026 = 82,32 é o
// observado; Q2 2026 = 75,28 é a referência; direção "above").
const CBAM = { id: "cbam-price-latest-vs-previous", observed: 82.32, reference: 75.28, unit: "€/tCO2e", direction: "above", observedLabel: "Q3 2026", referenceLabel: "Q2 2026", referenceAliases: ["trimestre anterior", "período anterior", "previous quarter", "prior quarter", "previous period"] };
const CBAM_LEGACY = { id: CBAM.id, observed: CBAM.observed, reference: CBAM.reference, unit: CBAM.unit, direction: CBAM.direction };
const cmpErrors = (text, cmp = CBAM) => checkComparisons({ pt: text }, [cmp]);
const mustPass = (text, cmp) => { const e = cmpErrors(text, cmp); assert(e.length === 0, `deveria passar: "${text}" → ${e.map(formatConsistencyError).join(" | ")}`); };
const mustBlock = (text, cmp, detail) => {
  const e = cmpErrors(text, cmp);
  assert(e.length > 0 && e.every((x) => x.rule === "comparison_direction"), `deveria bloquear: "${text}"`);
  if (detail) assert(e.some((x) => x.detail.includes(detail)), `deveria citar "${detail}": "${text}"`);
};
for (const [q2, q3] of [["Q2 2026", "Q3 2026"], ["Q2 de 2026", "Q3 de 2026"]]) {
  // pt — a frase real do GLM (run 39483714772) é a primeira da variante "Q2 2026".
  mustPass(`O preço do CBAM no ${q2} foi de 75,28 €/tCO2e, abaixo do preço do ${q3}.`);
  mustPass(`O preço do CBAM no ${q3} foi de 82,32 €/tCO2e, acima dos 75,28 €/tCO2e do ${q2}.`);
  mustBlock(`O preço do CBAM no ${q3} foi de 82,32 €/tCO2e, abaixo dos 75,28 €/tCO2e do ${q2}.`);
  mustBlock(`O preço do CBAM no ${q2} foi de 75,28 €/tCO2e, acima do preço do ${q3}.`);
  // en
  mustPass(`The CBAM price in ${q2} was 75.28 €/tCO2e, below the ${q3} price.`);
  mustPass(`The CBAM price in ${q3} was 82.32 €/tCO2e, above the 75.28 €/tCO2e of ${q2}.`);
  mustBlock(`The CBAM price in ${q3} was 82.32 €/tCO2e, below the 75.28 €/tCO2e of ${q2}.`);
  mustBlock(`The CBAM price in ${q2} was 75.28 €/tCO2e, above the ${q3} price.`);
}
// Frases com as duas direções: uma afirmação contraditória nunca é aprovada.
const both = [
  "O preço do CBAM no Q3 2026 foi de 82,32 €/tCO2e, acima dos 75,28 €/tCO2e do Q2 2026 e abaixo dos 75,28 €/tCO2e do Q2 2026.",
  "O preço do CBAM no Q3 2026 foi de 82,32 €/tCO2e, acima do Q2 2026 (75,28 €/tCO2e) e abaixo do Q2 2026.",
  "The Q3 2026 price of 82.32 €/tCO2e is above the 75.28 €/tCO2e of Q2 2026 and below the 75.28 €/tCO2e of Q2 2026.",
  "The Q3 2026 price of 82.32 €/tCO2e is below the 75.28 €/tCO2e of Q2 2026 and above the 75.28 €/tCO2e of Q2 2026.",
];
for (const s of both) mustBlock(s);
// Documenta o limite anterior: sem rótulos, a mesma frase contraditória ainda passaria.
assert(cmpErrors(both[0], CBAM_LEGACY).length === 0, "caminho legado sem rótulos mantém a limitação documentada");
// Ambiguidade: sem objeto identificável → bloqueio conservador.
mustBlock("Em comparação com o Q2 2026 (75,28 €/tCO2e), o preço ficou acima.", CBAM, "atribuição ambígua");
// Sujeito explícito em cada oração: afirmação verdadeira passa mesmo com as duas direções.
mustPass("O preço do CBAM no Q3 2026 foi de 82,32 €/tCO2e, acima dos 75,28 €/tCO2e do Q2 2026, e o Q2 2026 ficou abaixo do Q3 2026.");
// Vínculo período ↔ valor e expressões da referência (revisão do PR #72).
const WRONG = "valor associado ao período errado";
mustBlock("O preço do CBAM no Q2 2026 foi de 82,32 €/tCO2e, acima do preço de 75,28 €/tCO2e no Q3 2026.", CBAM, WRONG);
mustBlock("The CBAM price in Q2 2026 was 82.32 €/tCO2e, above the 75.28 €/tCO2e price in Q3 2026.", CBAM, WRONG);
mustBlock("O preço do CBAM subiu de 82,32 €/tCO2e em Q2 2026 para 75,28 €/tCO2e em Q3 2026.", CBAM, WRONG);
mustBlock("O preço do CBAM no Q3 2026 foi de 75,28 €/tCO2e.", CBAM, WRONG);
mustBlock("Q2 2026 (82,32 €/tCO2e) e Q3 2026 (75,28 €/tCO2e).", CBAM, WRONG);
mustBlock("O preço do CBAM subiu de 75,28 €/tCO2e em Q2 2026 para 82,32 €/tCO2e em Q3 2026, mantendo-se abaixo do trimestre anterior.", CBAM, "contradiz");
mustPass("O preço do CBAM subiu de 75,28 €/tCO2e em Q2 2026 para 82,32 €/tCO2e em Q3 2026, mantendo-se acima do trimestre anterior.");
mustPass("The CBAM price rose from 75.28 €/tCO2e in Q2 2026 to 82.32 €/tCO2e in Q3 2026, remaining above the previous quarter.");
mustBlock("The CBAM price rose from 75.28 €/tCO2e in Q2 2026 to 82.32 €/tCO2e in Q3 2026, remaining below the PREVIOUS QUARTER.", CBAM, "contradiz");
mustPass("Em comparação com o Q2 2026 (75,28 €/tCO2e), o Q3 2026 ficou acima, em 82,32 €/tCO2e.");
mustPass("Q2 2026 (75,28 €/tCO2e) e Q3 2026 (82,32 €/tCO2e).");
mustPass("O preço do CBAM no Q3 2026 foi de 82,32 €/tCO2e.");
mustPass("O preço do Q3 2026 ficou acima das expectativas do mercado, em 82,32 €/tCO2e.");
mustPass("O preço do Q3 2026 foi de 82,32 €/tCO2e, acima das expectativas, e superior ao do Q2 2026.");
// Valor sem rótulo vizinho não é restringido pelo vínculo.
mustPass("A variação foi de 82,32 menos 75,28 €/tCO2e.");
// Limite conhecido (falso positivo conservador): enumeração de rótulos antes dos valores.
mustBlock("Entre Q2 2026 e Q3 2026, o preço passou de 75,28 €/tCO2e para 82,32 €/tCO2e.", CBAM, WRONG);
// Sem rótulos (clima: referência fixa): comportamento anterior preservado.
const CLIMATE = { id: "climate-temp-vs-reference", observed: 23.1, reference: 21.4, unit: "°C", direction: "above" };
mustPass("A temperatura média de 23,1 °C ficou acima da referência de 21,4 °C.", CLIMATE);
mustBlock("A temperatura média de 23,1 °C ficou abaixo da referência de 21,4 °C.", CLIMATE);
// Frase sem relação com a comparação não é afetada.
mustPass("A variação mensal do preço ficou acima de 1,5 €/tCO2e.");
// Integração: o gate completo propaga o resultado.
const gate = (pt) => checkEvidenceConsistency({ sectionId: "carbon", claims: [], pt }, { material: "Q2 2026 75,28 Q3 2026 82,32", keyDates: [], comparisons: [CBAM] }).filter((e) => e.rule === "comparison_direction");
assert(gate("O preço do CBAM no Q2 2026 foi de 75,28 €/tCO2e, acima do preço do Q3 2026.").length > 0, "gate completo deve bloquear a frase 4");

// Fixtures de regressão.
for (const file of (await readdir(dir)).filter(f => f.endsWith(".json")).sort()) {
  const fx = JSON.parse(await readFile(path.join(dir, file), "utf8"));
  const errors = checkEvidenceConsistency(fx.entry, fx.evidence);
  if (fx.expect === "pass") {
    assert(errors.length === 0, `${file} deveria passar: ${errors.map(formatConsistencyError).join(" | ")}`);
  } else {
    assert(errors.length > 0, `${file} deveria ser bloqueada`);
    for (const rule of fx.expectRules ?? []) assert(errors.some(e => e.rule === rule), `${file} deveria acionar ${rule}`);
    console.log(`${file}: BLOCK (${errors.length})`);
    for (const e of errors) console.log("   ", formatConsistencyError(e));
  }
}

if (failures) { console.error(`evidence consistency: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN evidence consistency: PASS");
