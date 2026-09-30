import { readFile } from "node:fs/promises";
import path from "node:path";
import { validateInsightEntry } from "./insights-schema.mjs";
import { validateSectionProfile } from "./insights-profile-validator.mjs";
import { checkFreshness } from "./insights-schema.mjs";
import { buildSectionProfile } from "./section-profile-builder.mjs";

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

// Gate estrito (MVP Readiness Gate): profile registrado ausente NÃO é válido.
assert(validateSectionProfile({ sectionId: "carbon" }, "carbon", { strict: true }).length > 0, "gate estrito: carbon sem profile deveria bloquear");
assert(validateSectionProfile({ sectionId: "blockchain" }, "blockchain", { strict: true }).length === 0, "gate estrito: seção sem profile registrado segue legado");
assert(validateSectionProfile(regression, "carbon", { strict: true }).length > 0, "gate estrito: shape pré-profile deveria bloquear");

// Builder determinístico: carbon corrigido + evidence → profile válido.
const fx = JSON.parse(await readFile(path.join(root, "contracts/consistency/fixtures/corrected-carbon.pass.json"), "utf8"));
const built = { ...fx.entry, ...buildSectionProfile("carbon", fx.entry, fx.evidence) };
const builtErrors = validateSectionProfile(built, "carbon", { strict: true });
assert(builtErrors.length === 0, `profile construído deveria passar: ${builtErrors.join("; ")}`);
assert(Object.keys(buildSectionProfile("blockchain", fx.entry, fx.evidence)).length === 0, "seção sem builder não recebe profile");

// Freshness.
const now = Date.parse("2026-09-30T12:00:00Z");
assert(checkFreshness({ validAsOf: "2026-07-06", nextReviewAt: "2026-10-05T00:00:00Z" }, "carbon", now).length === 0, "carbon de 86 dias deveria estar fresh");
assert(checkFreshness({ validAsOf: "2026-06-01" }, "carbon", now).length > 0, "carbon de 121 dias deveria ser stale");
assert(checkFreshness({ validAsOf: "2026-09-20" }, "blockchain", now).length > 0, "blockchain de 10 dias deveria ser stale");
assert(checkFreshness({ validAsOf: "2026-07-06", nextReviewAt: "2026-09-01T00:00:00Z" }, "carbon", now).length > 0, "nextReviewAt vencido deveria bloquear");
assert(checkFreshness({ validAsOf: "2026-12-01" }, "climate", now).length > 0, "validAsOf no futuro deveria bloquear");
assert(checkFreshness({}, "climate", now).length > 0, "validAsOf ausente deveria bloquear");

console.log("ODIN section profiles: fixtures PASS");
