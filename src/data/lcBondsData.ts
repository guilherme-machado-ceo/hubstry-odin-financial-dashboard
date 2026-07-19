export interface LCBondData { year: number; stock: number; }
export interface SpreadData { country: string; countryPt: string; bond: string; spread: number; yield: number; change30d: number; region: string; }
export interface VolatilityData { month: string; lcBonds: number; ust: number; bund: number; }
export interface TCXData { month: string; hedgeCost: number; }
export interface DebtData { country: string; countryPt: string; lc: number; fc: number; }
export interface StabilityData { country: string; countryPt: string; liquidity: number; risk: number; }
export interface GoldData { year: number; brazil: number; china: number; russia: number; india: number; }
export interface OilData { month: string; brent: number; opec: number; }
export interface ClimateStation { id: string; name: string; namePt: string; lat: number; lon: number; country: string; countryPt: string; }
export interface ClimateData { month: string; anomaly: number; riskIndex: number; station: string; }

export const lcBondsStock: LCBondData[] = [
  { year: 2015, stock: 8.2 }, { year: 2016, stock: 9.5 }, { year: 2017, stock: 11.1 }, { year: 2018, stock: 12.8 },
  { year: 2019, stock: 14.6 }, { year: 2020, stock: 17.3 }, { year: 2021, stock: 19.8 }, { year: 2022, stock: 21.5 },
  { year: 2023, stock: 23.9 }, { year: 2024, stock: 25.7 }, { year: 2025, stock: 27.4 },
];

export const spreadsData: SpreadData[] = [
  { country: "Brazil", countryPt: "Brasil", bond: "NTN-F 2029", spread: 542, yield: 12.85, change30d: 18, region: "latam" },
  { country: "China", countryPt: "China", bond: "CGB 10Y", spread: 12, yield: 1.68, change30d: -3, region: "asia" },
  { country: "India", countryPt: "Índia", bond: "G-Sec 10Y", spread: 198, yield: 6.42, change30d: 5, region: "asia" },
  { country: "Russia", countryPt: "Rússia", bond: "OFZ 10Y", spread: 890, yield: 15.20, change30d: 45, region: "europe" },
  { country: "South Africa", countryPt: "África do Sul", bond: "SAGB 10Y", spread: 385, yield: 10.12, change30d: -8, region: "africa" },
  { country: "Indonesia", countryPt: "Indonésia", bond: "INDOGB 10Y", spread: 245, yield: 6.89, change30d: 12, region: "asia" },
  { country: "Saudi Arabia", countryPt: "Arábia Saudita", bond: "KSA 10Y", spread: 98, yield: 4.55, change30d: 2, region: "mena" },
  { country: "UAE", countryPt: "EAU", bond: "UAEGB 10Y", spread: 65, yield: 4.12, change30d: -1, region: "mena" },
  { country: "Egypt", countryPt: "Egito", bond: "EGB 10Y", spread: 1240, yield: 23.50, change30d: 95, region: "mena" },
  { country: "Ethiopia", countryPt: "Etiópia", bond: "ETGB 10Y", spread: 1580, yield: 28.40, change30d: 120, region: "africa" },
  { country: "Iran", countryPt: "Irã", bond: "IRGB 10Y", spread: 2100, yield: 34.00, change30d: 200, region: "mena" },
];

export const volatilityData: VolatilityData[] = [
  { month: "Jan", lcBonds: 8.5, ust: 4.2, bund: 3.1 }, { month: "Fev", lcBonds: 9.1, ust: 4.5, bund: 3.3 },
  { month: "Mar", lcBonds: 11.2, ust: 5.8, bund: 4.1 }, { month: "Abr", lcBonds: 10.5, ust: 5.2, bund: 3.8 },
  { month: "Mai", lcBonds: 9.8, ust: 4.8, bund: 3.5 }, { month: "Jun", lcBonds: 8.9, ust: 4.4, bund: 3.2 },
  { month: "Jul", lcBonds: 8.2, ust: 4.1, bund: 3.0 }, { month: "Ago", lcBonds: 9.5, ust: 4.6, bund: 3.4 },
  { month: "Set", lcBonds: 10.8, ust: 5.1, bund: 3.9 }, { month: "Out", lcBonds: 11.5, ust: 5.5, bund: 4.2 },
  { month: "Nov", lcBonds: 10.2, ust: 4.9, bund: 3.7 }, { month: "Dez", lcBonds: 9.0, ust: 4.3, bund: 3.2 },
];

export const tcxData: TCXData[] = [
  { month: "Jan", hedgeCost: 385 }, { month: "Fev", hedgeCost: 392 }, { month: "Mar", hedgeCost: 445 },
  { month: "Abr", hedgeCost: 428 }, { month: "Mai", hedgeCost: 410 }, { month: "Jun", hedgeCost: 395 },
  { month: "Jul", hedgeCost: 380 }, { month: "Ago", hedgeCost: 398 }, { month: "Set", hedgeCost: 420 },
  { month: "Out", hedgeCost: 450 }, { month: "Nov", hedgeCost: 432 }, { month: "Dez", hedgeCost: 405 },
];

