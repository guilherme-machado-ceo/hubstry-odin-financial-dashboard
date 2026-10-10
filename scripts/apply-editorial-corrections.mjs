// ============================================================
// ODIN — correção editorial humana sobre um artefato shadow
// ------------------------------------------------------------
// Aplica um manifesto versionado (editorial-corrections/<runId>.json) ao
// artefato shadow ORIGINAL de um run e grava a versão corrigida, que depois
// passa pelo gate completo de promoção (promote-insights.mjs).
//
// Garantias:
//   - o manifesto só se aplica ao artefato para o qual foi declarado:
//     runId igual e hash canônico do artefato igual (artifactSha256);
//   - cada mudança declara o valor ORIGINAL esperado; se o valor atual não
//     for exatamente esse, nada é aplicado;
//   - campos de proveniência, frescor e identidade não podem ser corrigidos;
//   - campo contratual (claims, claimRefs, …) não pode ser classificado como
//     "wording" — usa a mesma lista STRUCTURAL_FIELDS do contrato v1.1;
//   - cada seção corrigida recebe editorialCorrection com todas as mudanças
//     (de/para, motivo, classificação), revisor, manifesto e hash.
// O original permanece intacto em shadow-samples/samples/<runId>/.
//
// Uso: node scripts/apply-editorial-corrections.mjs <shadow.json> <manifesto.json> <saida.json>
// ============================================================
import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { STRUCTURAL_FIELDS } from "./contract-v11.mjs";

/** Hash do conteúdo JSON (independe de espaços/indentação do arquivo). */
export const canonicalHash = (doc) => "sha256:" + createHash("sha256").update(JSON.stringify(doc)).digest("hex");

// Campos que a correção humana nunca altera: ligam o artefato às evidências,
// ao run e ao prazo de revisão.
export const PROTECTED_FIELDS = ["provenance", "events", "validAsOf", "nextReviewAt", "status", "sectionId", "runId", "generatedAt", "intelligenceContractVersion", "editorialCorrection"];

/** "claims[id=claim-3].textPt" -> [{key:"claims"},{sel:{id:"claim-3"}},{key:"textPt"}] */
export function parsePath(p) {
  const tokens = [];
  const re = /([^.[\]]+)|\[(\d+)\]|\[id=([^\]]+)\]/g;
  let m, consumed = "";
  while ((m = re.exec(p))) {
    consumed += m[0];
    if (m[1] !== undefined) tokens.push({ key: m[1] });
    else if (m[2] !== undefined) tokens.push({ index: Number(m[2]) });
    else tokens.push({ id: m[3] });
  }
  if (!tokens.length || consumed.replace(/\./g, "") !== p.replace(/\./g, "")) throw new Error(`caminho inválido: ${p}`);
  return tokens;
}

/** Campo normalizado (sem seletores) para classificar: "decisionLens.implications.claimRefs". */
export const normalizedField = (p) => parsePath(p).filter((t) => t.key !== undefined).map((t) => t.key).join(".");

const isStructural = (field) => STRUCTURAL_FIELDS.some((f) => field === f || field.startsWith(`${f}.`) || field.startsWith(`${f}[`));

