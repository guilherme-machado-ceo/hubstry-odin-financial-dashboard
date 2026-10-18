// ODIN — testes do gate do Open Markets (scripts/validate-open-markets.mjs).
// Sem rede: parte do snapshot versionado e aplica mutações controladas.
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { validateSnapshot, regressions } from "./validate-open-markets.mjs";

const SNAP = "src/data/generated/open-markets.json";
const base = () => JSON.parse(readFileSync(SNAP, "utf8"));
let failures = 0, total = 0;
const test = (name, fn) => {
  total += 1;
  try { fn(); console.log(`ok   ${name}`); }
  catch (err) { failures += 1; console.error(`FALHA ${name}: ${err.message}`); }
};
const assert = (c, m) => { if (!c) throw new Error(m); };
const blocked = (d, frag) => {
  const errs = validateSnapshot(d);
  assert(errs.some((x) => x.includes(frag)), `esperava erro contendo "${frag}", veio: ${JSON.stringify(errs)}`);
};

const tmp = mkdtempSync(path.join(tmpdir(), "om-gate-"));
const cli = (args) => spawnSync(process.execPath, ["scripts/validate-open-markets.mjs", ...args], { encoding: "utf8" });
const write = (name, data) => { const p = path.join(tmp, name); writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data)); return p; };

// ── Arquivo válido ──────────────────────────────────────────────────────────
test("snapshot versionado passa", () => assert(validateSnapshot(base()).length === 0, JSON.stringify(validateSnapshot(base()))));
test("CLI: válido e igual ao anterior → exit 0", () => {
  const p = write("ok.json", base());
  assert(cli([p, "--previous", SNAP]).status === 0, "esperava exit 0");
});

// ── Arquivo malformado ──────────────────────────────────────────────────────
test("CLI: JSON inválido → exit 1", () => assert(cli([write("bad.json", "{ nao é json")]).status === 1, "esperava exit 1"));
test("CLI: arquivo vazio → exit 1", () => assert(cli([write("vazio.json", "")]).status === 1, "esperava exit 1"));
test("CLI: arquivo inexistente → exit 1", () => assert(cli([path.join(tmp, "nao-existe.json")]).status === 1, "esperava exit 1"));

// ── Blocos e campos obrigatórios ────────────────────────────────────────────
for (const b of ["yieldDifferential", "fxVolatility", "oil"]) {
  test(`bloco ${b} ausente bloqueia`, () => { const d = base(); delete d[b]; blocked(d, `bloco '${b}' ausente`); });
}
test("procedência inválida bloqueia", () => { const d = base(); d.fxVolatility.verification = "talvez"; blocked(d, "verification inválida"); });
test("método EN ausente bloqueia", () => { const d = base(); d.oil.methodEn = ""; blocked(d, "método PT/EN ausente"); });
test("catálogo de séries ausente bloqueia", () => { const d = base(); delete d.series; blocked(d, "catálogo 'series' ausente"); });

// ── Números ─────────────────────────────────────────────────────────────────
test("valor anual não numérico bloqueia", () => { const d = base(); const y = Object.keys(d.oil.brent.annual)[0]; d.oil.brent.annual[y] = null; blocked(d, "oil.brent.annual"); });
test("volatilidade negativa bloqueia", () => { const d = base(); const c = d.fxVolatility.currencies[0]; const y = Object.keys(c.annual)[0]; c.annual[y] = -1; blocked(d, "annual"); });
test("preço de petróleo zero bloqueia", () => { const d = base(); d.oil.wti.latest.value = 0; blocked(d, "oil.wti.latest inválido"); });

// ── Coerência ───────────────────────────────────────────────────────────────
test("série citada fora do catálogo bloqueia", () => { const d = base(); delete d.series[d.fxVolatility.currencies[0].seriesId]; blocked(d, "fora do catálogo"); });
test("pb incoerente bloqueia", () => { const d = base(); d.yieldDifferential.countries[0].latest.bps += 50; blocked(d, "não bate"); });
test("tendência contradiz Δ12m bloqueia", () => {
  const d = base(); const c = d.yieldDifferential.countries[0];
  c.delta12mBps = 100; c.trend = "stable"; blocked(d, "contradiz");
});

// ── Coleta parcial (não regressão) ──────────────────────────────────────────
test("moeda perdida em relação ao atual bloqueia", () => {
  const prev = base(), next = base(); next.fxVolatility.currencies.shift();
  assert(regressions(next, prev).some((m) => m.includes("moedas")), "esperava regressão de moedas");
});
test("país perdido em relação ao atual bloqueia", () => {
  const prev = base(), next = base(); next.yieldDifferential.countries.pop();
  assert(regressions(next, prev).some((m) => m.includes("países")), "esperava regressão de países");
});
test("petróleo perdido (null) em relação ao atual bloqueia", () => {
  const prev = base(), next = base(); next.oil.wti = null;
  assert(validateSnapshot(next).length === 0, "null em oil é estruturalmente válido");
  assert(regressions(next, prev).some((m) => m.includes("petróleo")), "esperava regressão de petróleo");
});
test("CLI: coleta parcial → exit 1 (snapshot anterior preservado)", () => {
  const next = base(); next.fxVolatility.currencies.pop();
  assert(cli([write("parcial.json", next), "--previous", SNAP]).status === 1, "esperava exit 1");
});
test("cobertura maior que a atual passa", () => {
  const prev = base(); prev.fxVolatility.currencies.pop();
  assert(regressions(base(), prev).length === 0, "não deveria haver regressão");
});

rmSync(tmp, { recursive: true, force: true });
console.log(`\n${total - failures}/${total} testes passaram`);
process.exit(failures ? 1 : 0);