export const debtCompositionData: DebtData[] = [
  { country: "Brazil", countryPt: "Brasil", lc: 94, fc: 6 }, { country: "China", countryPt: "China", lc: 97, fc: 3 },
  { country: "India", countryPt: "Índia", lc: 96, fc: 4 }, { country: "Russia", countryPt: "Rússia", lc: 78, fc: 22 },
  { country: "South Africa", countryPt: "África do Sul", lc: 88, fc: 12 }, { country: "Indonesia", countryPt: "Indonésia", lc: 72, fc: 28 },
  { country: "Saudi Arabia", countryPt: "Arábia Saudita", lc: 65, fc: 35 }, { country: "UAE", countryPt: "EAU", lc: 45, fc: 55 },
  { country: "Egypt", countryPt: "Egito", lc: 55, fc: 45 }, { country: "Ethiopia", countryPt: "Etiópia", lc: 40, fc: 60 },
];

export const stabilityData: StabilityData[] = [
  { country: "China", countryPt: "China", liquidity: 2, risk: 12 }, { country: "UAE", countryPt: "EAU", liquidity: 4, risk: 65 },
  { country: "Saudi Arabia", countryPt: "Arábia Saudita", liquidity: 5, risk: 98 }, { country: "India", countryPt: "Índia", liquidity: 6, risk: 198 },
  { country: "Indonesia", countryPt: "Indonésia", liquidity: 8, risk: 245 }, { country: "South Africa", countryPt: "África do Sul", liquidity: 10, risk: 385 },
  { country: "Brazil", countryPt: "Brasil", liquidity: 12, risk: 542 }, { country: "Russia", countryPt: "Rússia", liquidity: 18, risk: 890 },
  { country: "Egypt", countryPt: "Egito", liquidity: 25, risk: 1240 }, { country: "Ethiopia", countryPt: "Etiópia", liquidity: 45, risk: 1580 },
  { country: "Iran", countryPt: "Irã", liquidity: 80, risk: 2100 },
];

export const goldData: GoldData[] = [
  { year: 2015, brazil: 67, china: 1762, russia: 1395, india: 558 },
  { year: 2016, brazil: 67, china: 1843, russia: 1615, india: 558 },
  { year: 2017, brazil: 67, china: 1843, russia: 1829, india: 573 },
  { year: 2018, brazil: 67, china: 1852, russia: 2113, india: 600 },
  { year: 2019, brazil: 67, china: 1948, russia: 2272, india: 626 },
  { year: 2020, brazil: 67, china: 1948, russia: 2295, india: 676 },
  { year: 2021, brazil: 129, china: 1948, russia: 2301, india: 754 },
  { year: 2022, brazil: 129, china: 2011, russia: 2332, india: 787 },
  { year: 2023, brazil: 129, china: 2235, russia: 2332, india: 804 },
  { year: 2024, brazil: 129, china: 2279, russia: 2336, india: 876 },
  { year: 2025, brazil: 129, china: 2296, russia: 2336, india: 880 },
];

