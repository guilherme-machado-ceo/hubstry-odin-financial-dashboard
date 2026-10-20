// ODIN — verificações determinísticas da baseline de segurança do AIFS.
// Lê os arquivos YAML como texto; não precisa de rede, LLM nem segredos.
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

// ── S2: aifs-forecast.yml ────────────────────────────────────────────────────

const aifs = await readFile(
  path.join(root, ".github/workflows/aifs-forecast.yml"), "utf8"
);

// Isola a seção do job aifs (até o próximo job de mesmo nível de indentação)
const aifsJobSection = aifs.match(/^  aifs:[\s\S]*?(?=^  \w|\Z)/m)?.[0] ?? aifs;

// S2-1. Job aifs não deve ter contents: write
assert(
  !/contents:\s*write/.test(aifsJobSection),
  "S2-1: job aifs não deve ter contents: write"
);

// S2-2. Job aifs deve ter contents: read explícito
assert(
  /permissions:[\s\S]*?contents:\s*read/.test(aifsJobSection),
  "S2-2: job aifs deve declarar permissions: contents: read"
);

// S2-3. Job commit_snapshot deve existir
assert(
  aifs.includes("commit_snapshot:"),
  "S2-3: job commit_snapshot deve existir"
);

const commitSection = aifs.match(/  commit_snapshot:[\s\S]*/)?.[0] ?? "";

// S2-4. commit_snapshot deve ter contents: write
assert(
  /permissions:[\s\S]*?contents:\s*write/.test(commitSection),
  "S2-4: commit_snapshot deve ter permissions: contents: write"
);

// S2-5. commit_snapshot deve ter condição if: excluindo PR E restringindo ao main
assert(
  commitSection.includes("github.event_name != 'pull_request'") &&
  commitSection.includes("refs/heads/main"),
  "S2-5: commit_snapshot deve ter condição if: excluindo pull_request E restringindo a refs/heads/main"
);

// S2-6. commit_snapshot deve exigir que aifs tenha terminado
assert(
  commitSection.includes("needs: aifs"),
  "S2-6: commit_snapshot deve declarar needs: aifs"
);

// S2-7. commit_snapshot deve revalidar o artefato com validate_forecast.py
assert(
  commitSection.includes("validate_forecast.py"),
  "S2-7: commit_snapshot deve revalidar o arquivo com validate_forecast.py antes do commit"
);

// S2-8. commit_snapshot NÃO deve instalar dependências Python (validate_forecast.py usa stdlib)
assert(
  !commitSection.includes("pip install"),
  "S2-8: commit_snapshot não deve executar pip install (validate_forecast.py e aifs_core.py usam stdlib)"
);

// S2-9. Os dois crons diários devem estar presentes
assert(
  aifs.includes('"23 8 * * *"') && aifs.includes('"23 20 * * *"'),
  "S2-9: ambos os ciclos diários (08:23 e 20:23 UTC) devem estar presentes"
);

// S2-10. pull_request trigger deve permanecer (para testes em PR)
assert(
  aifs.includes("pull_request:"),
  "S2-10: trigger pull_request deve permanecer"
);

// S2-11. workflow_dispatch deve permanecer
assert(
  aifs.includes("workflow_dispatch"),
  "S2-11: trigger workflow_dispatch deve permanecer"
);

if (failures) { console.error(`security-baseline: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN security-baseline: PASS — AIFS (11 verificações)");
