// ODIN — testes da correção editorial humana (manifesto por runId) e da
// paridade entre validadores. Sem rede e sem custo de modelo.
//   1. o manifesto real do shadow #35 aplica-se ao artefato original;
//   2. o artefato corrigido passa pela PROMOÇÃO REAL (promote-insights.mjs),
//      com relógio controlado, e carrega editorialCorrection;
//   3. o manifesto é recusado em artefato diferente, valor esperado divergente,
//      campo protegido, classificação errada, caminho repetido ou inexistente;
//   4. paridade: toda violação acusada pela validação da nova tentativa
//      automática também é acusada pelo gate (consistência + contrato v1.1),
//      e uma correção humana que introduza tendência em snapshot é barrada
//      na promoção.
import { mkdtemp, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { applyManifest, canonicalHash, normalizedField } from "./apply-editorial-corrections.mjs";
import { validateModelOutputV11, checkContractV11, checkEditorialCorrection, structuralCorrectionCount } from "./contract-v11.mjs";
import { checkEvidenceConsistency } from "./evidence-consistency.mjs";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };
const RUN = "odin-20261010-131804-ec20";
const FIX = path.join(root, "contracts/editorial-corrections/fixtures", RUN);
const load = async (p) => JSON.parse(await readFile(p, "utf8"));
const shadow = await load(path.join(FIX, "insights.v2.shadow.json"));
const report = await load(path.join(FIX, "generationReport.json"));
const manifest = await load(path.join(root, "editorial-corrections", `${RUN}.json`));
const evidence = new Map(report.sections.map((s) => [s.sectionId, s.evidence]));
const gate = (id, entry) => [
  ...checkEvidenceConsistency(entry, evidence.get(id)).map((e) => e.rule),
  ...checkContractV11(entry, evidence.get(id)).map((e) => e.rule),
];

// ── 1. Manifesto real do #35 ────────────────────────────────────────────────
const { corrected, errors } = applyManifest(shadow, manifest, { manifestPath: `editorial-corrections/${RUN}.json` });
assert(!errors.length, `manifesto do #35 deveria aplicar: ${errors.join("; ")}`);
const carbon = corrected?.data.sections.carbon;
assert(carbon?.claims.find((c) => c.id === "claim-3").textPt.includes("emissões embutidas"), "claim-3 corrigido deve explicitar emissões embutidas");
assert(JSON.stringify(carbon?.decisionLens.implications.map((i) => i.claimRefs)) === JSON.stringify([["claim-0", "claim-3"], ["claim-3"]]), "claimRefs da lente corrigidos");
assert(!/evolu/i.test(carbon?.decisionLens.implications[1].textPt ?? "x") && !/evolution/i.test(carbon?.decisionLens.implications[1].textEn ?? "x"), "segunda implicação sem 'evolução'");
const ec = carbon?.editorialCorrection;
assert(ec?.changes.length === 6 && ec.reviewer && ec.artifactSha256 === canonicalHash(shadow) && ec.manifest === `editorial-corrections/${RUN}.json`, "editorialCorrection com revisor, hash e manifesto");
assert(ec?.changes.every((c) => "from" in c && "to" in c && c.reason && c.kind), "cada mudança registra de/para, motivo e classificação");
assert(!checkEditorialCorrection(carbon).length && structuralCorrectionCount(carbon) === 6, "classificação coerente com o contrato (6 estruturais)");
assert(!corrected.data.sections.blockchain.editorialCorrection && !corrected.data.sections.climate.editorialCorrection, "seções sem mudança não recebem registro");
assert(JSON.stringify(shadow.data.sections.carbon.decisionLens.implications[0].claimRefs) === JSON.stringify(["claim-0", "claim-1"]), "o artefato original não é alterado em memória");
for (const [id, entry] of Object.entries(corrected?.data.sections ?? {})) {
  const g = gate(id, entry);
  assert(!g.length, `${id} corrigido deveria passar no gate: ${g.join(", ")}`);
}
// A correção sustenta a regra: com claim-3 explícito, voltar a lente só para preço bloqueia.
{
  const e = structuredClone(carbon); e.decisionLens.implications[0].claimRefs = ["claim-0", "claim-1"];
  assert(gate("carbon", e).includes("lens_claim_coverage"), "lente sobre emissões citando só preço deve bloquear após a correção do claim-3");
}

