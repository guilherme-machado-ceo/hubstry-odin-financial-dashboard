// ODIN — verificações determinísticas da baseline de segurança (S1 + S2).
// Lê os arquivos YAML como texto; não precisa de rede, LLM nem segredos.
import { readFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
let failures = 0;
const assert = (c, m) => { if (!c) { failures += 1; console.error("FALHA:", m); } };

// ── Utilitário: extrai a linha que contém um match ───────────────────────────
function lineOf(src, index) {
  const start = src.lastIndexOf("\n", index) + 1;
  const end = src.indexOf("\n", index);
  return src.slice(start, end === -1 ? src.length : end);
}

// ── S1: insights-promote.yml ─────────────────────────────────────────────────

const promote = await readFile(
  path.join(root, ".github/workflows/insights-promote.yml"), "utf8"
);

// S1-1. Input shadow_run_id deve ser do tipo number (validação no nível do GitHub)
assert(
  /shadow_run_id:[\s\S]*?type:\s*number/.test(promote),
  "S1-1: shadow_run_id deve ter type: number"
);

// S1-2. ${{ inputs.shadow_run_id }} deve aparecer APENAS em linhas de atribuição
//       de variável de ambiente (SHADOW_RUN_ID: ...), nunca em comandos shell.
//       Percorre todas as ocorrências no arquivo sem depender de \Z (inválido em JS).
{
  const pattern = /\$\{\{\s*inputs\.shadow_run_id\s*\}\}/g;
  const occurrences = [...promote.matchAll(pattern)];
  assert(occurrences.length > 0,
    "S1-2: inputs.shadow_run_id deve aparecer no arquivo (ao menos no bloco env:)");
  for (const m of occurrences) {
    const line = lineOf(promote, m.index);
    // Aceita qualquer atribuição de variável de ambiente: KEY: ${{ ... }}
    // Rejeita linhas que são comandos shell (não contêm ":" antes do "${{")
    assert(
      /^\s+\w[\w_]*\s*:\s*\$\{\{/.test(line),
      "S1-2: inputs.shadow_run_id fora de bloco env: na linha: " + JSON.stringify(line.trim())
    );
  }
}

// S1-3. ${{ github.repository }} deve aparecer APENAS em atribuição GH_REPO:
{
  const pattern = /\$\{\{\s*github\.repository\s*\}\}/g;
  const occurrences = [...promote.matchAll(pattern)];
  assert(occurrences.length > 0,
    "S1-3: github.repository deve aparecer no arquivo (ao menos no bloco env:)");
  for (const m of occurrences) {
    const line = lineOf(promote, m.index);
    assert(
      /^\s+\w[\w_]*\s*:\s*\$\{\{/.test(line),
      "S1-3: github.repository fora de bloco env: na linha: " + JSON.stringify(line.trim())
    );
  }
}

// S1-4. O valor deve ser passado por variável de ambiente SHADOW_RUN_ID
assert(
  promote.includes("SHADOW_RUN_ID: ${{ inputs.shadow_run_id }}"),
  "S1-4: shadow_run_id deve ser atribuído à variável SHADOW_RUN_ID no bloco env:"
);

// S1-5. Validação numérica deve existir antes do gh run download
const downloadStep = promote.match(/Download selected shadow artifact[\s\S]*?(?=\n      - name:)/)?.[0] ?? "";
assert(downloadStep.length > 0, "S1-5: step 'Download selected shadow artifact' não encontrado");
assert(
  /\[\[.*SHADOW_RUN_ID.*=~.*\^?\[0-9\]/.test(downloadStep),
  "S1-5: step de download deve validar SHADOW_RUN_ID com =~ ^[0-9]+$"
);

// S1-6. O comando gh run download usa "$SHADOW_RUN_ID" (variável, não interpolação)
assert(
  downloadStep.includes('"$SHADOW_RUN_ID"'),
  'S1-6: gh run download deve usar "$SHADOW_RUN_ID"'
);

// S1-7. A aprovação humana (approve) e o gate permanecem intactos
assert(
  promote.includes("inputs.approve == true"),
  "S1-7: gate de aprovação humana (inputs.approve == true) deve permanecer"
);
assert(
  promote.includes("type: boolean"),
  "S1-8: input approve deve continuar do tipo boolean"
);

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
console.log("ODIN security-baseline: PASS — S1 (8 verificações) + S2 (11 verificações)");
