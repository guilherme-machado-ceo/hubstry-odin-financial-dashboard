// ============================================================
// ODIN INSIGHTS — consumo acumulado de tokens (run logs)
// Varre logs/insights-runs-*.jsonl e soma os tokens reportados
// pela API MaaS. Convenção: tokens null (falha/timeout) NÃO entra
// na soma — é consumo indeterminado, não zero.
// Uso: npm run insights:usage
// Referência de cobrança: painel comercial do provedor MaaS.
// ============================================================
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const LOGS_DIR = path.resolve(process.cwd(), "logs");

const files = (await readdir(LOGS_DIR).catch(() => []))
  .filter((f) => /^insights-runs-.+\.jsonl$/.test(f))
  .sort();

if (files.length === 0) {
  console.log("Nenhum run log encontrado em logs/ (rode o gerador ao menos uma vez).");
  process.exit(0);
}

let runs = 0;
let total = 0;
let undetermined = 0;
const perModel = {};
const perStatus = {};

for (const file of files) {
  const lines = (await readFile(path.join(LOGS_DIR, file), "utf8")).split("\n").filter(Boolean);
  for (const line of lines) {
    let rec;
    try { rec = JSON.parse(line); } catch { continue; }
    runs++;
    if (typeof rec.tokens?.total === "number" && rec.tokens.total > 0) {
      total += rec.tokens.total;
      perModel[rec.model ?? "desconhecido"] = (perModel[rec.model ?? "desconhecido"] ?? 0) + rec.tokens.total;
    } else {
      undetermined++;
    }
    for (const s of rec.sections ?? []) {
      perStatus[s.status] = (perStatus[s.status] ?? 0) + 1;
    }
  }
}

console.log(`Arquivos de log: ${files.join(", ")}`);
console.log(`Execuções registradas: ${runs}`);
console.log(`Tokens consumidos (reportados pela API): ${total.toLocaleString("pt-BR")}`);
for (const [model, v] of Object.entries(perModel)) {
  console.log(`  · ${model}: ${v.toLocaleString("pt-BR")}`);
}
if (undetermined > 0) {
  console.log(`Execuções sem campo usage (consumo indeterminado, não contado): ${undetermined}`);
}
const statusLine = Object.entries(perStatus).map(([k, v]) => `${k}: ${v}`).join(" · ");
if (statusLine) console.log(`Seções processadas por status — ${statusLine}`);
console.log("Referência de cobrança: painel comercial do provedor MaaS (este log é o registro técnico reportado pela API).");