// ── 2. Promoção real com o artefato corrigido ───────────────────────────────
async function workspace() {
  const dir = await mkdtemp(path.join(tmpdir(), "odin-corrections-"));
  await cp(path.join(root, "scripts"), path.join(dir, "scripts"), { recursive: true });
  await cp(path.join(root, "contracts"), path.join(dir, "contracts"), { recursive: true });
  await cp(path.join(root, "editorial-corrections"), path.join(dir, "editorial-corrections"), { recursive: true });
  await mkdir(path.join(dir, "public/data/evidence", RUN), { recursive: true });
  await cp(path.join(FIX, "evidence"), path.join(dir, "public/data/evidence", RUN), { recursive: true });
  await cp(path.join(FIX, "insights.v2.shadow.json"), path.join(dir, "shadow.json"));
  await cp(path.join(FIX, "generationReport.json"), path.join(dir, "report.json"));
  return dir;
}
const node = (dir, args, env = {}) => {
  const r = spawnSync(process.execPath, ["--import", "./scripts/pipeline-mock.mjs", ...args], {
    cwd: dir, encoding: "utf8",
    env: { ...process.env, ODIN_FAKE_NOW: "2026-10-10T15:00:00Z", GITHUB_ACTIONS: "", GITHUB_STEP_SUMMARY: "", ...env },
  });
  return { code: r.status, out: `${r.stdout}\n${r.stderr}` };
};
const promoteEnv = { ODIN_PROMOTE_APPROVED: "true", ODIN_REVIEWER: "pipeline-test", ODIN_SHADOW_RUN_ID: "38055183857" };
{
  const dir = await workspace();
  const a = node(dir, ["scripts/apply-editorial-corrections.mjs", "shadow.json", `editorial-corrections/${RUN}.json`, "corrected.json"]);
  assert(a.code === 0, `CLI de correção falhou:\n${a.out}`);
  const p = node(dir, ["scripts/promote-insights.mjs", "corrected.json", "out.json", "report.json"], promoteEnv);
  assert(p.code === 0 && /PROMOTED/.test(p.out), `promoção do #35 corrigido deveria passar:\n${p.out.slice(-2000)}`);
  const out = p.code === 0 ? JSON.parse(await readFile(path.join(dir, "out.json"), "utf8")) : { data: { sections: { carbon: {} } } };
  assert(out.runId === RUN && out.data.sections.carbon.editorialCorrection?.changes.length === 6, "artefato promovido carrega editorialCorrection");
  assert(out.data.sections.carbon.reviewStatus === "approved" && out.data.sections.carbon.reviewSource?.generationRunId === RUN, "promovido mantém o vínculo com o run gerado");
}
// Correção humana que introduz tendência em snapshot: aplica (é redação), mas a promoção bloqueia.
{
  const dir = await workspace();
  const bad = {
    runId: RUN, artifactSha256: canonicalHash(shadow), reviewer: "teste", reviewedAt: "2026-10-10",
    changes: [{ section: "blockchain", path: "stakeholderImplications[0].textPt", kind: "wording", reason: "teste de paridade",
      expected: shadow.data.sections.blockchain.stakeholderImplications[0].textPt,
      value: "Autoridades podem acompanhar a evolução do TVL de RWA para mapear exposição a ativos digitais." }],
  };
  await writeFile(path.join(dir, "bad.json"), JSON.stringify(bad));
  const a = node(dir, ["scripts/apply-editorial-corrections.mjs", "shadow.json", "bad.json", "corrected.json"]);
  assert(a.code === 0, `correção de redação deveria aplicar:\n${a.out}`);
  const p = node(dir, ["scripts/promote-insights.mjs", "corrected.json", "out.json", "report.json"], promoteEnv);
  assert(p.code !== 0 && /snapshot_trend/.test(p.out), `promoção deveria bloquear snapshot_trend introduzido na correção:\n${p.out.slice(-1500)}`);
}

