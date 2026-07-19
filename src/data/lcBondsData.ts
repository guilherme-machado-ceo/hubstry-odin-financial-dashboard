// ============================================================
// LC BONDS DASHBOARD — DATA ENGINE v2.4
// Refreshed 2025-2026 data matching Perplexity reference
// Sources: BIS, IMF WEO, CEPAL, Bloomberg, BCB, PBOC, NDB, TCX, Alpha Vantage
// ============================================================

export interface YearlyTotal { year: number; brics: number; latam: number; total: number; }
export interface BilateralTrade { year: number; brics: number; latamBilateral: number; }
export interface TCXData { year: number; annualHedged: number; portfolioOutstanding: number; currencies: number; }
export interface VolatilityData { year: number; BRL: number; MXN: number; COP: number; INR: number; CNY: number; ZAR: number; }
export interface CountryDebt { country: string; countryPt: string; region: "LATAM" | "BRICS"; flag: string; localCurrencyDebt: number[]; foreignCurrencyDebt: number[]; totalDebt: number[]; debtToGDP: number; debtToGDPLabel: string; debtToGDPSource: string; debtToGDPSnapshot: string; }
export interface SourceRef { id: string; name: string; namePt: string; url: string; methodology: string; methodologyPt: string; lastUpdated: string; }
export interface KPIData { lcBondMarketTotal: string; lcBondMarketValue: number; lcBondGrowthPct: number; bricsTradeLCShare: number; ndbLCShare: number; ndbLCTarget: number; ndbLCDisbursed: string; ndbLCDisbursedValue: number; tcxHedgedCumulative: string; tcxHedgedValue: number; tcxCurrencies: number; cipsThroughput: string; cipsValue: number; brlUsdPtax: number; brlUsdDate: string; dividaBrutaBR: number; dividaBrutaBRDate: string; }
export interface InflectionPoint { year: number; event: string; eventPt: string; value: string; source: string; isEstimated: boolean; }
export interface SpreadData { country: string; countryPt: string; flag: string; spread2025e: number; trend: "reduzindo" | "estavel" | "ampliando"; trendEn: "reducing" | "stable" | "widening"; volatility2025e: number; officialSpread: number | null; }
export interface VolatilityDetail { currency: string; country: string; countryPt: string; flag: string; official: number | null; estimated2025e: number; }
export interface StabilityScore { country: string; countryPt: string; flag: string; stabilityScore: number; lcDebtShare: number; }

export const kpis: KPIData = {
  lcBondMarketTotal: "$25.7T", lcBondMarketValue: 25700, lcBondGrowthPct: 124.8, bricsTradeLCShare: 45,
  ndbLCShare: 25, ndbLCTarget: 30, ndbLCDisbursed: "~$12B (est.)", ndbLCDisbursedValue: 12.0,
  tcxHedgedCumulative: "$8.1B", tcxHedgedValue: 8.1, tcxCurrencies: 71, cipsThroughput: "¥175T (2024)", cipsValue: 175,
  brlUsdPtax: 5.1689, brlUsdDate: "26/06/2026", dividaBrutaBR: 80.4, dividaBrutaBRDate: "01/04/2026",
};

export const bricsLatamTotal: YearlyTotal[] = [
  { year: 2015, brics: 10400, latam: 1850, total: 12250 }, { year: 2016, brics: 11200, latam: 1920, total: 13120 },
  { year: 2017, brics: 12700, latam: 2100, total: 14800 }, { year: 2018, brics: 13300, latam: 2040, total: 15340 },
  { year: 2019, brics: 14300, latam: 2180, total: 16480 }, { year: 2020, brics: 17100, latam: 2420, total: 19520 },
  { year: 2021, brics: 18900, latam: 2700, total: 21600 }, { year: 2022, brics: 19600, latam: 2620, total: 22220 },
  { year: 2023, brics: 21400, latam: 2850, total: 24250 }, { year: 2024, brics: 23200, latam: 3100, total: 26300 },
  { year: 2025, brics: 21400, latam: 4280, total: 25680 },
];

