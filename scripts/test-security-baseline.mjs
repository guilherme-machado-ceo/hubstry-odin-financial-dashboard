// ODIN — verificações determinísticas da baseline de segurança (S1 + S2).
// Lê os arquivos YAML como texto; não precisa de rede, LLM nem segredos.
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

// ── S1: insights-promote.yml ─────────────────────────────────────────────────

const promote = await readFile(
  path.join(root, ".github/workflows/insights-promote.yml"), "utf8"
);

// S1-1. Input shadow_run_id deve ser do tipo number (validação no nível do GitHub)
assert(
  /shadow_run_id:[\s\S]*?type:\s*number/.test(promote),
  "S1: shadow_run_id deve ter type: number"
);

// S1-2. A interpolação direta ${{ inputs.shadow_run_id }} NÃO deve aparecer
//       dentro de blocos run: (shell commands).
// Estratégia: verifica que o padrão não ocorre após "run: |" ou "run: >"
// em nenhuma parte do arquivo.
const runBlocks = promote.match(/run:\s*\|[\s\S]*?(?=\n\s{6}-|\n\s{4}-|\n\s{2}\w|\Z)/g) ?? [];
for (const block of runBlocks) {
  assert(
    !block.includes("${{ inputs.shadow_run_id }}"),
    "S1: ${{ inputs.shadow_run_id }} não deve aparecer em bloco run: (use variável de ambiente)"
  );
  assert(
    !block.includes("${{ github.repository }}"),
    "S1: ${{ github.repository }} não deve ser interpolado em bloco run: do step de download"
  );
}

// S1-3. O valor deve ser passado por variável de ambiente SHADOW_RUN_ID
assert(
  promote.includes("SHADOW_RUN_ID: ${{ inputs.shadow_run_id }}"),
  "S1: shadow_run_id deve ser atribuído à variável de ambiente SHADOW_RUN_ID no bloco env:"
);

// S1-4. Validação numérica deve existir antes do gh run download
const downloadStep = promote.match(/Download selected shadow artifact[\s\S]*?(?=\n      - name:)/)?.[0] ?? "";
assert(
  /\[\[.*SHADOW_RUN_ID.*=~.*\^?\[0-9\]/.test(downloadStep),
  "S1: o step de download deve validar SHADOW_RUN_ID como numérico com =~ ^[0-9]+$"
);

// S1-5. O comando gh run download usa "$SHADOW_RUN_ID" (não ${{ ... }})
assert(
  downloadStep.includes('"$SHADOW_RUN_ID"'),
  'S1: gh run download deve usar "$SHADOW_RUN_ID" (variável de ambiente, não interpolação de contexto)'
);

// S1-6. A aprovação humana (approve) e o gate permanecem intactos
assert(
  promote.includes("inputs.approve == true"),
  "S1: gate de aprovação humana (inputs.approve == true) deve permanecer"
);
assert(
  promote.includes("type: boolean"),
  "S1: input approve deve continuar do tipo boolean"
);

// ── S2: aifs-forecast.yml ────────────────────────────────────────────────────

const aifs = await readFile(
  path.join(root, ".github/workflows/aifs-forecast.yml"), "utf8"
);

// S2-1. Job aifs não deve ter contents: write
const aifsJobSection = aifs.match(/^  aifs:[\s\S]*?^  \w/m)?.[0] ?? aifs;
assert(
  !/contents:\s*write/.test(aifsJobSection),
  "S2: job aifs não deve ter contents: write"
);

// S2-2. Job aifs deve ter contents: read explícito
assert(
  /aifs:[\s\S]*?permissions:[\s\S]*?contents:\s*read/.test(aifs),
  "S2: job aifs deve declarar permissions: contents: read"
);

// S2-3. Job commit_snapshot deve existir
assert(
  aifs.includes("commit_snapshot:"),
  "S2: job commit_snapshot deve existir"
);

// S2-4. commit_snapshot deve ter contents: write
const commitSection = aifs.match(/commit_snapshot:[\s\S]*/)?.[0] ?? "";
assert(
  /permissions:[\s\S]*?contents:\s*write/.test(commitSection),
  "S2: commit_snapshot deve ter permissions: contents: write"
);

// S2-5. commit_snapshot deve ter condição que impede execução em pull_request
assert(
  commitSection.includes("github.event_name != 'pull_request'"),
  "S2: commit_snapshot deve ter condição if: excluindo pull_request"
);

// S2-6. commit_snapshot deve exigir que aifs tenha terminado
assert(
  commitSection.includes("needs: aifs"),
  "S2: commit_snapshot deve declarar needs: aifs"
);

// S2-7. commit_snapshot deve revalidar o artefato antes de gravar
assert(
  commitSection.includes("validate_forecast.py"),
  "S2: commit_snapshot deve revalidar o arquivo antes do commit"
);

// S2-8. Os dois crons diários devem estar presentes
assert(
  aifs.includes('"23 8 * * *"') && aifs.includes('"23 20 * * *"'),
  "S2: ambos os ciclos diários (08:23 e 20:23 UTC) devem estar presentes"
);

// S2-9. pull_request trigger deve permanecer (para testes em PR)
assert(
  aifs.includes("pull_request:"),
  "S2: trigger pull_request deve permanecer no job de coleta"
);

// S2-10. workflow_dispatch deve permanecer
assert(
  aifs.includes("workflow_dispatch"),
  "S2: trigger workflow_dispatch deve permanecer"
);

if (failures) { console.error(`security-baseline: ${failures} falha(s)`); process.exit(1); }
console.log("ODIN security-baseline: PASS — S1 (10 verificações) e S2 (10 verificações)");
