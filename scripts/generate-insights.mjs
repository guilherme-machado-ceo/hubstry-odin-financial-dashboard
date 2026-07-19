// ============================================================
// ODIN INSIGHTS v2 — gera análises editoriais por seção via MaaS (LiteLLM)
// Roda LOCALMENTE (Actions bloqueado): a chave fica apenas no env da
// sua máquina — nunca no código, nunca no navegador.
//
// Uso:
//   MAAS_KEY="sua_chave" node scripts/generate-insights.mjs
//   MAAS_MODEL="glm-5.1" MAAS_KEY="..." node scripts/generate-insights.mjs
//
// Saída: public/data/insights.json — por seção: { pt, en, dataAsOf,
// freshness, confidence }. Faz MERGE com o arquivo existente: seções
// que falharem são preservadas da rodada anterior, nunca apagadas.
// Se MAAS_KEY não estiver definida, o script avisa e sai sem erro.
// ============================================================
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ENDPOINT = process.env.MAAS_ENDPOINT || "https://ldgllm.digiti.net.br/v1/chat/completions";
const MODEL = process.env.MAAS_MODEL || "deepseek-v4-flash";
const PROMPT_VERSION = "2.0";
const KEY = process.env.MAAS_KEY;
const OUT_DIR = path.resolve(process.cwd(), "public/data");

// Idade máxima da fonte antes de marcar o insight como "stale" (dias)
const MAX_AGE_DAYS = { carbon: 100, blockchain: 7, climate: 45 };

const SYSTEM_PROMPT = `Você é o analista editorial do ODIN, dashboard de inteligência financeira BRICS+.
Regras editoriais obrigatórias:
- 2 a 3 frases curtas por idioma, tom jornalístico-econômico sóbrio.
- Público não-especialista: expanda toda sigla entre parênteses na primeira ocorrência.
- Use APENAS os números e fatos do contexto, com fidelidade exata de escopo (ex.: "por importador" nunca vira "por produto").
- Se o contexto trouxer os campos "currentPeriod/currentPrice", LIDERE com o dado vigente; cite o anterior apenas como comparação.
- Nomenclatura fixa: "Mecanismo de Ajuste de Carbono na Fronteira" (PT) / "Carbon Border Adjustment Mechanism" (EN).
- Nunca use emissões per capita de um país como argumento de conformidade ou vantagem no CBAM — o mecanismo incide sobre emissões EMBUTIDAS no produto/instalação, não sobre a média nacional.
- O limiar CBAM é ANUAL e AGREGADO por importador (50 t/ano de massa total de mercadorias cobertas); carregamentos pequenos se somam.
- Relações de transmissão (clima→commodities→câmbio; stablecoins→desdolarização) são HIPÓTESES/interpretações — nunca conclusões dos dados. Marque-as linguisticamente como tal.
- Valor de mercado de stablecoins NÃO é volume de pagamentos internacionais — quando o tema surgir, essa distinção deve aparecer.
- Termine sempre com uma frase de limitação explícita: o que os dados NÃO permitem concluir.
- Responda SOMENTE com JSON válido no formato:
  {"pt":"...","en":"...","confidence":{"data":"high|medium|low","interpretation":"high|medium|low"}}
  — sem markdown, sem comentários.
- Atribua "high" à confiança dos dados apenas se TODOS os números citados vieram do contexto fornecido.`;

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
- previousPeriod: "Q1 2026"; previousPrice: 75,36 €/tCO2e. Q3 2026 publica em 05/10/2027? NÃO — publica em 05/10/2026.
- Escopo: 6 setores; limiar de minimis de 50 t/ano ANUAL E AGREGADO por importador (massa total de mercadorias cobertas, Reg. 2025/2083); quem responde às obrigações é o importador autorizado na UE, não o exportador; primeira declaração e entrega em 30/09/2027.
- dataAsOf: ${dataAsOf}.
Escreva a análise para um exportador brasileiro: efeitos indiretos (exigência de dados verificáveis de emissões embutidas, custos de comprovação, competitividade). Não use emissões per capita.`;
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
- Maiores protocolos RWA (Real World Assets) por TVL (Total Value Locked — valor total bloqueado): ${top}.
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
Escreva a análise marcando QUALQUER transmissão para commodities, energia ou câmbio como hipótese, e declare a limitação: uma cidade não representa as regiões produtoras de um país.`;
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
  console.log(`Modelo: ${MODEL} · Prompt: v${PROMPT_VERSION} · Endpoint: ${ENDPOINT}`);
  const existing = (await readJsonSafe("insights.json"))?.data?.sections ?? {};
  const sections = { ...existing };
  for (const [id, ctxFn] of SECTIONS) {
    try {
      const { context, dataAsOf } = await ctxFn();
      const t0 = Date.now();
      const result = await chat(context);
      sections[id] = { ...result, dataAsOf, freshness: freshnessOf(dataAsOf, id) };
      console.log(`OK  ${id} (${((Date.now() - t0) / 1000).toFixed(1)}s) [${sections[id].freshness}, dados:${result.confidence.data} interp:${result.confidence.interpretation}]`);
    } catch (err) {
      console.warn(`SKIP ${id}: ${err.message}${existing[id] ? " — versão anterior preservada" : ""}`);
    }
  }
  if (Object.keys(sections).length === 0) {
    console.warn("Nenhuma seção disponível — insights.json não alterado.");
    process.exit(0);
  }
  await mkdir(OUT_DIR, { recursive: true });
  const payload = { updatedAt: new Date().toISOString(), source: "ODIN Insights (MaaS)", model: MODEL, promptVersion: PROMPT_VERSION, data: { sections } };
  await writeFile(path.join(OUT_DIR, "insights.json"), JSON.stringify(payload));
  console.log(`insights.json gravado com ${Object.keys(sections).length} seção(ões). Commit e push para publicar.`);
}

main();
