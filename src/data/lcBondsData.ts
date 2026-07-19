// ============================================================
// DADOS REAIS v2.3 — LC BONDS BRICS + LATAM
// Fontes: BIS (Bank for International Settlements) 2024, IMF WEO Apr 2025, CEPAL 2024
// ============================================================

export interface KPIData { label: string; value: string; subtitle: string; }
export interface MarketEvolutionData { year: number; value: number; }
export interface CountryDebtData {
  country: string; countryPt: string; lc: number; fc: number;
  debtToGdp: number; trend: "up" | "stable" | "down"; official: boolean;
}
export interface InflectionPoint { id: string; title: string; titlePt: string; date: string; description: string; descriptionPt: string; }
export interface SourceRef { id: string; name: string; namePt: string; url: string; methodology: string; methodologyPt: string; lastUpdated: string; }

// ── KPIs Principais (Hero) ─────────────────────────────────────
export const kpiData: KPIData[] = [
  { label: "LC Bond Market", value: "$15.2T", subtitle: "BRICS + LATAM (BIS 2024)" },
  { label: "10-Year Growth", value: "+187%", subtitle: "vs. $5.3T em 2015" },
  { label: "BRICS LC Trade", value: "34%", subtitle: "do comércio intra-bloco (2024)" },
  { label: "NDB LC Disbursements", value: "$8.1B", subtitle: "26%% do total (meta 30%% 2026)" },
  { label: "TCX Cumulative Hedge", value: "$12.4B", subtitle: "em 71 moedas (TCX 2024)" },
  { label: "TCX Covered Currencies", value: "71", subtitle: "incl. BRL, CNY, INR, ZAR" },
];

// ── Evolução do Mercado (Seção 2) ──────────────────────────────
export const marketEvolutionBrics: MarketEvolutionData[] = [
  { year: 2015, value: 4.1 }, { year: 2016, value: 4.6 }, { year: 2017, value: 5.2 }, { year: 2018, value: 5.9 },
  { year: 2019, value: 6.7 }, { year: 2020, value: 7.8 }, { year: 2021, value: 9.2 }, { year: 2022, value: 10.5 },
  { year: 2023, value: 11.8 }, { year: 2024, value: 13.1 }, { year: 2025, value: 14.4 },
];

export const marketEvolutionLatam: MarketEvolutionData[] = [
  { year: 2015, value: 1.2 }, { year: 2016, value: 1.3 }, { year: 2017, value: 1.4 }, { year: 2018, value: 1.5 },
  { year: 2019, value: 1.6 }, { year: 2020, value: 1.7 }, { year: 2021, value: 1.8 }, { year: 2022, value: 1.9 },
  { year: 2023, value: 1.9 }, { year: 2024, value: 2.0 }, { year: 2025, value: 2.1 },
];

// ── Composição da Dívida por País (Seção 5) ────────────────────
export const countryDebtData: CountryDebtData[] = [
  { country: "China", countryPt: "China", lc: 97, fc: 3, debtToGdp: 83, trend: "up", official: true },
  { country: "Brazil", countryPt: "Brasil", lc: 94, fc: 6, debtToGdp: 76, trend: "stable", official: true },
  { country: "India", countryPt: "Índia", lc: 96, fc: 4, debtToGdp: 81, trend: "up", official: true },
  { country: "Russia", countryPt: "Rússia", lc: 78, fc: 22, debtToGdp: 20, trend: "stable", official: true },
  { country: "South Africa", countryPt: "África do Sul", lc: 88, fc: 12, debtToGdp: 74, trend: "up", official: true },
  { country: "Indonesia", countryPt: "Indonésia", lc: 72, fc: 28, debtToGdp: 39, trend: "up", official: true },
  { country: "Saudi Arabia", countryPt: "Arábia Saudita", lc: 65, fc: 35, debtToGdp: 26, trend: "up", official: true },
  { country: "Mexico", countryPt: "México", lc: 81, fc: 19, debtToGdp: 48, trend: "stable", official: true },
  { country: "Argentina", countryPt: "Argentina", lc: 32, fc: 68, debtToGdp: 85, trend: "down", official: true },
  { country: "Egypt", countryPt: "Egito", lc: 55, fc: 45, debtToGdp: 91, trend: "down", official: true },
  { country: "UAE", countryPt: "EAU", lc: 45, fc: 55, debtToGdp: 31, trend: "stable", official: true },
  { country: "Ethiopia", countryPt: "Etiópia", lc: 40, fc: 60, debtToGdp: 38, trend: "down", official: true },
];

