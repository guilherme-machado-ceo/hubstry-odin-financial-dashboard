// ============================================================
// ODIN DATA SNAPSHOT — coleta diária de APIs gratuitas (sem chave)
// Gera public/data/*.json consumidos pelo dashboard (padrão snapshot:
// dados versionados em git, auditáveis, sem chamada de API no cliente).
// Cada fonte falha de forma isolada: em erro, o snapshot anterior é mantido.
// ============================================================
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve(process.cwd(), "public/data");
const UA = {
  "User-Agent": "ODIN-Dashboard-Snapshot/1.0 (+https://github.com/guilherme-machado-ceo/hubstry-odin-financial-dashboard)",
};

async function fetchJson(url, timeoutMs = 20000) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchText(url, timeoutMs = 40000) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// Parser CSV mínimo com suporte a campos entre aspas (OWID usa vírgulas nos rótulos)
function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === "," && !inQuotes) { out.push(cur); cur = ""; continue; }
    cur += ch;
  }
  out.push(cur);
  return out;
}

async function writeSnapshot(file, source, sourceUrl, data) {
  await mkdir(OUT_DIR, { recursive: true });
  const payload = { updatedAt: new Date().toISOString(), source, sourceUrl, data };
  await writeFile(path.join(OUT_DIR, file), JSON.stringify(payload));
  console.log(`OK  ${file} <- ${source}`);
}

async function safe(name, fn) {
  try {
    await fn();
  } catch (err) {
    console.warn(`SKIP ${name}: ${err.message} — snapshot anterior mantido (se houver).`);
  }
}

// ── 1. CRYPTO MARKET — DefiLlama Coins API (sem chave) ──────────────
async function cryptoMarket() {
  const ids = [
    ["coingecko:bitcoin", "Bitcoin", "BTC"],
    ["coingecko:ethereum", "Ethereum", "ETH"],
    ["coingecko:solana", "Solana", "SOL"],
    ["coingecko:binancecoin", "BNB", "BNB"],
    ["coingecko:tether", "Tether", "USDT"],
    ["coingecko:usd-coin", "USD Coin", "USDC"],
  ];
  const url = `https://coins.llama.fi/prices/current/${ids.map((i) => i[0]).join(",")}`;
  const json = await fetchJson(url);
  const assets = ids
    .map(([key, name, symbol]) => {
      const c = json.coins?.[key];
      return c ? { id: key.split(":")[1], name, symbol, priceUsd: c.price } : null;
    })
    .filter(Boolean);
  if (assets.length === 0) throw new Error("resposta vazia");
  await writeSnapshot(
    "crypto-market.json",
    "DefiLlama Coins API",
    "https://defillama.com/",
    { assets }
  );
}

// ── 2. STABLECOINS — DefiLlama Stablecoins API (sem chave) ──────────
async function stablecoins() {
  const json = await fetchJson("https://stablecoins.llama.fi/stablecoins?includePrices=true");
  const assets = (json.peggedAssets || [])
    .map((a) => ({
      name: a.name,
      symbol: a.symbol,
      mcapUsd: a.circulating?.peggedUSD ?? 0,
    }))
    .filter((a) => a.mcapUsd > 0)
    .sort((a, b) => b.mcapUsd - a.mcapUsd)
    .slice(0, 8);
  const totalMcapUsd = assets.reduce((s, a) => s + a.mcapUsd, 0);
  if (assets.length === 0) throw new Error("resposta vazia");
  await writeSnapshot(
    "stablecoins.json",
    "DefiLlama Stablecoins API",
    "https://defillama.com/stablecoins",
    { totalMcapUsd, assets }
  );
}

// ── 3. RWA + CARBONO TOKENIZADO — DefiLlama Protocols (sem chave) ───
async function rwaProtocols() {
  const json = await fetchJson("https://api.llama.fi/protocols");
  if (!Array.isArray(json)) throw new Error("formato inesperado");
  const rwa = json
    .filter((p) => p.category === "RWA" && typeof p.tvl === "number")
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 8)
    .map((p) => ({ name: p.name, tvlUsd: p.tvl, chains: p.chains || [], category: p.category }));
  const tokenizedCarbon = json
    .filter((p) => /klima|toucan|moss/i.test(p.name || ""))
    .map((p) => ({ name: p.name, tvlUsd: p.tvl ?? null, category: p.category ?? null }));
  await writeSnapshot(
    "rwa-protocols.json",
    "DefiLlama Protocols API",
    "https://defillama.com/protocols",
    { rwa, tokenizedCarbon }
  );
}

// ── 4. CO2 POR CONSUMO — Our World in Data / Global Carbon Project ──
async function owidCo2() {
  const wanted = new Map([
    ["BRA", "Brasil"],
    ["CHN", "China"],
    ["IND", "Índia"],
    ["USA", "Estados Unidos"],
    ["OWID_EU27", "União Europeia (27)"],
  ]);
  const csv = await fetchText("https://ourworldindata.org/grapher/consumption-co2-per-capita.csv?csvType=full");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const valueCol = header.length - 1;
  const seriesMap = new Map();
  for (const line of lines.slice(1)) {
    const cols = parseCsvLine(line);
    const code = cols[1];
    if (!wanted.has(code)) continue;
    const year = Number(cols[2]);
    const value = Number(cols[valueCol]);
    if (year < 2010 || !Number.isFinite(value)) continue;
    if (!seriesMap.has(code)) seriesMap.set(code, []);
    seriesMap.get(code).push([year, Math.round(value * 100) / 100]);
  }
  const series = [...wanted.entries()]
    .filter(([code]) => seriesMap.has(code))
    .map(([code, country]) => ({ code, country, points: seriesMap.get(code) }));
  if (series.length === 0) throw new Error("nenhuma série extraída");
  await writeSnapshot(
    "owid-co2.json",
    "Our World in Data (Global Carbon Project)",
    "https://ourworldindata.org/co2-emissions",
    { series, unit: "tCO2 per capita (consumo)", fromYear: 2010 }
  );
}

const startedAt = Date.now();
await safe("crypto-market", cryptoMarket);
await safe("stablecoins", stablecoins);
await safe("rwa-protocols", rwaProtocols);
await safe("owid-co2", owidCo2);
console.log(`Snapshot concluído em ${((Date.now() - startedAt) / 1000).toFixed(1)}s`);