export const bricsLatamBilateral: BilateralTrade[] = [
  { year: 2015, brics: 18, latamBilateral: 22 }, { year: 2016, brics: 22, latamBilateral: 25 },
  { year: 2017, brics: 26, latamBilateral: 27 }, { year: 2018, brics: 30, latamBilateral: 29 },
  { year: 2019, brics: 34, latamBilateral: 31 }, { year: 2020, brics: 38, latamBilateral: 33 },
  { year: 2021, brics: 44, latamBilateral: 36 }, { year: 2022, brics: 52, latamBilateral: 39 },
  { year: 2023, brics: 65, latamBilateral: 42 }, { year: 2024, brics: 75, latamBilateral: 46 },
  { year: 2025, brics: 45, latamBilateral: 50 },
];

export const tcxHedgingData: TCXData[] = [
  { year: 2015, annualHedged: 0.7, portfolioOutstanding: 2.8, currencies: 45 }, { year: 2016, annualHedged: 0.8, portfolioOutstanding: 3.1, currencies: 48 },
  { year: 2017, annualHedged: 0.95, portfolioOutstanding: 3.5, currencies: 50 }, { year: 2018, annualHedged: 1.1, portfolioOutstanding: 3.9, currencies: 52 },
  { year: 2019, annualHedged: 1.2, portfolioOutstanding: 4.1, currencies: 53 }, { year: 2020, annualHedged: 1, portfolioOutstanding: 4.3, currencies: 52 },
  { year: 2021, annualHedged: 1.37, portfolioOutstanding: 4.5, currencies: 55 }, { year: 2022, annualHedged: 1.38, portfolioOutstanding: 4.4, currencies: 55 },
  { year: 2023, annualHedged: 2.3, portfolioOutstanding: 6.2, currencies: 56 }, { year: 2024, annualHedged: 2.5, portfolioOutstanding: 6.8, currencies: 58 },
  { year: 2025, annualHedged: 3.2, portfolioOutstanding: 8.1, currencies: 71 },
];

export const volatilityData: VolatilityData[] = [
  { year: 2015, BRL: 34.2, MXN: 15.1, COP: 22.4, INR: 4.9, CNY: 3.5, ZAR: 20.1 }, { year: 2016, BRL: 22.1, MXN: 17.8, COP: 14.2, INR: 5.2, CNY: 4.1, ZAR: 22.6 },
  { year: 2017, BRL: 12.8, MXN: 14.2, COP: 10.1, INR: 4.0, CNY: 3.2, ZAR: 11.2 }, { year: 2018, BRL: 18.5, MXN: 12.8, COP: 12.4, INR: 7.2, CNY: 4.5, ZAR: 16.8 },
  { year: 2019, BRL: 14.1, MXN: 9.6, COP: 12.8, INR: 4.5, CNY: 3.8, ZAR: 13.4 }, { year: 2020, BRL: 28.4, MXN: 22.1, COP: 20.2, INR: 6.1, CNY: 3.1, ZAR: 28.2 },
  { year: 2021, BRL: 18.2, MXN: 10.1, COP: 14.8, INR: 3.9, CNY: 2.8, ZAR: 14.1 }, { year: 2022, BRL: 16.4, MXN: 9.4, COP: 20.1, INR: 5.2, CNY: 4.2, ZAR: 16.4 },
  { year: 2023, BRL: 14.8, MXN: 9.8, COP: 14.4, INR: 3.6, CNY: 3.0, ZAR: 14.8 }, { year: 2024, BRL: 18.2, MXN: 12.4, COP: 15.8, INR: 3.8, CNY: 2.4, ZAR: 14.2 },
  { year: 2025, BRL: 16.1, MXN: 11.8, COP: 14.2, INR: 3.5, CNY: 2.2, ZAR: 13.6 },
];

