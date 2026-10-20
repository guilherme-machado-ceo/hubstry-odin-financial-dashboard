// ODIN — verificações determinísticas da baseline de segurança (S1 + S2).
// Lê os arquivos YAML como texto; não precisa de rede, LLM nem segredos.
import { readFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";

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

// ── S1 (provedor): promoção por provedor ─────────────────────────────────────
// Analisa os comandos efetivos (linhas de comentário YAML/shell são ignoradas) e
// executa de fato o bloco de validação/mapeamento e a verificação de provider.

const stripComments = (src) => src.split(/\r?\n/).filter((l) => !/^\s*#/.test(l)).join("\n");
const promoteCode = stripComments(promote);
const downloadCode = stripComments(downloadStep);
const ALLOWED_ARTIFACTS = new Map([["nvidia", "odin-insights-v2-shadow"], ["maas", "odin-insights-v2-shadow-maas"]]);

// S1-9. Input provider: choice com nvidia e maas, padrão nvidia
assert(
  /provider:\s*\n(?:\s+\w+:.*\n)*?\s+type:\s*choice\s*\n\s+options:\s*\n\s+-\s*nvidia\s*\n\s+-\s*maas\s*\n\s+default:\s*nvidia/.test(promote.replace(/\r\n/g, "\n")),
  "S1-9: input provider deve ser type: choice com options nvidia e maas e default nvidia"
);

// S1-10. provider só entra por env (KEY: ${{ inputs.provider }}), nunca em comando shell
{
  const occurrences = [...promote.matchAll(/\$\{\{\s*inputs\.provider\s*\}\}/g)];
  assert(occurrences.length >= 2, "S1-10: inputs.provider deve ser atribuído a PROVIDER nos passos de download e de verificação");
  for (const m of occurrences) {
    const line = lineOf(promote, m.index);
    assert(/^\s+PROVIDER:\s*\$\{\{\s*inputs\.provider\s*\}\}\s*$/.test(line),
      "S1-10: inputs.provider fora de atribuição PROVIDER: na linha: " + JSON.stringify(line.trim()));
  }
}

// S1-11. Validação + mapeamento do provedor ocorrem antes do gh run download, e só existem os dois destinos
const caseBlock = downloadCode.match(/case "\$PROVIDER" in[\s\S]*?\n\s*esac/)?.[0] ?? "";
assert(caseBlock.length > 0, "S1-11: bloco case \"$PROVIDER\" não encontrado no passo de download");
assert(
  caseBlock.length > 0 && downloadCode.indexOf(caseBlock) < downloadCode.indexOf("gh run download"),
  "S1-11: o bloco de validação do provedor deve vir antes do gh run download"
);
{
  const arms = [...caseBlock.matchAll(/^\s*([\w*]+)\)\s*(.*)$/gm)].map((m) => [m[1], m[2]]);
  assert(JSON.stringify(arms.map(([k]) => k)) === JSON.stringify(["nvidia", "maas", "*"]),
    "S1-11: o case deve ter exatamente os ramos nvidia, maas e * (rejeição): " + JSON.stringify(arms.map(([k]) => k)));
  for (const [k, v] of ALLOWED_ARTIFACTS) {
    assert(arms.find(([a]) => a === k)?.[1].includes(`ARTIFACT="${v}"`), `S1-11: ${k} deve mapear para ${v}`);
  }
  assert(/\*\)[\s\S]*exit 1/.test(caseBlock), "S1-11: o ramo * deve sair com exit 1");
}

// S1-12. Comandos efetivos de gh run download: só --name "$ARTIFACT"; ARTIFACT só recebe os dois nomes; nunca -blocked
{
  const flat = promoteCode.replace(/\\\r?\n\s*/g, " ");
  const downloads = flat.split("\n").filter((l) => /gh\s+run\s+download|download-artifact/.test(l));
  assert(downloads.length > 0, "S1-12: nenhum comando gh run download encontrado");
  for (const cmd of downloads) {
    assert(/gh run download/.test(cmd) && !/download-artifact/.test(cmd), "S1-12: download deve usar gh run download com --name: " + cmd.trim());
    assert(/--name "\$ARTIFACT"/.test(cmd) && (cmd.match(/--name/g) ?? []).length === 1, "S1-12: gh run download deve usar --name \"$ARTIFACT\" uma única vez: " + cmd.trim());
    assert(!/--pattern|\s-p\s|blocked/.test(cmd), "S1-12: gh run download não pode usar --pattern nem apontar para artefato bloqueado: " + cmd.trim());
  }
  const assigned = [...promoteCode.matchAll(/\bARTIFACT=("[^"]*"|\S+)/g)].map((m) => m[1].replace(/"/g, ""));
  assert(assigned.length === ALLOWED_ARTIFACTS.size && assigned.every((v) => [...ALLOWED_ARTIFACTS.values()].includes(v)),
    "S1-12: ARTIFACT só pode receber os nomes dos artefatos promovíveis: " + JSON.stringify(assigned));
  assert(!assigned.some((v) => /blocked/.test(v)), "S1-12: nenhum caminho pode apontar para artefato -blocked");
}

