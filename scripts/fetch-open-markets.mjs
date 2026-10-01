// ============================================================
// ODIN — Coleta de dados abertos de mercado (PR 2c)
// Substitui as séries atribuídas ao Bloomberg Terminal (sem metodologia
// registrada) por séries ABERTAS, sem chave, com método explícito:
//
//  1. Diferencial de juros soberanos de 10 anos (pb)
//     = rendimento do título de 10 anos do país − rendimento do título de
//       10 anos dos EUA, ambos da MESMA série da OCDE (Main Economic
//       Indicators, "Long-Term Government Bond Yields: 10-Year: Main
//       (Including Benchmark)"), mensal, via FRED. Média anual = média dos 12
//       meses (ano incompleto não entra). Δ12m = último mês − mesmo mês do ano
//       anterior; tendência: |Δ12m| < 25 pb → estável.
//     NÃO é o spread EMBI (títulos em dólar) — é outra métrica, com outro nome.
//  2. Volatilidade cambial anualizada (%)
//     = desvio-padrão amostral dos retornos logarítmicos diários da moeda
//       local por US$ × √252 × 100, por ano civil (≥ 200 retornos) e no ano
//       corrente até a última observação (≥ 60 retornos). Fontes: Federal
//       Reserve H.10 via FRED; COP pela TRM do Banco de la República
//       (datos.gov.co).
//  3. Petróleo: média anual dos preços diários spot de Brent e WTI (EIA, via
//     FRED), ano com ≥ 200 observações.
//
// Países/moedas sem série aberta metodologicamente compatível NÃO recebem
// substituto: entram em `gaps` com o motivo. Regra aprovada em 01/10/2026.
//
// Saída: src/data/generated/open-markets.json (lido pelo painel e pelos testes).
// Rodado pelo workflow .github/workflows/open-markets.yml (o container de
// desenvolvimento não alcança essas fontes).
// ============================================================
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "src/data/generated/open-markets.json");
const METHOD_VERSION = "1.0.0";
const FIRST_YEAR = 2015;
const UA = { "User-Agent": "ODIN-open-markets/1.0 (+https://github.com/guilherme-machado-ceo/hubstry-odin-financial-dashboard)" };

const gh = (level, msg) => console.log(process.env.GITHUB_ACTIONS ? `::${level}::${msg}` : `[${level}] ${msg}`);
const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
const mean = (a) => a.reduce((s, x) => s + x, 0) / a.length;
const stdev = (a) => { const m = mean(a); return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1)); };

const errors = [];
const seriesMeta = {};

async function fetchText(url) {
  let last;
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (e) { last = e; await new Promise((r) => setTimeout(r, 2000 * (i + 1))); }
  }
  throw last;
}

/** Série do FRED em CSV (sem chave). Retorna [{date, value}] sem faltantes. */
async function fred(id, title) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}&cosd=${FIRST_YEAR - 1}-12-01`;
  try {
    const text = await fetchText(url);
    const rows = text.trim().split(/\r?\n/).slice(1).map((l) => l.split(","))
      .filter(([d, v]) => d && v && v !== "." && !Number.isNaN(Number(v)))
      .map(([d, v]) => ({ date: d, value: Number(v) }));
    if (!rows.length) throw new Error("série vazia");
    seriesMeta[id] = { sourceId: "fred", title, url: `https://fred.stlouisfed.org/series/${id}`, firstDate: rows[0].date, lastDate: rows.at(-1).date, n: rows.length };
    gh("notice", `${id}: ${rows.length} obs, ${rows[0].date} → ${rows.at(-1).date}`);
    return rows;
  } catch (e) {
    errors.push({ id, url, error: String(e.message ?? e) });
    gh("error", `${id}: falha na coleta (${e.message ?? e})`);
    return null;
  }
}

/** TRM (COP por US$) do Banco de la República, via datos.gov.co (sem chave). */
async function trm() {
  const id = "TRM-COP";
  const url = `https://www.datos.gov.co/resource/32sa-8pi3.json?$select=valor,vigenciadesde&$where=vigenciadesde>='${FIRST_YEAR - 1}-12-01T00:00:00'&$order=vigenciadesde&$limit=50000`;
  try {
    const rows = JSON.parse(await fetchText(url))
      .map((r) => ({ date: String(r.vigenciadesde).slice(0, 10), value: Number(r.valor) }))
      .filter((r) => r.date && Number.isFinite(r.value) && r.value > 0);
    if (!rows.length) throw new Error("série vazia");
    seriesMeta[id] = { sourceId: "banrep-trm", title: "Tasa Representativa del Mercado (TRM), COP por US$", url: "https://www.datos.gov.co/d/32sa-8pi3", firstDate: rows[0].date, lastDate: rows.at(-1).date, n: rows.length };
    gh("notice", `${id}: ${rows.length} obs, ${rows[0].date} → ${rows.at(-1).date}`);
    return rows;
  } catch (e) {
    errors.push({ id, url, error: String(e.message ?? e) });
    gh("error", `${id}: falha na coleta (${e.message ?? e})`);
    return null;
  }
}