export const countryDebtData: CountryDebt[] = [
  { country: "Brazil", countryPt: "Brasil", region: "LATAM", flag: "BR", localCurrencyDebt: [65,68,72,74,75,96,98,94,88,87,88], foreignCurrencyDebt: [12,13,14,15,14,18,17,15,14,13,12], totalDebt: [77,81,86,89,89,114,115,109,102,100,100], debtToGDP: 80.4, debtToGDPLabel: "80.4%", debtToGDPSource: "BCB", debtToGDPSnapshot: "01/04/2026" },
  { country: "Mexico", countryPt: "Mexico", region: "LATAM", flag: "MX", localCurrencyDebt: [35,36,38,40,42,52,53,51,49,50,51], foreignCurrencyDebt: [11,12,11,11,11,12,11,11,10,10,10], totalDebt: [46,48,49,51,53,64,64,62,59,60,61], debtToGDP: 49.6, debtToGDPLabel: "49.6%", debtToGDPSource: "IMF", debtToGDPSnapshot: "2024" },
  { country: "Argentina", countryPt: "Argentina", region: "LATAM", flag: "AR", localCurrencyDebt: [38,42,50,66,74,89,78,67,62,58,55], foreignCurrencyDebt: [14,17,28,44,63,74,59,51,45,41,38], totalDebt: [52,59,78,110,137,163,137,118,107,99,93], debtToGDP: 93.0, debtToGDPLabel: "93%", debtToGDPSource: "2025e", debtToGDPSnapshot: "2025e" },
  { country: "Colombia", countryPt: "Colombia", region: "LATAM", flag: "CO", localCurrencyDebt: [32,34,35,38,40,56,58,55,53,52,53], foreignCurrencyDebt: [12,13,14,15,15,17,16,15,14,13,13], totalDebt: [44,47,49,53,55,73,74,70,67,65,66], debtToGDP: 71.5, debtToGDPLabel: "71.5%", debtToGDPSource: "IMF", debtToGDPSnapshot: "2024" },
  { country: "Chile", countryPt: "Chile", region: "LATAM", flag: "CL", localCurrencyDebt: [14,15,16,18,19,28,32,36,37,38,39], foreignCurrencyDebt: [7,7,8,8,8,10,10,9,9,8,8], totalDebt: [21,22,24,26,27,38,42,45,46,46,47], debtToGDP: 47.0, debtToGDPLabel: "47%", debtToGDPSource: "2025e", debtToGDPSnapshot: "2025e" },
  { country: "China", countryPt: "China", region: "BRICS", flag: "CN", localCurrencyDebt: [36,40,44,48,50,66,71,73,76,78,80], foreignCurrencyDebt: [2,2,2,2,2,2,2,2,2,2,2], totalDebt: [38,42,46,50,52,68,73,75,78,80,82], debtToGDP: 82.0, debtToGDPLabel: "82%", debtToGDPSource: "2025e", debtToGDPSnapshot: "2025e" },
  { country: "India", countryPt: "India", region: "BRICS", flag: "IN", localCurrencyDebt: [62,64,67,68,70,85,84,82,80,82,83], foreignCurrencyDebt: [4,4,4,4,5,5,5,5,5,5,5], totalDebt: [66,68,71,72,75,90,89,87,85,87,88], debtToGDP: 46.5, debtToGDPLabel: "46.5%", debtToGDPSource: "IMF", debtToGDPSnapshot: "2018" },
  { country: "Russia", countryPt: "Russia", region: "BRICS", flag: "RU", localCurrencyDebt: [11,11,12,12,13,18,18,19,19,17,16], foreignCurrencyDebt: [3,3,3,4,4,4,4,4,3,3,2], totalDebt: [14,14,15,16,17,22,22,23,22,20,18], debtToGDP: 18.0, debtToGDPLabel: "18%", debtToGDPSource: "IMF", debtToGDPSnapshot: "2024" },
  { country: "South Africa", countryPt: "Africa do Sul", region: "BRICS", flag: "ZA", localCurrencyDebt: [42,44,47,52,57,72,75,72,71,73,74], foreignCurrencyDebt: [5,5,5,5,5,6,6,5,5,5,5], totalDebt: [47,49,52,57,62,78,81,77,76,78,79], debtToGDP: 79.4, debtToGDPLabel: "79.4%", debtToGDPSource: "IMF", debtToGDPSnapshot: "2023" },
];