export const sourceRefs = [
  { id: "bis", name: "Bank for International Settlements (BIS)", namePt: "Banco de Compensações Internacionais (BIS)", url: "https://www.bis.org/statistics/secstats.htm", methodology: "Debt securities statistics, Table C1 (domestic debt securities). Quarterly data on local currency bond markets.", methodologyPt: "Estatísticas de títulos de dívida, Tabela C1 (títulos domésticos). Dados trimestrais de mercados de títulos em moeda local.", lastUpdated: "2025-Q1" },
  { id: "adb", name: "Asian Development Bank — AsianBondsOnline", namePt: "Banco Asiático de Desenvolvimento — AsianBondsOnline", url: "https://asianbondsonline.adb.org/", methodology: "LCY bond market size and composition for Asian markets (China, India, Indonesia). Monthly updates.", methodologyPt: "Tamanho e composição do mercado de títulos em moeda local para mercados asiáticos (China, Índia, Indonésia). Atualizações mensais.", lastUpdated: "2025-06" },
  { id: "omfif", name: "OMFIF — Global Public Investor", namePt: "OMFIF — Investidor Público Global", url: "https://www.omfif.org/gpi/", methodology: "Annual survey of central bank reserve managers. Gold allocation trends and reserve diversification data.", methodologyPt: "Pesquisa anual com gestores de reservas de bancos centrais. Tendências de alocação em ouro e diversificação de reservas.", lastUpdated: "2025-07" },
  { id: "bcb", name: "Banco Central do Brasil — PTAX", namePt: "Banco Central do Brasil — PTAX", url: "https://www.bcb.gov.br/estabilidadefinanceira/fechamentodolar", methodology: "Official BRL/USD reference rate (PTAX closing). Updated daily at ~13:11 BRT.", methodologyPt: "Taxa de referência oficial BRL/USD (fechamento PTAX). Atualizada diariamente ~13:11 BRT.", lastUpdated: "2025-08-01" },
  { id: "tcx", name: "The Currency Exchange Fund (TCX)", namePt: "Fundo de Câmbio (TCX)", url: "https://www.tcxfund.com/", methodology: "Currency hedging costs for frontier market currencies. Cross-currency basis and forward points.", methodologyPt: "Custos de hedge cambial para moedas de mercados de fronteira. Basis cambial e pontos forward.", lastUpdated: "2025-Q2" },
  { id: "wgc", name: "World Gold Council", namePt: "Conselho Mundial do Ouro", url: "https://www.gold.org/goldhub/data/gold-reserves-by-country", methodology: "Monthly central bank gold reserve statistics, IMF IFS-based data.", methodologyPt: "Estatísticas mensais de reservas de ouro de bancos centrais, baseadas em dados IFS do FMI.", lastUpdated: "2025-07" },
  { id: "eia", name: "U.S. Energy Information Administration (EIA)", namePt: "Administração de Informação de Energia dos EUA (EIA)", url: "https://www.eia.gov/petroleum/", methodology: "Weekly petroleum status reports. Brent spot prices and OPEC+ production estimates.", methodologyPt: "Relatórios semanais de status do petróleo. Preços spot do Brent e estimativas de produção da OPEC+.", lastUpdated: "2025-07-30" },
  { id: "open-meteo", name: "Open-Meteo (ERA5 Reanalysis)", namePt: "Open-Meteo (Reanálise ERA5)", url: "https://open-meteo.com/", methodology: "ERA5 reanalysis data (Copernicus ECMWF). Temperature anomalies vs. 1991-2020 baseline. Free API, no key required.", methodologyPt: "Dados de reanálise ERA5 (Copernicus ECMWF). Anomalias de temperatura vs. base 1991-2020. API gratuita, sem chave.", lastUpdated: "2025-08-01" },
  { id: "nasa-power", name: "NASA POWER (Prediction of Worldwide Energy Resources)", namePt: "NASA POWER (Predição de Recursos Energéticos Mundiais)", url: "https://power.larc.nasa.gov/", methodology: "Global meteorological and solar radiation data. Free API, no key required.", methodologyPt: "Dados globais meteorológicos e de radiação solar. API gratuita, sem chave.", lastUpdated: "2025-08-01" },
  { id: "google-news", name: "Google News RSS Feed", namePt: "Google News RSS Feed (sem chave)", url: "https://news.google.com/rss", methodology: "RSS feed aggregation from global news sources. No API key required.", methodologyPt: "Agregacao de feeds RSS de fontes globais. Sem chave de API necessaria.", lastUpdated: "2025-06-29" },
  { id: "ec-cbam", name: "European Commission — CBAM (DG TAXUD)", namePt: "Comissão Europeia — CBAM (DG TAXUD)", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en", methodology: "Official CBAM certificate quarterly prices and definitive-regime milestones (Reg. (EU) 2023/956 and 2025/2083).", methodologyPt: "Preços oficiais trimestrais do certificado CBAM e marcos do regime definitivo (Reg. (UE) 2023/956 e 2025/2083).", lastUpdated: "2026-07-06" },
  { id: "worldbank-carbon", name: "World Bank Carbon Pricing Dashboard", namePt: "Banco Mundial — Painel de Precificação de Carbono", url: "https://carbonpricingdashboard.worldbank.org/", methodology: "Global carbon pricing instruments (ETS and carbon taxes), prices and coverage.", methodologyPt: "Instrumentos globais de precificação de carbono (ETS e taxas), preços e cobertura.", lastUpdated: "2026-06-30" },
  { id: "owid", name: "Our World in Data — CO2 Emissions", namePt: "Our World in Data — Emissões de CO2", url: "https://ourworldindata.org/co2-emissions", methodology: "Consumption-based CO2 per capita, Global Carbon Project. Daily snapshot via GitHub Actions.", methodologyPt: "CO2 por consumo per capita, Global Carbon Project. Snapshot diário via GitHub Actions.", lastUpdated: "2026-07-19" },
  { id: "defillama", name: "DefiLlama — Open DeFi Data", namePt: "DefiLlama — Dados Abertos de DeFi", url: "https://defillama.com/", methodology: "Open APIs for crypto prices, stablecoins, protocols and RWA TVL. No API key required.", methodologyPt: "APIs abertas de preços de cripto, stablecoins, protocolos e TVL de RWAs. Sem chave de API.", lastUpdated: "2026-07-19" },
  { id: "mempool-space", name: "mempool.space API", namePt: "mempool.space — API da rede Bitcoin", url: "https://mempool.space/", methodology: "Bitcoin network data (fees, block height). No API key required.", methodologyPt: "Dados da rede Bitcoin (taxas, altura de bloco). Sem chave de API.", lastUpdated: "2026-07-19" },
];
