// ODIN — M1 · Emergency MVP Gate: 5 camadas, retry de contrato, snapshot.
import { readFile } from "node:fs/promises";
import { checkLayerCompleteness, validateModelOutput, NOT_MATERIAL_PT, NOT_MATERIAL_EN } from "./insights-schema.mjs";
import { checkTemporalShape } from "./editorial-contract.mjs";

let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

const fx = JSON.parse(await readFile("contracts/consistency/fixtures/8ab9-climate-corrected.pass.json", "utf8")).entry;
const ok = { ...fx, whatToWatch: [fx.whatToWatch[0]] };
assert(checkLayerCompleteness(ok, "climate").length === 0, `seção completa deveria passar: ${checkLayerCompleteness(ok, "climate")}`);

// Caso real do run c876: 1 item válido + 4 objetos vazios no What to Watch.
const c876 = { ...ok, whatToWatch: [fx.whatToWatch[0], {}, {}, {}, {}] };
assert(checkLayerCompleteness(c876, "carbon").some((e) => e.includes("What to Watch: exatamente 1")), "c876: 5 itens deve falhar na completude");
assert(validateModelOutput(c876, "carbon", ["source-open-meteo-brasilia"]).some((e) => e.includes("whatToWatch[1].signal ausente")), "c876: itens vazios devem ir para o retry de contrato");

// Camadas faltando.
assert(checkLayerCompleteness({ ...ok, thesis: undefined }, "x").some((e) => e.includes("Tese")), "sem tese deve falhar");
assert(checkLayerCompleteness({ ...ok, stakeholderImplications: [ok.stakeholderImplications[0]] }, "x").some((e) => e.includes("Stakeholders")), "1 stakeholder deve falhar");
assert(checkLayerCompleteness({ ...ok, whatToWatch: [] }, "x").some((e) => e.includes("What to Watch")), "0 watch deve falhar");

// Fallback not_material.
const nm = { relevance: "not_material", pt: NOT_MATERIAL_PT, en: NOT_MATERIAL_EN, norms: [], institutions: [], sourceRefs: [] };
assert(checkLayerCompleteness({ ...ok, economicLaw: nm }, "x").length === 0, "not_material com declaração e listas vazias deve passar");
assert(checkLayerCompleteness({ ...ok, economicLaw: { ...nm, norms: ["MiCA"] } }, "x").some((e) => e.includes("not_material exige")), "not_material com norma deve falhar");

// Snapshot: negação e limitations não são tendência (falso positivo do run c876).
const snap = { temporalShape: "snapshot" };
const base = { pt: "Capitalização de US$ 284,9 bilhões.", en: "Capitalization of US$ 284.9 billion.", claims: [] };
assert(checkTemporalShape({ ...base, limitations: "Não há série temporal; não é possível inferir tendência." }, snap).length === 0, "limitations declarando ausência de tendência deve passar");
assert(checkTemporalShape({ ...base, pt: "Com um único snapshot, não é possível inferir tendência." }, snap).length === 0, "frase negada deve passar");
assert(checkTemporalShape({ ...base, thesis: { pt: "O crescimento das stablecoins reflete demanda.", en: "Growth reflects demand." } }, snap).length > 0, "tendência afirmada continua bloqueando");

// Run odin-20261010-122912-5356 (blockchain, snapshot DefiLlama): frases reais.
const realGrowth = { textPt: "Equipes podem monitorar o crescimento do TVL de RWA como sinal de demanda por tokenização de ativos tradicionais.", textEn: "Teams may monitor RWA TVL growth as a signal of demand for traditional asset tokenization." };
const realEvolution = { textPt: "Empresas expostas a criptoativos podem acompanhar a evolução do TVL de RWA.", textEn: "Companies exposed to cryptoassets may track the evolution of RWA TVL." };
for (const [field, wrap] of [["stakeholderImplications", (x) => ({ stakeholderImplications: [x] })], ["decisionLens.implications", (x) => ({ decisionLens: { implications: [x] } })]]) {
  for (const [name, item] of [["crescimento", realGrowth], ["evolução", realEvolution]]) {
    const errs = checkTemporalShape({ ...base, ...wrap(item) }, snap);
    assert(errs.some((e) => e.path.endsWith(".pt")) && errs.some((e) => e.path.endsWith(".en")), `${field}: "${name}" deve bloquear em PT e EN`);
  }
}
// Frase segura: valor atual, sem tendência inferida.
const safe = { textPt: "Empresas expostas a criptoativos podem usar os valores atuais de TVL da amostra para mapear protocolos RWA relevantes, sem inferir tendências temporais.", textEn: "Companies exposed to cryptoassets may use the current TVL sample to map relevant RWA protocols without inferring temporal trends." };
assert(checkTemporalShape({ ...base, stakeholderImplications: [safe], decisionLens: { implications: [safe] } }, snap).length === 0, "frase segura (sem inferir tendência) deve passar");
// Vocabulário de movimento.
for (const t of ["O TVL subiu na semana.", "O TVL caiu.", "Stablecoins seguem em alta.", "O mercado está em queda.", "TVL is rising.", "TVL is falling.", "Capitalization rose.", "Supply fell.", "A trajetória do TVL importa.", "Watch the change over the quarter."]) {
  assert(checkTemporalShape({ ...base, pt: t }, snap).length > 0, `movimento deve bloquear: "${t}"`);
}
// Falsos positivos: "alta"/"queda" sem sentido de movimento não bloqueiam.
for (const t of ["A amostra tem alta capitalização em poucos protocolos.", "Há alta concentração no Tether.", "O risco de queda de liquidez é uma hipótese a monitorar."]) {
  assert(checkTemporalShape({ ...base, pt: t }, snap).length === 0, `falso positivo: "${t}"`);
}
// A regra só vale para snapshot: séries com dois ou mais pontos podem falar em variação.
assert(checkTemporalShape({ ...base, pt: "A variação entre os trimestres é positiva." }, { temporalShape: "three_points" }).length === 0, "three_points não é snapshot");

if (failures) { console.error(`M1 layers: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN M1 layers: PASS (5 camadas, retry de contrato, snapshot)");