// ── 3. Recusas do manifesto ─────────────────────────────────────────────────
const refuse = (m, s = shadow) => applyManifest(s, m).errors;
const variant = (fn) => { const m = structuredClone(manifest); fn(m); return m; };
const cases = [
  ["runId de outro artefato", variant((m) => { m.runId = "odin-20261010-124627-054b"; }), /declarado para/],
  ["hash de outro artefato", variant((m) => { m.artifactSha256 = "sha256:" + "0".repeat(64); }), /artifactSha256/],
  ["valor esperado divergente", variant((m) => { m.changes[3].expected = "outro texto"; }), /difere do esperado/],
  ["campo protegido (provenance)", variant((m) => { m.changes.push({ section: "carbon", path: "provenance[0].hash", kind: "structural", reason: "x", expected: shadow.data.sections.carbon.provenance[0].hash, value: "sha256:x" }); }), /campo protegido/],
  ["campo protegido (nextReviewAt)", variant((m) => { m.changes.push({ section: "carbon", path: "nextReviewAt", kind: "structural", reason: "x", expected: shadow.data.sections.carbon.nextReviewAt, value: "2027-12-31T00:00:00Z" }); }), /campo protegido/],
  ["claimRefs classificado como redação", variant((m) => { m.changes[2].kind = "wording"; }), /classifique como structural/],
  ["caminho repetido", variant((m) => { m.changes.push(structuredClone(m.changes[0])); }), /caminho repetido/],
  ["caminho inexistente", variant((m) => { m.changes[0].path = "claims[id=claim-9].textPt"; }), /não encontrado/],
  ["seção inexistente", variant((m) => { m.changes[0].section = "energia"; }), /seção inexistente/],
  ["sem motivo", variant((m) => { m.changes[0].reason = " "; }), /reason obrigatório/],
  ["sem revisor", variant((m) => { m.reviewer = ""; }), /reviewer/],
  ["sem mudanças", variant((m) => { m.changes = []; }), /sem changes/],
];
for (const [name, m, re] of cases) {
  const errs = refuse(m);
  assert(errs.some((e) => re.test(e)), `${name}: deveria recusar (${re}); obtido: ${errs.join("; ") || "aceito"}`);
}
// Artefato alterado depois de declarado o manifesto: hash não confere.
{ const s = structuredClone(shadow); s.data.sections.climate.thesis.pt += " "; assert(refuse(manifest, s).some((e) => /artifactSha256/.test(e)), "artefato alterado deve ser recusado pelo hash"); }
// Reaplicar sobre o já corrigido: recusado.
assert(refuse({ ...manifest, artifactSha256: canonicalHash(corrected) }, corrected).length > 0, "não reaplicar manifesto em artefato já corrigido");
assert(normalizedField("decisionLens.implications[1].claimRefs") === "decisionLens.implications.claimRefs" && normalizedField("claims[id=claim-3].textPt") === "claims.textPt", "normalização de campo");

// ── 4. Paridade: nova tentativa ⊆ gate ──────────────────────────────────────
const ctx = (id, entry) => ({ provenance: entry.provenance, events: entry.events ?? [], evidence: evidence.get(id) });
const mutations = [
  ["blockchain", "tendência em snapshot (stakeholder)", (e) => { e.stakeholderImplications[0].textPt = "Autoridades podem acompanhar a evolução do TVL de RWA."; }],
  ["blockchain", "tendência em snapshot (lente)", (e) => { e.decisionLens.implications[0].textEn = "Startups may track the growth of stablecoin market cap."; }],
  ["blockchain", "lente cita claim sem a métrica", (e) => { e.decisionLens.implications.find((i) => /TVL/.test(i.textPt)).claimRefs = ["claim-0"]; }],
  ["climate", "lente sem o claim de precipitação", (e) => { e.decisionLens.implications[0].claimRefs = ["claim-1"]; }],
  ["carbon", "recomendação na lente", (e) => { e.decisionLens.implications[0].textPt = "Startups devem investir em sistemas de monitoramento de emissões."; }],
  ["carbon", "número novo na lente", (e) => { e.decisionLens.implications[0].textPt = "Startups podem usar o preço de 91,10 €/tCO2e para avaliar sistemas de monitoramento de emissões."; }],
];
for (const [id, name, mutate] of mutations) {
  const e = structuredClone(corrected.data.sections[id]); mutate(e);
  const retry = validateModelOutputV11(e, id, ctx(id, e));
  const g = gate(id, e);
  assert(retry.length > 0, `${id} · ${name}: a validação da nova tentativa deveria acusar`);
  assert(g.length > 0, `${id} · ${name}: o gate deveria acusar (retry acusou: ${retry.join(" | ")})`);
}

if (failures) { console.error(`correção editorial: ${failures} falha(s)`); process.exit(1); }
console.log(`OK — correção editorial: manifesto #35 aplicado e promovido; ${cases.length + 2} recusas; ${mutations.length} casos de paridade nova tentativa ⊆ gate.`);