export const inflectionPoints: InflectionPoint[] = [
  { year: 2025, event: "Brazil Panda Bond (sovereign) up to CNY 5B", eventPt: "Panda Bond soberano do Brasil até CNY 5B", value: "Letter of Presentation to NAFMII", source: "Min. Fazenda / NAFMII", isEstimated: false },
  { year: 2024, event: "CIPS throughput", eventPt: "Throughput CIPS", value: "¥ 175 tri (2024)", source: "CIPS / PBOC", isEstimated: false },
  { year: 2026, event: "NDB LC target 30%", eventPt: "Meta LC do NDB 30%", value: "25% → 30% by 2026", source: "NDB Strategy 2022-2026", isEstimated: true },
  { year: 2025, event: "PBOC↔BCB swap line", eventPt: "Swap PBOC↔BCB", value: "R$ 157bi / ¥ 190bi", source: "BCB Press Release", isEstimated: false },
  { year: 2025, event: "Bond Connect bilateral (pilot)", eventPt: "Bond Connect bilateral piloto", value: "Pilot active Q1 2025", source: "CFETS / B3", isEstimated: false },
];

export const spreadsData: SpreadData[] = [
  { country: "Brazil", countryPt: "Brasil", flag: "BR", spread2025e: 820, trend: "reduzindo", trendEn: "reducing", volatility2025e: 16.1, officialSpread: 850 },
  { country: "China", countryPt: "China", flag: "CN", spread2025e: -15, trend: "estavel", trendEn: "stable", volatility2025e: 2.2, officialSpread: -20 },
  { country: "India", countryPt: "India", flag: "IN", spread2025e: 290, trend: "estavel", trendEn: "stable", volatility2025e: 3.5, officialSpread: 310 },
  { country: "Russia", countryPt: "Russia", flag: "RU", spread2025e: 1050, trend: "ampliando", trendEn: "widening", volatility2025e: 22.6, officialSpread: 1100 },
  { country: "South Africa", countryPt: "Africa do Sul", flag: "ZA", spread2025e: 550, trend: "reduzindo", trendEn: "reducing", volatility2025e: 13.6, officialSpread: 580 },
  { country: "Mexico", countryPt: "Mexico", flag: "MX", spread2025e: 360, trend: "estavel", trendEn: "stable", volatility2025e: 11.8, officialSpread: 380 },
  { country: "Argentina", countryPt: "Argentina", flag: "AR", spread2025e: 5800, trend: "ampliando", trendEn: "widening", volatility2025e: 68.4, officialSpread: 6200 },
  { country: "Colombia", countryPt: "Colombia", flag: "CO", spread2025e: 460, trend: "reduzindo", trendEn: "reducing", volatility2025e: 14.2, officialSpread: 490 },
  { country: "Chile", countryPt: "Chile", flag: "CL", spread2025e: 200, trend: "estavel", trendEn: "stable", volatility2025e: 10.1, officialSpread: 210 },
];

export const volatilityDetails: VolatilityDetail[] = [
  { currency: "BRL", country: "Brazil", countryPt: "Brasil", flag: "BR", official: null, estimated2025e: 16.1 },
  { currency: "MXN", country: "Mexico", countryPt: "Mexico", flag: "MX", official: null, estimated2025e: 11.8 },
  { currency: "COP", country: "Colombia", countryPt: "Colombia", flag: "CO", official: null, estimated2025e: 14.2 },
  { currency: "INR", country: "India", countryPt: "India", flag: "IN", official: null, estimated2025e: 3.5 },
  { currency: "CNY", country: "China", countryPt: "China", flag: "CN", official: null, estimated2025e: 2.2 },
  { currency: "ZAR", country: "South Africa", countryPt: "Africa do Sul", flag: "ZA", official: null, estimated2025e: 13.6 },
];

