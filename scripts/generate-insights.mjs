// ============================================================
// ODIN INSIGHTS v2.3.1 — gera análises editoriais por seção via MaaS (LiteLLM)
// Roda LOCALMENTE (Actions bloqueado): a chave fica apenas no env da
// sua máquina — nunca no código, nunca no navegador.
//
// Uso:
//   MAAS_KEY="sua_chave" node scripts/generate-insights.mjs
//   MAAS_MODEL="glm-5.1" MAAS_KEY="..." node scripts/generate-insights.mjs
//   SECTIONS="carbon,blockchain" MAAS_KEY="..." node scripts/generate-insights.mjs
//   → com SECTIONS, regenera SÓ as seções listadas; as demais ficam
//     preservadas byte a byte (útil após timeout seletivo ou para
//     proteger um texto já aprovado de nova amostragem estocástica).
//
// Saída: public/data/insights.json — por seção: { pt, en, dataAsOf,
// freshness, confidence, promptVersion, generatedAt, generationStatus,
// runId }. O runId liga cada seção à execução que a gerou (seção
// preservada mantém o runId original). O promptVersion GLOBAL indica a
// versão do GERADOR; o de cada seção, a versão que gerou aquele conteúdo.
//
// Auditoria: cada run anexa UMA linha em logs/insights-runs-AAAA-MM.jsonl
// (rotação mensal) com runId, modelo, promptVersion, latência, status,
// errorType, tokens e hashes SHA-256 de entrada/saída por seção.
// Convenção: tokens null = consumo indeterminado (falha); zero só quando
// a API confirmou zero. O log é o registro TÉCNICO de consumo reportado
// pela API, reconciliável com o painel do provedor — a referência de
// cobrança é o painel comercial (ver docs/README.md).
// Se MAAS_KEY não estiver definida, o script avisa e sai sem erro.
// ============================================================
import { readFile, writeFile, appendFile, mkdir } from "node:fs/promises";
import { createHash, randomBytes } from "node:crypto";
import path from "node:path";

const ENDPOINT = process.env.MAAS_ENDPOINT || "https://ldgllm.digiti.net.br/v1/chat/completions";
const MODEL = process.env.MAAS_MODEL || "deepseek-v4-flash";
const PROMPT_VERSION = "2.3.1";
const KEY = process.env.MAAS_KEY;
const OUT_DIR = path.resolve(process.cwd(), "public/data");
const LOGS_DIR = path.resolve(process.cwd(), "logs");
// Filtro opcional: SECTIONS="carbon,blockchain" limita a regeneração
const ONLY = process.env.SECTIONS?.split(",").map((s) => s.trim()).filter(Boolean);

// Idade máxima da fonte antes de marcar o insight como "stale" (dias)
const MAX_AGE_DAYS = { carbon: 100, blockchain: 7, climate: 45 };

function makeRunId() {
  const stamp = new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "");
  return `odin-${stamp.slice(0, 8)}-${stamp.slice(8)}-${randomBytes(2).toString("hex")}`;
}
const sha256 = (s) => "sha256:" + createHash("sha256").update(s).digest("hex");