// S1-13. O bloco de mapeamento, executado de verdade, aceita nvidia/maas e rejeita o resto
{
  const run = (value) => spawnSync("bash", ["-c", `PROVIDER="$1"\n${caseBlock}\necho "$ARTIFACT"`, "_", value], { encoding: "utf8" });
  const probe = run("nvidia");
  if (probe.error || probe.status === null) {
    // Nunca pular sem aviso: sem bash a verificação falha de forma explícita.
    assert(false, "S1-13 requer bash no PATH; no Windows, use o Git Bash ou rode na CI" + (probe.error ? ` (${probe.error.message})` : ""));
  } else {
    for (const [k, v] of ALLOWED_ARTIFACTS) {
      const r = run(k);
      assert(r.status === 0 && r.stdout.trim() === v, `S1-13: provider ${k} deve resultar em ${v} (obteve status ${r.status}, "${r.stdout.trim()}")`);
    }
    for (const bad of ["", "NVIDIA", "nvidia-blocked", "maas-blocked", "odin-insights-v2-shadow-blocked", "nvidia; echo x", "../maas", "*"]) {
      const r = run(bad);
      assert(r.status !== 0 && r.stdout.trim() === "", `S1-13: provider inválido ${JSON.stringify(bad)} deve ser rejeitado antes do download`);
    }
  }
}

// S1-14. Verificação de provider (input = shadow = relatório) antes do gate de promoção
{
  const stepRe = (name) => new RegExp(`- name: ${name}[\\s\\S]*?(?=\\n      - name:|$)`);
  const verifyStep = promote.match(stepRe("Verify artifact provider matches input"))?.[0] ?? "";
  assert(verifyStep.length > 0, "S1-14: passo 'Verify artifact provider matches input' não encontrado");
  const iDownload = promote.indexOf("- name: Download selected shadow artifact");
  const iVerify = promote.indexOf("- name: Verify artifact provider matches input");
  const iPromote = promote.indexOf("- name: Promote through ODIN gate");
  assert(iDownload >= 0 && iDownload < iVerify && iVerify < iPromote,
    "S1-14: a verificação de provider deve vir depois do download e antes do passo que executa promote-insights.mjs");
  assert(!promote.slice(0, iPromote).includes("promote-insights.mjs"), "S1-14: promote-insights.mjs não pode rodar antes da verificação de provider");
  assert(/PROVIDER:\s*\$\{\{\s*inputs\.provider\s*\}\}/.test(verifyStep), "S1-14: a verificação deve receber PROVIDER por env");
  const script = verifyStep.match(/node -e '\r?\n([\s\S]*?)\r?\n\s*' "\$PROVIDER" "\$shadow_file" "\$report_file"/)?.[1] ?? "";
  assert(script.includes("insights.v2.shadow") || /shadowPath/.test(script), "S1-14: não foi possível extrair o script de verificação");
  const dir = mkdtempSync(path.join(tmpdir(), "odin-provider-"));
  try {
    const attempt = (want, shadowProvider, reportProvider) => {
      const shadowPath = path.join(dir, "insights.v2.shadow.json");
      const reportPath = path.join(dir, "generationReport.json");
      writeFileSync(shadowPath, JSON.stringify(shadowProvider === undefined ? {} : { provider: shadowProvider }));
      writeFileSync(reportPath, JSON.stringify(reportProvider === undefined ? {} : { provider: reportProvider }));
      return spawnSync(process.execPath, ["-e", script, want, shadowPath, reportPath], { encoding: "utf8" }).status;
    };
    assert(attempt("nvidia", "nvidia", "nvidia") === 0, "S1-14: provider igual nos três deve passar (nvidia)");
    assert(attempt("maas", "maas", "maas") === 0, "S1-14: provider igual nos três deve passar (maas)");
    assert(attempt("maas", "nvidia", "maas") !== 0, "S1-14: shadow divergente do input deve bloquear");
    assert(attempt("maas", "maas", "nvidia") !== 0, "S1-14: relatório divergente do input deve bloquear");
    assert(attempt("nvidia", "maas", "maas") !== 0, "S1-14: ambos divergentes do input devem bloquear");
    assert(attempt("nvidia", undefined, "nvidia") !== 0, "S1-14: shadow sem provider deve bloquear");
    assert(attempt("nvidia", "nvidia", undefined) !== 0, "S1-14: relatório sem provider deve bloquear");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

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
console.log("ODIN security-baseline: PASS — S1 (14 verificações) + S2 (11 verificações)");
