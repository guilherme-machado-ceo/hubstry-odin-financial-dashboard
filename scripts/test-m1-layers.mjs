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

if (failures) { console.error(`M1 layers: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN M1 layers: PASS (5 camadas, retry de contrato, snapshot)");
