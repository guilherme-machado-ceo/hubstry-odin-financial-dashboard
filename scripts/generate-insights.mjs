// ============================================================
// ODIN INSIGHTS — gera análises editoriais por seção via MaaS (LiteLLM)
// Roda LOCALMENTE (Actions bloqueado): a chave fica apenas no env da
// sua máquina — nunca no código, nunca no navegador.
//
// Uso:
//   MAAS_KEY="sua_chave" node scripts/generate-insights.mjs
//   MAAS_MODEL="glm-5.1" MAAS_KEY="..." node scripts/generate-insights.mjs
//
// Saída: public/data/insights.json (PT/EN por seção). Se MAAS_KEY
// não estiver definida, o script avisa e sai sem erro (exit 0).
// ============================================================
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const ENDPOINT = process.env.MAAS_ENDPOINT || "https://ldgllm.digiti.net.br/v1/chat/completions";
const MODEL = process.env.MAAS_MODEL || "deepseek-v4-flash";
const KEY = process.env.MAAS_KEY;
const OUT_DIR = path.resolve(process.cwd(), "public/data");

const SYSTEM_PROMPT = `Você é o analista editorial do ODIN, um dashboard de inteligência financeira BRICS+.
Regras editoriais obrigatórias:
- Escreva 2 a 3 frases curtas por idioma, em tom jornalístico-econômico sóbrio.
- Público não-especialista: expanda toda sigla entre parênteses na primeira ocorrência.
- Use APENAS os números e fatos fornecidos no contexto — reproduza-os com fidelidade exata, sem reinterpretar escopos (ex.: "por importador" nunca vira "por produto").
- Não invente dados, datas ou projeções.
- Português do Brasil normativo no campo "pt"; inglês internacional no campo "en".
- Responda SOMENTE com JSON válido no formato: {"pt":"...","en":"..."} — sem markdown, sem comentários.`;

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
  return { pt: parsed.pt.trim(), en: parsed.en.trim() };
}

async function readJson(file) {
  return JSON.parse(await readFile(path.join(OUT_DIR, file), "utf8"));
}

function fmtUsd(v) {
  if (v >= 1e12) return `US$ ${(v / 1e12).toFixed(2)} trilhões`;
  if (v >= 1e9) return `US$ ${(v / 1e9).toFixed(1)} bilhões`;
  return `US$ ${(v / 1e6).toFixed(1)} milhões`;
}

// ── Contextos por seção (fase 1: carbon, blockchain, climate) ──────
async function ctxCarbon() {
  const owid = await readJson("owid-co2.json");
  const last = Object.fromEntries(owid.data.series.map((s) => [s.country, s.points.at(-1)]));
  const lines = Object.entries(last).map(([c, [y, v]]) => `${c}: ${v} tCO2 per capita em ${y}`).join("; ");
  return `Dados da seção Precificação de Carbono e CBAM (regime definitivo desde 01/01/2026):
- Preço oficial do certificado CBAM: Q1 2026 = 75,36 €/tCO2e; Q2 2026 = 75,28 €/tCO2e (publicação da Comissão Europeia em 06/07/2026). Q3 publica em 05/10/2026.
- Escopo: 6 setores; isenção de minimis de 50 t/ano POR IMPORTADOR (massa total de mercadorias cobertas no ano, Reg. 2025/2083); quem responde às obrigações é o importador autorizado na UE, não o exportador; primeira declaração e entrega em 30/09/2027.
- CO2 por consumo per capita (snapshot OWID de ${owid.updatedAt.slice(0, 10)}): ${lines}.
Escreva a análise destacando o que mais importa para um exportador brasileiro (efeitos indiretos: exigência de dados verificáveis, custo e competitividade).`;
}

async function ctxBlockchain() {
  const crypto = await readJson("crypto-market.json");
  const stables = await readJson("stablecoins.json");
  const rwa = await readJson("rwa-protocols.json");
  const prices = crypto.data.assets.map((a) => `${a.symbol} ${fmtUsd(a.priceUsd)}`).join("; ");
  const top = rwa.data.rwa.slice(0, 3).map((p) => `${p.name} ${fmtUsd(p.tvlUsd)}`).join("; ");
  return `Dados da seção Blockchain e Ativos Digitais (snapshots de ${crypto.updatedAt.slice(0, 10)}):
- Preços: ${prices}.
- Valor de mercado total das maiores stablecoins: ${fmtUsd(stables.data.totalMcapUsd)}; líder: ${stables.data.assets[0].name} com ${fmtUsd(stables.data.assets[0].mcapUsd)}.
- Maiores protocolos RWA (Real World Assets) por TVL: ${top}.
- Carbono tokenizado: Toucan Protocol ${fmtUsd(rwa.data.tokenizedCarbon[0].tvlUsd)}, KlimaDAO ${fmtUsd(rwa.data.tokenizedCarbon[1].tvlUsd)}.
Escreva a análise conectando stablecoins como trilhos digitais do dólar com a narrativa das Moedas Locais.`;
}

async function ctxClimate() {
  const res = await fetch(
    "https://archive-api.open-meteo.com/v1/archive?latitude=-15.8&longitude=-47.9&start_date=" +
      new Date(Date.now() - 370 * 864e5).toISOString().slice(0, 10) +
      "&end_date=" + new Date(Date.now() - 5 * 864e5).toISOString().slice(0, 10) +
      "&daily=temperature_2m_mean,precipitation_sum&timezone=auto",
    { signal: AbortSignal.timeout(15000) }
  );
  const json = await res.json();
  const temps = json.daily?.temperature_2m_mean ?? [];
  const avg = temps.reduce((a, b) => a + b, 0) / temps.length;
  const precip = (json.daily?.precipitation_sum ?? []).reduce((a, b) => a + b, 0);
  return `Dados do vetor climático (Open-Meteo, janela móvel de 12 meses até ${new Date(Date.now() - 5 * 864e5).toISOString().slice(0, 10)}):
- Brasília: temperatura média ${avg.toFixed(1)}°C (média histórica 21,4°C); precipitação acumulada ${Math.round(precip)} mm (média histórica 1550 mm).
- O dashboard compara 8 capitais (Pequim, Moscou, Bombaim, Brasília, Joanesburgo, Istambul, Varsóvia, Xangai) com scores de risco de 0 a 100.
Escreva a análise conectando anomalias climáticas com commodities agrícolas, energia e moedas de emergentes.`;
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
  console.log(`Modelo: ${MODEL} · Endpoint: ${ENDPOINT}`);
  const sections = {};
  for (const [id, ctxFn] of SECTIONS) {
    try {
      const context = await ctxFn();
      const t0 = Date.now();
      sections[id] = await chat(context);
      console.log(`OK  ${id} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
    } catch (err) {
      console.warn(`SKIP ${id}: ${err.message}`);
    }
  }
  if (Object.keys(sections).length === 0) {
    console.warn("Nenhuma seção gerada — insights.json não alterado.");
    process.exit(0);
  }
  await mkdir(OUT_DIR, { recursive: true });
  const payload = { updatedAt: new Date().toISOString(), source: "ODIN Insights (MaaS)", model: MODEL, data: { sections } };
  await writeFile(path.join(OUT_DIR, "insights.json"), JSON.stringify(payload));
  console.log(`insights.json gravado com ${Object.keys(sections).length} seção(ões). Commit e push para publicar.`);
}

main();