// ── 1. Diferencial de juros soberanos de 10 anos ─────────────────────────────
const YIELD_COUNTRIES = [
  { flag: "MX", country: "Mexico", countryPt: "México", id: "IRLTLT01MXM156N" },
  { flag: "IN", country: "India", countryPt: "Índia", id: "INDIRLTLT01STM" },
  { flag: "ZA", country: "South Africa", countryPt: "África do Sul", id: "IRLTLT01ZAM156N" },
  { flag: "CL", country: "Chile", countryPt: "Chile", id: "IRLTLT01CLM156N" },
];
const YIELD_GAPS = [
  { flag: "BR", country: "Brazil", countryPt: "Brasil", reasonPt: "Sem série aberta de 10 anos com a definição da OCDE (MEI). Candidatos (Tesouro Nacional, ANBIMA) exigem análise de equivalência antes de entrar.", reasonEn: "No open 10-year series with the OECD (MEI) definition. Candidates (Brazilian Treasury, ANBIMA) require an equivalence review first." },
  { flag: "CN", country: "China", countryPt: "China", reasonPt: "Sem série de 10 anos na OCDE (MEI).", reasonEn: "No 10-year series in the OECD (MEI)." },
  { flag: "RU", country: "Russia", countryPt: "Rússia", reasonPt: "Série da OCDE (MEI) encerrada em jun/2018.", reasonEn: "OECD (MEI) series discontinued in Jun 2018." },
  { flag: "CO", country: "Colombia", countryPt: "Colômbia", reasonPt: "Sem série de 10 anos na OCDE (MEI).", reasonEn: "No 10-year series in the OECD (MEI)." },
  { flag: "AR", country: "Argentina", countryPt: "Argentina", reasonPt: "Sem série de 10 anos na OCDE (MEI).", reasonEn: "No 10-year series in the OECD (MEI)." },
];

function monthKey(d) { return d.slice(0, 7); }

async function buildYieldDifferential() {
  const us = await fred("IRLTLT01USM156N", "Long-Term Government Bond Yields: 10-Year: Main (Including Benchmark) for United States (OECD MEI)");
  const countries = [];
  const gaps = [...YIELD_GAPS];
  if (!us) {
    for (const c of YIELD_COUNTRIES) gaps.push({ flag: c.flag, country: c.country, countryPt: c.countryPt, reasonPt: "Referência dos EUA indisponível na coleta.", reasonEn: "US benchmark unavailable at collection time." });
    return { countries, gaps };
  }
  const usBy = new Map(us.map((r) => [monthKey(r.date), r.value]));
  for (const c of YIELD_COUNTRIES) {
    const rows = await fred(c.id, `Long-Term Government Bond Yields: 10-Year: Main (Including Benchmark) for ${c.country} (OECD MEI)`);
    if (!rows) { gaps.push({ flag: c.flag, country: c.country, countryPt: c.countryPt, reasonPt: "Fonte indisponível na coleta.", reasonEn: "Source unavailable at collection time." }); continue; }
    const monthly = rows.map((r) => ({ month: monthKey(r.date), local: r.value, us: usBy.get(monthKey(r.date)) }))
      .filter((r) => r.us != null)
      .map((r) => ({ ...r, bps: Math.round((r.local - r.us) * 100) }));
    if (!monthly.length) { gaps.push({ flag: c.flag, country: c.country, countryPt: c.countryPt, reasonPt: "Sem meses em comum com a referência dos EUA.", reasonEn: "No months in common with the US benchmark." }); continue; }
    const annual = {};
    for (let y = FIRST_YEAR; y <= new Date().getUTCFullYear(); y++) {
      const ms = monthly.filter((r) => r.month.startsWith(`${y}-`));
      if (ms.length === 12) annual[y] = Math.round(mean(ms.map((r) => r.bps)));
    }
    const latest = monthly.at(-1);
    const [ly, lm] = latest.month.split("-").map(Number);
    const prev = monthly.find((r) => r.month === `${ly - 1}-${String(lm).padStart(2, "0")}`);
    const delta12mBps = prev ? latest.bps - prev.bps : null;
    const trend = delta12mBps == null ? null : Math.abs(delta12mBps) < 25 ? "stable" : delta12mBps > 0 ? "widening" : "narrowing";
    countries.push({
      flag: c.flag, country: c.country, countryPt: c.countryPt, seriesId: c.id,
      latest: { month: latest.month, localPct: round(latest.local, 2), usPct: round(latest.us, 2), bps: latest.bps },
      delta12mBps, trend, annual,
    });
  }
  return { countries, gaps };
}