// ── Pontos de Virada (Inflection Points) ───────────────────────
export const inflectionPoints: InflectionPoint[] = [
  {
    id: "panda-bond", title: "Brazil's First Sovereign Panda Bond", titlePt: "Primeiro Panda Bond Soberano do Brasil",
    date: "Jun 2025",
    description: "CNY 6 billion issued in Chinese yuan, bypassing USD entirely. Landmark for LC financing.",
    descriptionPt: "CNY 6 bilhões emitidos em yuan chinês, bypass total ao USD. Marco histórico para financiamento em ML.",
  },
  {
    id: "ndb-target", title: "NDB 30% LC Target", titlePt: "Meta de 30%% ML do NDB",
    date: "2026",
    description: "New Development Bank targets 30% of disbursements in local currencies by 2026.",
    descriptionPt: "Novo Banco de Desenvolvimento mira 30%% dos desembolsos em moedas locais até 2026.",
  },
  {
    id: "cips-growth", title: "CIPS Volume Surge", titlePt: "Explosão de Volume no CIPS",
    date: "2024-2025",
    description: "Chinese payment system processes record volumes as USD alternatives scale.",
    descriptionPt: "Sistema de pagamentos chinês processa volumes recordes com a escala das alternativas ao USD.",
  },
];

// ── Fontes Primárias ───────────────────────────────────────────
export const sourceRefs: SourceRef[] = [
  { id: "bis-debt", name: "BIS — Debt Securities Statistics", namePt: "BIS — Estatísticas de Títulos de Dívida", url: "https://www.bis.org/statistics/secstats.htm", methodology: "Total debt securities outstanding by currency and sector (Table C1-C3).", methodologyPt: "Estoque total de títulos de dívida por moeda e setor (Tabelas C1-C3).", lastUpdated: "2024-Q4" },
  { id: "imf-weo", name: "IMF — World Economic Outlook (April 2025)", namePt: "FMI — Perspectivas Econômicas Mundiais (Abril 2025)", url: "https://www.imf.org/en/Publications/WEO", methodology: "General government gross debt (% of GDP), emerging market economies.", methodologyPt: "Dívida bruta do governo geral (% do PIB), economias emergentes.", lastUpdated: "2025-04" },
  { id: "cepal", name: "CEPAL — Estudio Económico de América Latina", namePt: "CEPAL — Estudo Econômico da América Latina", url: "https://www.cepal.org/en/publications", methodology: "External debt structure and currency composition for LATAM economies.", methodologyPt: "Estrutura da dívida externa e composição cambial para economias da AL.", lastUpdated: "2024" },
  { id: "bloomberg", name: "Bloomberg — Panda Bond Issuance Data", namePt: "Bloomberg — Dados de Emissão de Panda Bonds", url: "https://www.bloomberg.com/", methodology: "Cumulative Panda bond issuance by sovereign and corporate borrowers.", methodologyPt: "Emissão acumulada de Panda bonds por emissores soberanos e corporativos.", lastUpdated: "2025-06" },
  { id: "bcb", name: "Banco Central do Brasil — PTAX / Dívida", namePt: "Banco Central do Brasil — PTAX / Dívida", url: "https://www.bcb.gov.br/", methodology: "Official BRL/USD PTAX closing rate. Federal gross debt composition.", methodologyPt: "Taxa oficial PTAX de fechamento BRL/USD. Composição da dívida bruta federal.", lastUpdated: "2025-08-01" },
  { id: "ndb", name: "New Development Bank (NDB)", namePt: "Novo Banco de Desenvolvimento (NDB)", url: "https://www.ndb.int/", methodology: "Annual reports: LC disbursement share, 2026 30% target commitment.", methodologyPt: "Relatórios anuais: participação ML nos desembolsos, meta de 30%% para 2026.", lastUpdated: "2025" },
  { id: "cips", name: "CIPS — Cross-Border Interbank Payment System", namePt: "CIPS — Sistema de Pagamentos Transfronteiriços", url: "https://www.cips.com.cn/", methodology: "Monthly transaction volumes and participant counts.", methodologyPt: "Volumes mensais de transações e número de participantes.", lastUpdated: "2025-06" },
  { id: "tcx", name: "TCX — The Currency Exchange Fund", namePt: "TCX — The Currency Exchange Fund", url: "https://www.tcxfund.com/", methodology: "Portfolio outstanding, annual hedged volumes, covered currencies (71).", methodologyPt: "Portfolio em aberto, volumes anuais de hedge, moedas cobertas (71).", lastUpdated: "2024" },
  { id: "open-meteo", name: "Open-Meteo (ERA5 Reanalysis)", namePt: "Open-Meteo (Reanálise ERA5)", url: "https://open-meteo.com/", methodology: "ERA5 reanalysis (Copernicus ECMWF). Temperature anomalies vs 1991-2020 baseline. Free API, no key.", methodologyPt: "Reanálise ERA5 (Copernicus ECMWF). Anomalias de temperatura vs. base 1991-2020. API gratuita, sem chave.", lastUpdated: "2025-08-01" },
  { id: "google-news", name: "Google News RSS Feed", namePt: "Google News RSS Feed (sem chave)", url: "https://news.google.com/rss", methodology: "RSS feed aggregation from global news sources. No API key required.", methodologyPt: "Agregacao de feeds RSS de fontes globais. Sem chave de API necessaria.", lastUpdated: "2025-06-29" },
  { id: "ec-cbam", name: "European Commission — CBAM (DG TAXUD)", namePt: "Comissão Europeia — CBAM (DG TAXUD)", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en", methodology: "Official CBAM certificate quarterly prices and definitive-regime milestones (Reg. (EU) 2023/956 and 2025/2083).", methodologyPt: "Preços oficiais trimestrais do certificado CBAM e marcos do regime definitivo (Reg. (UE) 2023/956 e 2025/2083).", lastUpdated: "2026-07-06" },
  { id: "worldbank-carbon", name: "World Bank Carbon Pricing Dashboard", namePt: "Banco Mundial — Painel de Precificação de Carbono", url: "https://carbonpricingdashboard.worldbank.org/", methodology: "Global carbon pricing instruments (ETS and carbon taxes), prices and coverage.", methodologyPt: "Instrumentos globais de precificação de carbono (ETS e taxas), preços e cobertura.", lastUpdated: "2026-06-30" },
  { id: "owid", name: "Our World in Data — CO2 Emissions", namePt: "Our World in Data — Emissões de CO2", url: "https://ourworldindata.org/co2-emissions", methodology: "Consumption-based CO2 per capita, Global Carbon Project. Daily snapshot via GitHub Actions.", methodologyPt: "CO2 por consumo per capita, Global Carbon Project. Snapshot diário via GitHub Actions.", lastUpdated: "2026-07-19" },
  { id: "defillama", name: "DefiLlama — Open DeFi Data", namePt: "DefiLlama — Dados Abertos de DeFi", url: "https://defillama.com/", methodology: "Open APIs for crypto prices, stablecoins, protocols and RWA TVL. No API key required.", methodologyPt: "APIs abertas de preços de cripto, stablecoins, protocolos e TVL de RWAs. Sem chave de API.", lastUpdated: "2026-07-19" },
  { id: "mempool-space", name: "mempool.space API", namePt: "mempool.space — API da rede Bitcoin", url: "https://mempool.space/", methodology: "Bitcoin network data (fees, block height). No API key required.", methodologyPt: "Dados da rede Bitcoin (taxas, altura de bloco). Sem chave de API.", lastUpdated: "2026-07-19" },
];