export const stabilityScores = [
  { country: "Brazil", countryPt: "Brasil", flag: "BR", stabilityScore: 62, lcDebtShare: 88 },
  { country: "China", countryPt: "China", flag: "CN", stabilityScore: 85, lcDebtShare: 80 },
  { country: "India", countryPt: "India", flag: "IN", stabilityScore: 72, lcDebtShare: 83 },
  { country: "Russia", countryPt: "Russia", flag: "RU", stabilityScore: 45, lcDebtShare: 16 },
  { country: "South Africa", countryPt: "Africa do Sul", flag: "ZA", stabilityScore: 58, lcDebtShare: 74 },
  { country: "Mexico", countryPt: "Mexico", flag: "MX", stabilityScore: 68, lcDebtShare: 51 },
  { country: "Argentina", countryPt: "Argentina", flag: "AR", stabilityScore: 25, lcDebtShare: 55 },
  { country: "Colombia", countryPt: "Colombia", flag: "CO", stabilityScore: 55, lcDebtShare: 53 },
  { country: "Chile", countryPt: "Chile", flag: "CL", stabilityScore: 78, lcDebtShare: 39 },
];

export const sourceRefs: SourceRef[] = [
  { id: "bis-debt", name: "BIS Debt Securities Statistics", namePt: "BIS — Banco de Compensacoes Internacionais", url: "https://www.bis.org/statistics/secstats.htm", methodology: "Quarterly debt securities statistics by residence, currency and sector.", methodologyPt: "Estatisticas trimestrais de titulos de divida por residencia, moeda e setor.", lastUpdated: "2024-12-31" },
  { id: "imf-weo", name: "IMF World Economic Outlook (Oct 2024)", namePt: "FMI/IMF — Fundo Monetario Internacional", url: "https://www.imf.org/en/Publications/WEO", methodology: "Macroeconomic forecasts based on Article IV consultations.", methodologyPt: "Previsoes macroeconomicas baseadas em consultas do Artigo IV.", lastUpdated: "2024-10-31" },
  { id: "cepal", name: "CEPAL Statistical Yearbook 2024", namePt: "CEPAL — Comissao Economica para a America Latina", url: "https://www.cepal.org/en/publications/statistical-yearbook-latin-america-caribbean-2024", methodology: "Regional aggregates from national central banks.", methodologyPt: "Agregados regionais de bancos centrais nacionais.", lastUpdated: "2024-11-15" },
  { id: "bloomberg", name: "Bloomberg Terminal (2015-2025)", namePt: "Bloomberg Terminal (2015-2025)", url: "https://www.bloomberg.com/professional/", methodology: "Real-time and historical market data.", methodologyPt: "Dados de mercado em tempo real e historicos.", lastUpdated: "2025-01-15" },
  { id: "bcb", name: "Banco Central do Brasil", namePt: "BCB — Banco Central do Brasil", url: "https://www.bcb.gov.br/", methodology: "Brazilian external sector statistics.", methodologyPt: "Estatisticas do setor externo brasileiro.", lastUpdated: "2025-06-26" },
  { id: "ndb", name: "New Development Bank (NDB)", namePt: "NDB — Novo Banco de Desenvolvimento", url: "https://www.ndb.int/", methodology: "Annual reports and strategy documents.", methodologyPt: "Relatorios anuais e documentos de estrategia.", lastUpdated: "2024-06-30" },
  { id: "cips", name: "Cross-Border Interbank Payment System (CIPS)", namePt: "CIPS — Sistema de Pagamentos Interbancarios Transfronteiricos", url: "https://www.cips.com.cn/", methodology: "Annual throughput reports.", methodologyPt: "Relatorios anuais de throughput.", lastUpdated: "2024-12-31" },
  { id: "tcx", name: "The Currency Exchange Fund (TCX)", namePt: "TCX — Fundo de Cambio para Moedas Emergentes", url: "https://tcxfund.com/", methodology: "Impact reports and portfolio data.", methodologyPt: "Relatorios de impacto e dados de portfolio.", lastUpdated: "2025-01-15" },
  { id: "open-meteo", name: "Open-Meteo Climate Data API", namePt: "Open-Meteo — API de Dados Climaticos (sem chave)", url: "https://open-meteo.com/", methodology: "Open-source weather API. No API key required.", methodologyPt: "API meteorologica de codigo aberto. Sem chave de API necessaria.", lastUpdated: "2025-06-29" },
  { id: "google-news", name: "Google News RSS Feed", namePt: "Google News RSS Feed (sem chave)", url: "https://news.google.com/rss", methodology: "RSS feed aggregation from global news sources. No API key required.", methodologyPt: "Agregacao de feeds RSS de fontes globais. Sem chave de API necessaria.", lastUpdated: "2025-06-29" },
  { id: "ec-cbam", name: "European Commission — CBAM (Taxation and Customs Union)", namePt: "Comissao Europeia — CBAM (Mecanismo de Ajuste de Carbono na Fronteira)", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en", methodology: "Official CBAM certificate quarterly average prices and definitive regime timeline.", methodologyPt: "Precos medios trimestrais oficiais dos certificados CBAM e cronograma do regime definitivo.", lastUpdated: "2026-07-06" },
  { id: "worldbank-carbon", name: "World Bank — Carbon Pricing Dashboard", namePt: "Banco Mundial — Painel de Precificacao de Carbono", url: "https://carbonpricingdashboard.worldbank.org/", methodology: "State and Trends of Carbon Pricing; ETS and carbon tax coverage and prices.", methodologyPt: "Relatorio State and Trends; cobertura e precos de ETS e impostos de carbono.", lastUpdated: "2026-06-30" },
  { id: "owid", name: "Our World in Data — CO2 emissions", namePt: "Our World in Data — Emissoes de CO2", url: "https://ourworldindata.org/co2-emissions", methodology: "Consumption-based CO2 emissions per capita (Global Carbon Project).", methodologyPt: "Emissoes de CO2 por consumo per capita (Global Carbon Project).", lastUpdated: "2026-07-19" },
  { id: "defillama", name: "DefiLlama — Crypto & RWA Data API", namePt: "DefiLlama — API de Dados Cripto e RWA (sem chave)", url: "https://defillama.com/", methodology: "Open API for crypto prices, stablecoin supply and RWA protocol TVL. No API key required.", methodologyPt: "API aberta de precos cripto, supply de stablecoins e TVL de protocolos RWA. Sem chave de API necessaria.", lastUpdated: "2026-07-19" },
  { id: "mempool-space", name: "mempool.space — Bitcoin Network API", namePt: "mempool.space — API da Rede Bitcoin (sem chave)", url: "https://mempool.space/", methodology: "Real-time Bitcoin mempool fees and block height. No API key required.", methodologyPt: "Taxas de mempool e altura de bloco do Bitcoin em tempo real. Sem chave de API necessaria.", lastUpdated: "2026-07-19" },
];

export interface VolatilityRank { code: string; country: string; countryPt: string; flag: string; volatility: number; color: string; }
export const volatilityRanking: VolatilityRank[] = [
  { code: "ARS", country: "Argentina", countryPt: "Argentina", flag: "AR", volatility: 68.4, color: "#FF4444" },
  { code: "TRY", country: "Turkey", countryPt: "Turquia", flag: "TR", volatility: 35.2, color: "#FF6600" },
  { code: "RUB", country: "Russia", countryPt: "Russia", flag: "RU", volatility: 22.6, color: "#888888" },
  { code: "ZAR", country: "South Africa", countryPt: "Africa do Sul", flag: "ZA", volatility: 13.6, color: "#FF8800" },
  { code: "COP", country: "Colombia", countryPt: "Colombia", flag: "CO", volatility: 14.2, color: "#4488FF" },
  { code: "BRL", country: "Brazil", countryPt: "Brasil", flag: "BR", volatility: 16.1, color: "#00FFFF" },
  { code: "MXN", country: "Mexico", countryPt: "Mexico", flag: "MX", volatility: 11.8, color: "#4466FF" },
  { code: "INR", country: "India", countryPt: "India", flag: "IN", volatility: 3.5, color: "#44AAFF" },
  { code: "CNY", country: "China", countryPt: "China", flag: "CN", volatility: 2.2, color: "#00CC88" },
  { code: "IDR", country: "Indonesia", countryPt: "Indonesia", flag: "ID", volatility: 4.1, color: "#666666" },
];

export function getCountryDebtAtIndex(index: number) {
  return countryDebtData.map((c) => ({ name: c.country, flag: c.flag, region: c.region, localCurrency: c.localCurrencyDebt[index], foreignCurrency: c.foreignCurrencyDebt[index], total: c.totalDebt[index] }));
}
export const latestYearIndex = 10;
export function getFlagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}