// ── 2. Volatilidade cambial anualizada ──────────────────────────────────────
const FX = [
  { code: "BRL", flag: "BR", country: "Brazil", countryPt: "Brasil", id: "DEXBZUS", title: "Brazilian Reals to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)" },
  { code: "MXN", flag: "MX", country: "Mexico", countryPt: "México", id: "DEXMXUS", title: "Mexican Pesos to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)" },
  { code: "INR", flag: "IN", country: "India", countryPt: "Índia", id: "DEXINUS", title: "Indian Rupees to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)" },
  { code: "CNY", flag: "CN", country: "China", countryPt: "China", id: "DEXCHUS", title: "Chinese Yuan Renminbi to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)" },
  { code: "ZAR", flag: "ZA", country: "South Africa", countryPt: "África do Sul", id: "DEXSFUS", title: "South African Rand to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)" },
  { code: "COP", flag: "CO", country: "Colombia", countryPt: "Colômbia", id: "TRM-COP", title: "TRM (Banco de la República)" },
];
const FX_GAPS = [
  { code: "ARS", flag: "AR", country: "Argentina", countryPt: "Argentina", reasonPt: "Câmbio oficial sob controles em boa parte do período (2011–2015, 2019–2025); não é comparável a câmbio de mercado.", reasonEn: "Official rate under capital controls for much of the period (2011–2015, 2019–2025); not comparable to a market rate." },
  { code: "RUB", flag: "RU", country: "Russia", countryPt: "Rússia", reasonPt: "Não coberto pelo Federal Reserve H.10; sem série aberta compatível.", reasonEn: "Not covered by Federal Reserve H.10; no compatible open series." },
  { code: "TRY", flag: "TR", country: "Turkey", countryPt: "Turquia", reasonPt: "Não coberto pelo H.10; a série oficial (EVDS) exige chave de API.", reasonEn: "Not covered by H.10; the official series (EVDS) requires an API key." },
  { code: "IDR", flag: "ID", country: "Indonesia", countryPt: "Indonésia", reasonPt: "Não coberto pelo H.10; sem série aberta compatível.", reasonEn: "Not covered by H.10; no compatible open series." },
];

function logReturnsByYear(rows) {
  const out = new Map();
  for (let i = 1; i < rows.length; i++) {
    const y = Number(rows[i].date.slice(0, 4));
    const r = Math.log(rows[i].value / rows[i - 1].value);
    if (!Number.isFinite(r)) continue;
    if (!out.has(y)) out.set(y, []);
    out.get(y).push({ date: rows[i].date, r });
  }
  return out;
}

async function buildFxVolatility() {
  const currencies = [];
  const gaps = [...FX_GAPS];
  const thisYear = new Date().getUTCFullYear();
  for (const c of FX) {
    const rows = c.id === "TRM-COP" ? await trm() : await fred(c.id, c.title);
    if (!rows) { gaps.push({ code: c.code, flag: c.flag, country: c.country, countryPt: c.countryPt, reasonPt: "Fonte indisponível na coleta.", reasonEn: "Source unavailable at collection time." }); continue; }
    const byYear = logReturnsByYear(rows);
    const annual = {};
    for (let y = FIRST_YEAR; y < thisYear; y++) {
      const rs = byYear.get(y) ?? [];
      if (rs.length >= 200) annual[y] = round(stdev(rs.map((x) => x.r)) * Math.sqrt(252) * 100, 1);
    }
    const cur = byYear.get(thisYear) ?? [];
    const ytd = cur.length >= 60 ? { from: cur[0].date, to: cur.at(-1).date, n: cur.length, vol: round(stdev(cur.map((x) => x.r)) * Math.sqrt(252) * 100, 1) } : null;
    currencies.push({ code: c.code, flag: c.flag, country: c.country, countryPt: c.countryPt, seriesId: c.id, sourceId: seriesMeta[c.id].sourceId, annual, ytd, lastDate: rows.at(-1).date });
  }
  return { currencies, gaps };
}