const SYSTEM_PROMPT = `Você é o analista editorial do ODIN, dashboard de inteligência financeira BRICS+.
Regras editoriais obrigatórias:
- 2 a 3 frases curtas por idioma, tom jornalístico-econômico sóbrio.
- Público não-especialista: TODA sigla é expandida entre parênteses na primeira ocorrência — nunca inicie uma frase com sigla não expandida.
- Primeira menção ao mecanismo de fronteira, escreva EXATAMENTE: "CBAM (Carbon Border Adjustment Mechanism — Mecanismo de Ajuste de Carbono na Fronteira)" no PT e "CBAM (Carbon Border Adjustment Mechanism)" no EN; use a sigla sozinha só a partir da segunda menção.
- O mesmo rigor vale para BRICS+ (Brasil, Rússia, Índia, China, África do Sul e parceiros), RWA (Real World Assets — ativos do mundo real tokenizados) e qualquer outra sigla.
- Use APENAS os números e fatos do contexto, com fidelidade exata de escopo (ex.: "por importador" nunca vira "por produto").
- NÃO some valores individuais de uma lista nem apresente somas parciais como total do setor; totais só podem ser citados quando o contexto fornecer explicitamente um campo de total validado.
- Valor de mercado (capitalização) é um ESTOQUE de valor de mercado (preço × oferta em circulação) — nunca o chame de "capital alocado" ou "capital investido".
- Não afirme concentração (nem dispersão) de mercado ou setor sem métrica de concentração no contexto (participação percentual, HHI, distribuição completa); cite apenas a liderança individual.
- Se o contexto trouxer os campos "currentPeriod/currentPrice", LIDERE com o dado vigente; cite o anterior apenas como comparação.
- Nunca use emissões per capita de um país como argumento de conformidade ou vantagem no CBAM — o mecanismo incide sobre emissões EMBUTIDAS no produto/instalação, não sobre a média nacional.
- O limiar CBAM é ANUAL e AGREGADO por importador (50 t/ano de massa total de mercadorias cobertas); carregamentos pequenos se somam.
- Relações de transmissão (clima→commodities→câmbio; stablecoins→desdolarização) são HIPÓTESES/interpretações — nunca conclusões dos dados. Marque-as linguisticamente como tal.
- Efeitos econômicos são POSSIBILIDADES, não fatos consumados: escreva "pode elevar custos", "pode afetar a competitividade" — nunca "eleva", "pressiona", "afeta" como fato.
- Valor de mercado de stablecoins NÃO é volume de pagamentos internacionais — quando o tema surgir, essa distinção deve aparecer.
- Termine sempre com uma frase de limitação explícita: o que os dados NÃO permitem concluir.
- Responda SOMENTE com JSON válido no formato:
  {"pt":"...","en":"...","confidence":{"data":"high|medium|low","interpretation":"high|medium|low"}}
  — sem markdown, sem comentários.
- Atribua "high" à confiança dos dados apenas se TODOS os números citados vieram do contexto fornecido.
- Calibragem de confiança: se a interpretação contém inferência econômica NÃO medida diretamente nos dados (competitividade, repasse de custos, efeito em safras ou energia), "interpretation" deve ser "medium" ou "low" — nunca "high". Use "high" em "interpretation" apenas quando a leitura for descrição direta dos números.`;

async function chat(userPrompt) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 700,
    }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`MaaS HTTP ${res.status}`);
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content ?? "";
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("resposta sem JSON");
  const parsed = JSON.parse(match[0]);
  if (typeof parsed.pt !== "string" || typeof parsed.en !== "string") throw new Error("JSON sem pt/en");
  const valid = (v) => (v === "high" || v === "medium" || v === "low") ? v : "medium";
  return {
    pt: parsed.pt.trim(),
    en: parsed.en.trim(),
    confidence: {
      data: valid(parsed.confidence?.data),
      interpretation: valid(parsed.confidence?.interpretation),
    },
    usage: {
      prompt: json.usage?.prompt_tokens ?? null,
      completion: json.usage?.completion_tokens ?? null,
      total: json.usage?.total_tokens ?? null,
    },
  };
}

async function readJson(file) {
  return JSON.parse(await readFile(path.join(OUT_DIR, file), "utf8"));
}

async function readJsonSafe(file) {
  try { return await readJson(file); } catch { return null; }
}

function fmtUsd(v) {
  if (v >= 1e12) return `US$ ${(v / 1e12).toFixed(2)} trilhões`;
  if (v >= 1e9) return `US$ ${(v / 1e9).toFixed(1)} bilhões`;
  return `US$ ${(v / 1e6).toFixed(1)} milhões`;
}

function freshnessOf(dataAsOfIso, sectionId) {
  const maxAge = (MAX_AGE_DAYS[sectionId] ?? 30) * 864e5;
  return (Date.now() - new Date(dataAsOfIso).getTime()) <= maxAge ? "fresh" : "stale";
}

// ── Contextos por seção (fase 1: carbon, blockchain, climate) ──────
async function ctxCarbon() {
  const dataAsOf = "2026-07-06"; // publicação oficial Q2 2026 (Comissão Europeia)
  const context = `Dados da seção Precificação de Carbono e CBAM (regime definitivo desde 01/01/2026):
- currentPeriod: "Q2 2026"; currentPrice: 75,28 €/tCO2e (publicação oficial da Comissão Europeia em 06/07/2026).
- previousPeriod: "Q1 2026"; previousPrice: 75,36 €/tCO2e. Q3 2026 publica em 05/10/2026.
- Escopo: 6 setores; limiar de minimis de 50 t/ano ANUAL E AGREGADO por importador (massa total de mercadorias cobertas, Reg. 2025/2083); primeira declaração e entrega em 30/09/2027.
- Responsabilidade legal: no regime definitivo, quem declara as emissões embutidas é o importador autorizado na UE (o declarante CBAM), NÃO o exportador. Exportadores brasileiros são pressionados INDIRETAMENTE: importadores europeus passam a exigir deles dados verificáveis de emissões embutidas por instalação.
- dataAsOf: ${dataAsOf}.
Escreva a análise para um exportador brasileiro com o enquadramento legal correto (a obrigação é do importador na UE; o exportador responde indiretamente via cadeia). Formule efeitos econômicos como possibilidade ("pode elevar custos de comprovação", "pode afetar a competitividade"), nunca como fato. Não use emissões per capita.`;
  return { context, dataAsOf };
}

