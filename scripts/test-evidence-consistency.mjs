// ODIN — testes determinísticos da consistência claim ↔ evidência.
// Fixtures em contracts/consistency/fixtures: *.fail.json devem ser bloqueadas
// pelas regras esperadas; *.pass.json não podem gerar erro.
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  checkEvidenceConsistency, formatConsistencyError, extractDates, numberCandidates,
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