// ── 3. Petróleo ─────────────────────────────────────────────────────────────
async function buildOil() {
  const out = {};
  for (const [key, id, title] of [["brent", "DCOILBRENTEU", "Crude Oil Prices: Brent - Europe (EIA)"], ["wti", "DCOILWTICO", "Crude Oil Prices: West Texas Intermediate (WTI) - Cushing, Oklahoma (EIA)"]]) {
    const rows = await fred(id, title);
    if (!rows) { out[key] = null; continue; }
    const annual = {};
    for (let y = FIRST_YEAR; y < new Date().getUTCFullYear(); y++) {
      const vs = rows.filter((r) => r.date.startsWith(`${y}-`)).map((r) => r.value);
      if (vs.length >= 200) annual[y] = round(mean(vs), 2);
    }
    out[key] = { seriesId: id, annual, latest: { date: rows.at(-1).date, value: round(rows.at(-1).value, 2) } };
  }
  return out;
}

const yieldDifferential = await buildYieldDifferential();
const fxVolatility = await buildFxVolatility();
const oil = await buildOil();

const payload = {
  schemaVersion: "1.0",
  methodVersion: METHOD_VERSION,
  retrievedAt: new Date().toISOString(),
  series: seriesMeta,
  yieldDifferential: {
    verification: "verified", derivation: "derived", unit: "bps",
    benchmark: "IRLTLT01USM156N",
    methodPt: "Rendimento do título soberano de 10 anos do país menos o dos EUA, ambos da série OCDE MEI (mensal), em pontos-base. Média anual só com 12 meses. Tendência pelo Δ12m (|Δ| < 25 pb = estável). Não é o spread EMBI.",
    methodEn: "Country 10-year sovereign yield minus the US 10-year yield, both from the OECD MEI series (monthly), in basis points. Annual average only with 12 months. Trend from the 12-month change (|Δ| < 25 bps = stable). Not the EMBI spread.",
    ...yieldDifferential,
  },
  fxVolatility: {
    verification: "verified", derivation: "derived", unit: "pct",
    methodPt: "Desvio-padrão amostral dos retornos logarítmicos diários (moeda local por US$) × √252, em %. Ano civil com ≥ 200 retornos; ano corrente com ≥ 60.",
    methodEn: "Sample standard deviation of daily log returns (local currency per US$) × √252, in %. Calendar year with ≥ 200 returns; current year with ≥ 60.",
    ...fxVolatility,
  },
  oil: {
    verification: "verified", derivation: "derived", unit: "usd_bbl",
    methodPt: "Média anual dos preços spot diários (EIA, via FRED); ano com ≥ 200 observações. Último valor diário como referência.",
    methodEn: "Annual average of daily spot prices (EIA, via FRED); year with ≥ 200 observations. Latest daily value as reference.",
    ...oil,
  },
  errors,
};

const ok = yieldDifferential.countries.length + fxVolatility.currencies.length + (oil.brent ? 1 : 0) + (oil.wti ? 1 : 0);
if (!ok) { gh("error", "Nenhuma série coletada; arquivo não foi escrito."); process.exit(1); }
await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, JSON.stringify(payload, null, 2) + "\n");
gh("notice", `open-markets.json: ${yieldDifferential.countries.length} diferenciais, ${fxVolatility.currencies.length} moedas, petróleo ${oil.brent ? "ok" : "falhou"}/${oil.wti ? "ok" : "falhou"}, ${errors.length} erro(s)`);
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    "## ODIN — dados abertos de mercado", "",
    "| Bloco | Itens | Lacunas |", "|---|---|---|",
    `| Diferencial de juros 10a | ${yieldDifferential.countries.map((c) => `${c.flag} ${c.latest.bps} pb (${c.latest.month})`).join(", ")} | ${yieldDifferential.gaps.map((g) => g.flag).join(", ")} |`,
    `| Volatilidade cambial | ${fxVolatility.currencies.map((c) => `${c.code} ${c.annual[new Date().getUTCFullYear() - 1] ?? "—"}%`).join(", ")} | ${fxVolatility.gaps.map((g) => g.code).join(", ")} |`,
    `| Petróleo | Brent ${oil.brent?.latest.value ?? "—"} · WTI ${oil.wti?.latest.value ?? "—"} | — |`,
    "", errors.length ? `Erros: ${errors.map((e) => `${e.id} (${e.error})`).join("; ")}` : "Sem erros.",
  ];
  await writeFile(process.env.GITHUB_STEP_SUMMARY, lines.join("\n") + "\n", { flag: "a" });
}