async function ctxBlockchain() {
  const crypto = await readJson("crypto-market.json");
  const stables = await readJson("stablecoins.json");
  const rwa = await readJson("rwa-protocols.json");
  const dataAsOf = stables.updatedAt;
  const prices = crypto.data.assets.map((a) => `${a.symbol} ${fmtUsd(a.priceUsd)}`).join("; ");
  const top = rwa.data.rwa.slice(0, 3).map((p) => `${p.name} ${fmtUsd(p.tvlUsd)}`).join("; ");
  const context = `Dados da seção Blockchain e Ativos Digitais:
- dataAsOf: ${dataAsOf} (snapshots DefiLlama).
- Preços: ${prices}.
- Valor de mercado total das maiores stablecoins: ${fmtUsd(stables.data.totalMcapUsd)}; líder: ${stables.data.assets[0].name} com ${fmtUsd(stables.data.assets[0].mcapUsd)}.
- AMOSTRA PARCIAL — os 3 maiores de ${rwa.data.rwa.length} protocolos RWA (Real World Assets) listados, por TVL (Total Value Locked — valor total bloqueado): ${top}. NÃO totalize: a amostra não representa o setor e TVLs de protocolos distintos podem não ser diretamente somáveis — cite o líder individualmente, nunca uma soma.
- Carbono tokenizado: Toucan Protocol ${fmtUsd(rwa.data.tokenizedCarbon[0].tvlUsd)}, KlimaDAO ${fmtUsd(rwa.data.tokenizedCarbon[1].tvlUsd)}.
Escreva a análise conectando stablecoins como trilhos digitais do dólar com a narrativa das Moedas Locais — marcada como interpretação, com a limitação explícita (valor de mercado ≠ volume de pagamentos).`;
  return { context, dataAsOf };
}

async function ctxClimate() {
  const endDate = new Date(Date.now() - 5 * 864e5).toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - 370 * 864e5).toISOString().slice(0, 10);
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=-15.8&longitude=-47.9&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`,
    { signal: AbortSignal.timeout(30000) }
  );
  const json = await res.json();
  const temps = json.daily?.temperature_2m_mean ?? [];
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  const precip = (json.daily?.precipitation_sum ?? []).reduce((a, b) => a + b, 0);
  const dataAsOf = endDate;
  const context = `Dados do vetor climático (Open-Meteo Archive API):