function resolveParent(root, tokens) {
  let node = root;
  for (const t of tokens.slice(0, -1)) {
    if (t.key !== undefined) node = node?.[t.key];
    else if (t.index !== undefined) node = Array.isArray(node) ? node[t.index] : undefined;
    else node = Array.isArray(node) ? node.find((x) => x?.id === t.id) : undefined;
    if (node === undefined || node === null) return null;
  }
  const last = tokens.at(-1);
  if (last.key === undefined) return null; // o alvo final é sempre uma propriedade
  return { parent: node, key: last.key };
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/** -> { corrected, errors }. Nada é aplicado se houver qualquer erro. */
export function applyManifest(shadow, manifest, { manifestPath = null } = {}) {
  const errors = [];
  if (!manifest || typeof manifest !== "object") return { corrected: null, errors: ["manifesto não é objeto JSON"] };
  if (manifest.runId !== shadow?.runId) errors.push(`manifesto declarado para ${manifest.runId}, artefato é ${shadow?.runId}`);
  const hash = canonicalHash(shadow);
  if (manifest.artifactSha256 !== hash) errors.push(`artifactSha256 do manifesto (${manifest.artifactSha256}) não corresponde ao artefato (${hash})`);
  if (!String(manifest.reviewer ?? "").trim()) errors.push("manifesto sem reviewer");
  if (!/^\d{4}-\d{2}-\d{2}/.test(String(manifest.reviewedAt ?? ""))) errors.push("manifesto sem reviewedAt (YYYY-MM-DD)");
  const changes = manifest.changes;
  if (!Array.isArray(changes) || !changes.length) errors.push("manifesto sem changes");
  if (errors.length) return { corrected: null, errors };

  const corrected = structuredClone(shadow);
  const sections = corrected.data?.sections ?? {};
  const seen = new Set();
  const bySection = new Map();
  for (const [i, c] of changes.entries()) {
    const at = `changes[${i}]`;
    const entry = sections[c?.section];
    if (!entry) { errors.push(`${at}: seção inexistente: ${c?.section}`); continue; }
    if (entry.editorialCorrection) { errors.push(`${at}: seção ${c.section} já tem editorialCorrection (não reaplicar)`); continue; }
    let tokens, field;
    try { tokens = parsePath(String(c.path ?? "")); field = normalizedField(c.path); } catch (e) { errors.push(`${at}: ${e.message}`); continue; }
    if (PROTECTED_FIELDS.some((f) => field === f || field.startsWith(`${f}.`))) { errors.push(`${at}: ${field} é campo protegido (proveniência/frescor/identidade)`); continue; }
    if (!["wording", "structural"].includes(c.kind)) { errors.push(`${at}: kind deve ser wording ou structural`); continue; }
    if (isStructural(field) && c.kind === "wording") { errors.push(`${at}: ${field} é campo contratual; classifique como structural`); continue; }
    if (!String(c.reason ?? "").trim()) { errors.push(`${at}: reason obrigatório`); continue; }
    if (!("expected" in c) || !("value" in c)) { errors.push(`${at}: expected e value são obrigatórios`); continue; }
    const key = `${c.section}:${c.path}`;
    if (seen.has(key)) { errors.push(`${at}: caminho repetido ${key}`); continue; }
    seen.add(key);
    const target = resolveParent(entry, tokens);
    if (!target || !(target.key in Object(target.parent))) { errors.push(`${at}: caminho não encontrado em ${c.section}: ${c.path}`); continue; }
    const current = target.parent[target.key];
    if (!same(current, c.expected)) { errors.push(`${at}: valor atual de ${c.section}.${c.path} difere do esperado — manifesto não corresponde a este artefato`); continue; }
    if (same(current, c.value)) { errors.push(`${at}: value igual ao original (mudança vazia)`); continue; }
    target.parent[target.key] = structuredClone(c.value);
    if (!bySection.has(c.section)) bySection.set(c.section, []);
    bySection.get(c.section).push({ field, path: c.path, kind: c.kind, reason: c.reason, from: c.expected, to: c.value });
  }
  if (errors.length) return { corrected: null, errors };

  for (const [id, list] of bySection) {
    sections[id].editorialCorrection = {
      correctedAt: manifest.reviewedAt,
      reviewer: manifest.reviewer,
      manifest: manifestPath,
      artifactSha256: hash,
      changes: list,
    };
  }
  return { corrected, errors: [] };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [shadowFile, manifestFile, outFile] = process.argv.slice(2);
  if (!shadowFile || !manifestFile || !outFile) {
    console.error("uso: apply-editorial-corrections.mjs <shadow.json> <manifesto.json> <saida.json>");
    process.exit(2);
  }
  const shadow = JSON.parse(await readFile(shadowFile, "utf8"));
  const manifest = JSON.parse(await readFile(manifestFile, "utf8"));
  const rel = path.relative(process.cwd(), path.resolve(manifestFile));
  const { corrected, errors } = applyManifest(shadow, manifest, { manifestPath: rel });
  if (errors.length) {
    console.error("CORREÇÃO EDITORIAL RECUSADA — nada foi aplicado:");
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  await writeFile(outFile, JSON.stringify(corrected, null, 2) + "\n");
  const n = Object.values(corrected.data.sections).reduce((a, s) => a + (s.editorialCorrection?.changes.length ?? 0), 0);
  console.log(`CORREÇÃO EDITORIAL aplicada a ${corrected.runId}: ${n} mudança(s) · manifesto ${rel} · artefato ${canonicalHash(shadow)}`);
}
