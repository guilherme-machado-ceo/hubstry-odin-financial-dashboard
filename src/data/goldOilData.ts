// ============================================================
// GOLD & OIL DATA ENGINE v2.4
// Sources: World Gold Council, IMF COFER, EIA, OPEC, Shanghai INE, G1, Bloomberg
// ============================================================

export interface GoldReserve { year: number; China: number; Russia: number; India: number; Brazil: number; Turkey: number; Poland: number; }
export interface GoldShare { flag: string; country: string; countryPt: string; pct2025: number; }
export interface OilData { year: number; brent: number; wti: number; bricsProduction: number; petroyuanVolume: number; }
export interface ContextBannerData { tag: string; tagPt: string; headline: string; headlinePt: string; summary: string; summaryPt: string; source: string; sourceUrl: string; date: string; }

export const goldReserves: GoldReserve[] = [
  { year: 2015, China: 1743, Russia: 1275, India: 558, Brazil: 67, Turkey: 539, Poland: 103 },
  { year: 2016, China: 1842, Russia: 1465, India: 558, Brazil: 67, Turkey: 377, Poland: 103 },
  { year: 2017, China: 1842, Russia: 1717, India: 558, Brazil: 67, Turkey: 565, Poland: 103 },
  { year: 2018, China: 1852, Russia: 2119, India: 591, Brazil: 67, Turkey: 428, Poland: 103 },
  { year: 2019, China: 1948, Russia: 2270, India: 618, Brazil: 67, Turkey: 428, Poland: 228 },
  { year: 2020, China: 1948, Russia: 2295, India: 618, Brazil: 67, Turkey: 547, Poland: 228 },
  { year: 2021, China: 1948, Russia: 2295, India: 711, Brazil: 80, Turkey: 494, Poland: 229 },
  { year: 2022, China: 2010, Russia: 2295, India: 785, Brazil: 130, Turkey: 542, Poland: 337 },
  { year: 2023, China: 2235, Russia: 2333, India: 801, Brazil: 165, Turkey: 572, Poland: 359 },
  { year: 2024, China: 2279, Russia: 2333, India: 853, Brazil: 243, Turkey: 679, Poland: 448 },
  { year: 2025, China: 2353, Russia: 2333, India: 901, Brazil: 270, Turkey: 765, Poland: 516 },
];

export const goldShare: GoldShare[] = [
  { flag: "RU", country: "Russia", countryPt: "Russia", pct2025: 28.2 },
  { flag: "TR", country: "Turkey", countryPt: "Turquia", pct2025: 22.4 },
  { flag: "PL", country: "Poland", countryPt: "Polonia", pct2025: 15.8 },
  { flag: "IN", country: "India", countryPt: "India", pct2025: 9.1 },
  { flag: "CN", country: "China", countryPt: "China", pct2025: 4.8 },
  { flag: "BR", country: "Brazil", countryPt: "Brasil", pct2025: 2.8 },
  { flag: "ZA", country: "South Africa", countryPt: "Africa do Sul", pct2025: 14.5 },
  { flag: "MX", country: "Mexico", countryPt: "Mexico", pct2025: 3.2 },
  { flag: "US", country: "United States", countryPt: "Estados Unidos", pct2025: 72.4 },
];

export const oilData: OilData[] = [
  { year: 2015, brent: 52.3, wti: 48.7, bricsProduction: 27.8, petroyuanVolume: 0 },
  { year: 2016, brent: 43.7, wti: 43.3, bricsProduction: 28.2, petroyuanVolume: 0 },
  { year: 2017, brent: 54.1, wti: 50.8, bricsProduction: 28.8, petroyuanVolume: 0.5 },
  { year: 2018, brent: 71.3, wti: 64.9, bricsProduction: 29.5, petroyuanVolume: 1.2 },
  { year: 2019, brent: 64.2, wti: 57.0, bricsProduction: 30.1, petroyuanVolume: 2.1 },
  { year: 2020, brent: 41.7, wti: 39.2, bricsProduction: 27.4, petroyuanVolume: 3.5 },
  { year: 2021, brent: 70.9, wti: 68.0, bricsProduction: 29.0, petroyuanVolume: 5.8 },
  { year: 2022, brent: 99.0, wti: 94.3, bricsProduction: 30.5, petroyuanVolume: 12.4 },
  { year: 2023, brent: 82.6, wti: 77.6, bricsProduction: 31.8, petroyuanVolume: 18.6 },
  { year: 2024, brent: 79.8, wti: 75.2, bricsProduction: 32.5, petroyuanVolume: 24.2 },
  { year: 2025, brent: 74.5, wti: 70.8, bricsProduction: 33.2, petroyuanVolume: 31.8 },
];

export const contextBanner: ContextBannerData = {
  tag: "GEOPOLITICAL ECONOMY",
  tagPt: "ECONOMIA GEOPOLITICA",
  headline: "Brazil Files Intent Letter for Sovereign Panda Bond up to CNY 5 Billion — Pilot in China's Domestic Debt Market",
  headlinePt: "Brasil entrega carta de intencao para Panda Bond soberano de ate CNY 5 bilhoes — Piloto no mercado de divida domestico chines",
  summary: "Brazil filed an intent letter to issue up to CNY 5 billion in sovereign Panda Bonds in China's domestic interbank market. The operation is structured by ICBC and Bank of China, pricing referenced to AIIB (1.70%) and Barclays (1.95%) recent issuances. If executed, Brazil becomes one of the first Latin American sovereigns to access the CNY-denominated market — institutional layer of the BRICS+ parallel financial infrastructure (CIPS, NDB, Bond Connect bilateral pilot).",
  summaryPt: "O Brasil entregou carta de intencao para emitir ate CNY 5 bilhoes em Panda Bonds soberanos no mercado interbancario domestico chines. A operacao tem estruturacao do ICBC e Bank of China, com referencia de precificacao em emissoes recentes do AIIB (1,70%) e Barclays (1,95%). Se executada, o Brasil se torna um dos primeiros soberanos latino-americanos a acessar o mercado denominado em CNY — camada institucional da infraestrutura financeira paralela BRICS+ (CIPS, NDB, Bond Connect bilateral em piloto).",
  source: "G1 / Bloomberg / Reuters",
  sourceUrl: "https://g1.globo.com/economia/",
  date: "June 2026",
};