- Janela móvel de 12 meses: ${startDate} a ${endDate} (a Archive API tem defasagem de ~5 dias). dataAsOf: ${dataAsOf}.
- Brasília: temperatura média ${avg.toFixed(1)}°C (referência histórica fixa do dashboard: 21,4°C — aproximação, não climatologia oficial); precipitação acumulada ${Math.round(precip)} mm (referência fixa: 1550 mm).
- O dashboard compara 8 capitais com score heurístico de risco 0-100 (fórmula própria, não classificação climatológica).
Escreva a análise marcando QUALQUER transmissão para commodities, energia ou câmbio como hipótese. NÃO afirme efeito econômico a partir de uma única cidade: em vez disso, recomende monitorar se o padrão se estende às regiões produtoras e às bacias hidrográficas relevantes para geração elétrica. Declare a limitação: uma cidade não representa as regiões produtoras de um país.`;
  return { context, dataAsOf };
}

const SECTIONS = [
  ["carbon", ctxCarbon],
  ["blockchain", ctxBlockchain],
  ["climate", ctxClimate],
];

async function main() {
  if (!KEY) {
    console.log("MAAS_KEY não definida — nada a fazer. Uso:");
    console.log('  MAAS_KEY="sua_chave" node scripts/generate-insights.mjs');
    process.exit(0);
  }
  const runId = makeRunId();
  console.log(`Modelo: ${MODEL} · Prompt: v${PROMPT_VERSION} · Endpoint: ${ENDPOINT}`);
  console.log(`runId: ${runId}`);
  if (ONLY) console.log(`Filtro SECTIONS ativo: ${ONLY.join(", ")} — demais seções preservadas.`);
  const prev = await readJsonSafe("insights.json");
  const existing = prev?.data?.sections ?? {};
  const sections = { ...existing };
  // Registro de auditoria da execução (logs/insights-runs-AAAA-MM.jsonl)
  const runLog = {
    runId,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    model: MODEL,
    promptVersion: PROMPT_VERSION,
    filter: ONLY ?? null,
    sections: [],
    tokens: { prompt: 0, completion: 0, total: 0 },
  };
  for (const [id, ctxFn] of SECTIONS) {
    if (ONLY && !ONLY.includes(id)) {
      console.log(`---- ${id}: fora do filtro SECTIONS — preservada sem nova chamada.`);
      runLog.sections.push({ id, status: "skipped_filter" });
      continue;
    }
    const t0 = Date.now();
    try {
      const { context, dataAsOf } = await ctxFn();
      const result = await chat(context);
      const latencyMs = Date.now() - t0;
      sections[id] = {
        ...result,
        dataAsOf,
        freshness: freshnessOf(dataAsOf, id),
        promptVersion: PROMPT_VERSION,
        generatedAt: new Date().toISOString(),
        generationStatus: "generated",
        runId,
      };
      delete sections[id].usage; // consumo vai para o run log, não para o JSON público
      if (result.usage.total) {
        runLog.tokens.prompt += result.usage.prompt ?? 0;
        runLog.tokens.completion += result.usage.completion ?? 0;
        runLog.tokens.total += result.usage.total;
      }
      runLog.sections.push({
        id, status: "generated", promptVersion: PROMPT_VERSION, latencyMs,
        tokens: result.usage.total ? result.usage : null,
        inputHash: sha256(context),
        outputHash: sha256(`${result.pt}\n${result.en}`),
      });
      console.log(`OK  ${id} (${(latencyMs / 1000).toFixed(1)}s) [${sections[id].freshness}, dados:${result.confidence.data} interp:${result.confidence.interpretation}]${result.usage.total ? ` · ${result.usage.total} tokens` : ""}`);
    } catch (err) {
      const latencyMs = Date.now() - t0;
      if (existing[id]) {
        // Preserva o conteúdo anterior SEM reivindicar a versão atual do prompt:
        // herda promptVersion/generatedAt/runId originais (fallback: metadados do arquivo prévio)
        const status = /abort|timeout/i.test(err.message) ? "preserved_after_timeout" : "preserved_after_error";
        sections[id] = {
          ...existing[id],
          promptVersion: existing[id].promptVersion ?? prev?.promptVersion ?? "unknown",
          generatedAt: existing[id].generatedAt ?? prev?.updatedAt,
          generationStatus: status,
        };
        runLog.sections.push({
          id, status, promptVersion: sections[id].promptVersion, latencyMs,
          tokens: null, // null = consumo indeterminado; zero só se a API confirmar zero
          errorType: status === "preserved_after_timeout" ? "timeout" : "error",
          error: err.message,
        });
        console.warn(`SKIP ${id}: ${err.message} — versão anterior preservada [${status}, prompt v${sections[id].promptVersion}]`);
      } else {
        runLog.sections.push({ id, status: "failed", latencyMs, tokens: null, errorType: /abort|timeout/i.test(err.message) ? "timeout" : "error", error: err.message });
        console.warn(`SKIP ${id}: ${err.message}`);
      }
    }
  }
  if (Object.keys(sections).length === 0) {
    console.warn("Nenhuma seção disponível — insights.json não alterado.");
    process.exit(0);
  }
  runLog.finishedAt = new Date().toISOString();
  await mkdir(OUT_DIR, { recursive: true });
  const payload = { runId, updatedAt: new Date().toISOString(), source: "ODIN Insights (MaaS)", model: MODEL, promptVersion: PROMPT_VERSION, data: { sections } };
  await writeFile(path.join(OUT_DIR, "insights.json"), JSON.stringify(payload));
  await mkdir(LOGS_DIR, { recursive: true });
  const logFile = `insights-runs-${runLog.finishedAt.slice(0, 7)}.jsonl`;
  await appendFile(path.join(LOGS_DIR, logFile), JSON.stringify(runLog) + "\n");
  console.log(`insights.json gravado com ${Object.keys(sections).length} seção(ões).`);
  console.log(`Run registrada em logs/${logFile}${runLog.tokens.total ? ` — ${runLog.tokens.total} tokens reportados nesta execução` : " — API não retornou campo usage"}. Commite os dois arquivos.`);
}

main();
