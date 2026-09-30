import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateInsightEntry } from "./insights-schema.mjs";
import { validateSectionProfile } from "./insights-profile-validator.mjs";

const root = path.resolve(process.cwd());
const fixture = (name) => path.join(root,"contracts/sections/carbon/fixtures",name);

async function load(name) { return JSON.parse(await readFile(fixture(name),"utf8")); }
function assert(condition, message) { if (!condition) throw new Error(message); }

const valid = await load("valid.json");
const structural = await load("invalid-structure.json");
const semantic = await load("invalid-semantics.json");
const regression = await load("regression-published.json");

assert(validateSectionProfile(valid,"carbon").length === 0,"fixture valid.json deveria passar");
assert(validateSectionProfile(structural,"carbon").length > 0,"fixture invalid-structure.json deveria falhar");
assert(validateSectionProfile(semantic,"carbon").length > 0,"fixture invalid-semantics.json deveria falhar");

const regressionErrors = validateInsightEntry(regression,"carbon");
assert(regressionErrors.length === 0,`regression-published.json quebrou o contrato-base: ${regressionErrors.join("; ")}`);

// Máquina de estados do profile-validator (ADR-0003):
// sem sectionProfile -> legado, compatível; profile desconhecido -> BLOCK.
assert(validateSectionProfile({ sectionId: "carbon" }, "carbon").length === 0, "seção sem sectionProfile deve seguir contrato legado");
assert(validateSectionProfile({ sectionId: "carbon", sectionProfile: "inexistente" }, "carbon").length > 0, "sectionProfile desconhecido deveria bloquear");

console.log("ODIN section profiles: fixtures PASS");
