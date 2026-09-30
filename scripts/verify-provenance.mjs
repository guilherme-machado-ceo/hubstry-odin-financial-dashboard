// ODIN — verificação de proveniência reproduzível.
// Recalcula o SHA-256 dos bytes em provenance[].dataPath e compara com o hash
// registrado. Uso:
//   node scripts/verify-provenance.mjs <insights.json> [--require]
// --require: toda provenance DEVE apontar para uma cópia de evidência
// (public/data/evidence/<runId>/…) — usado no gate shadow e no promote.
// Sem --require: verifica só as que apontam para evidência (compatível com o
// insights.v2.json legado, anterior a este contrato).
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

export const EVIDENCE_PREFIX = "public/data/evidence/";

export async function verifyProvenance(doc, { root = process.cwd(), require = false } = {}) {
  const errors = [];
  let verified = 0;
  for (const [id, entry] of Object.entries(doc?.data?.sections ?? {})) {
    for (const [i, p] of (entry.provenance ?? []).entries()) {
      const at = `sections.${id}.provenance[${i}]`;
      const isEvidence = typeof p.dataPath === "string" && p.dataPath.startsWith(EVIDENCE_PREFIX);
      if (!isEvidence) {
        if (require) errors.push(`${at}: dataPath não aponta para cópia de evidência (${p.dataPath})`);
        continue;
      }
      if (entry.runId && !p.dataPath.startsWith(`${EVIDENCE_PREFIX}${entry.runId}/`)) errors.push(`${at}: evidência fora do diretório do run ${entry.runId}`);
      let bytes;
      try { bytes = await readFile(path.join(root, p.dataPath)); } catch { errors.push(`${at}: arquivo de evidência ausente: ${p.dataPath}`); continue; }
      const hash = "sha256:" + createHash("sha256").update(bytes).digest("hex");
      if (hash !== p.hash) errors.push(`${at}: hash diverge (${p.dataPath})`);
      else verified += 1;
    }
  }
  return { errors, verified };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const file = process.argv[2] || "public/data/insights.v2.json";
  const require = process.argv.includes("--require");
  const doc = JSON.parse(await readFile(path.resolve(file), "utf8"));
  const { errors, verified } = await verifyProvenance(doc, { require });
  for (const e of errors) console.error("ERRO:", e);
  console.log(`Provenance: ${errors.length ? "FAIL" : "PASS"} | ${verified} evidência(s) verificada(s) em ${file}${require ? " (--require)" : ""}`);
  if (errors.length) process.exit(1);
}
