// ============================================================
// GOLD & OIL DATA ENGINE v2.4
// Sources: World Gold Council (IMF IFS data) for gold. Oil moved to openMarkets.ts (EIA via FRED, PR 2c).
// ============================================================

export interface GoldReserve { year: number; China: number; Russia: number; India: number; Brazil: number; Turkey: number; Poland: number; }
export interface GoldShare { flag: string; country: string; countryPt: string; pct2025: number; }
export interface ContextBannerData { tag: string; tagPt: string; headline: string; headlinePt: string; summary: string; summaryPt: string; source: string; sourceUrl: string; date: string; datePt?: string; }

// Fonte: World Gold Council, "Quarterly time series on world official gold
// reserves since 2000" (dados do FMI IFS), atualizado em set/2026. Posição de
// fim de período (Q4 de cada ano), em toneladas, 1 casa decimal. Uso de extrato
// limitado com citação, conforme os termos do WGC. Auditoria: dataAudit.ts.
export const goldReserves: GoldReserve[] = [
  { year: 2015, China: 1762.3, Russia: 1414.5, India: 557.7, Brazil: 67.2, Turkey: 116.1, Poland: 102.9 },
  { year: 2016, China: 1842.6, Russia: 1615.2, India: 557.8, Brazil: 67.3, Turkey: 116.1, Poland: 103.0 },
  { year: 2017, China: 1842.6, Russia: 1838.8, India: 558.1, Brazil: 67.3, Turkey: 202.0, Poland: 103.0 },
  { year: 2018, China: 1852.5, Russia: 2113.0, India: 600.4, Brazil: 67.4, Turkey: 253.5, Poland: 128.6 },
  { year: 2019, China: 1948.3, Russia: 2271.2, India: 635.0, Brazil: 67.4, Turkey: 379.0, Poland: 228.6 },
  { year: 2020, China: 1948.3, Russia: 2298.5, India: 676.6, Brazil: 67.4, Turkey: 394.6, Poland: 228.7 },
  { year: 2021, China: 1948.3, Russia: 2301.6, India: 754.1, Brazil: 129.7, Turkey: 394.2, Poland: 230.8 },
  { year: 2022, China: 2010.5, Russia: 2332.7, India: 787.4, Brazil: 129.7, Turkey: 541.8, Poland: 228.7 },
  { year: 2023, China: 2235.4, Russia: 2332.7, India: 803.6, Brazil: 129.7, Turkey: 540.2, Poland: 358.7 },
  { year: 2024, China: 2279.6, Russia: 2332.7, India: 876.2, Brazil: 129.7, Turkey: 587.6, Poland: 448.2 },
  { year: 2025, China: 2306.3, Russia: 2326.5, India: 880.3, Brazil: 172.4, Turkey: 614.3, Poland: 550.2 },
];

// Ouro como % das reservas totais ao fim de 2025 (Q4 2025), mesma fonte WGC/FMI IFS.
// A Rússia não aparece: o WGC não publica o total de reservas russas na série.
export const goldShare: GoldShare[] = [
  { flag: "TR", country: "Turkey", countryPt: "Turquia", pct2025: 54.6 },
  { flag: "PL", country: "Poland", countryPt: "Polonia", pct2025: 28.4 },
  { flag: "ZA", country: "South Africa", countryPt: "Africa do Sul", pct2025: 23.2 },
  { flag: "IN", country: "India", countryPt: "India", pct2025: 17.7 },
  { flag: "CN", country: "China", countryPt: "China", pct2025: 8.6 },
  { flag: "BR", country: "Brazil", countryPt: "Brasil", pct2025: 6.8 },
  { flag: "MX", country: "Mexico", countryPt: "Mexico", pct2025: 6.6 },
  { flag: "US", country: "United States", countryPt: "Estados Unidos", pct2025: 82.4 },
];

export const contextBanner: ContextBannerData = {
  tag: "GEOPOLITICAL ECONOMY",
  tagPt: "ECONOMIA GEOPOLITICA",
  headline: "Brazil Files Letter of Intent for Sovereign Panda Bond up to CNY 5 Billion — Pilot in China's Domestic Debt Market",
  headlinePt: "Brasil entrega Carta de Intenções para Panda Bond soberano de até CNY 5 bilhões — Piloto no mercado de dívida doméstico chinês",
  summary: "Brazil filed a Letter of Intent to the NAFMII (National Association of Financial Market Institutional Investors) to register up to CNY 5 billion in sovereign Panda Bonds in China's domestic interbank market. Bookrunners not yet designated in public phase. If executed, Brazil becomes the first Latin American sovereign — and the 5th globally in 12 months, following Kazakhstan and Pakistan — to access the CNY-denominated market, an institutional layer of the BRICS+ parallel financial infrastructure (CIPS, NDB, Bond Connect bilateral pilot).",
  summaryPt: "O Brasil entregou Carta de Intenções à NAFMII (National Association of Financial Market Institutional Investors) para registrar até CNY 5 bilhões em Panda Bonds soberanos no mercado interbancário doméstico chinês. Estruturadores ainda não designados em fase pública. Se executada, a operação torna o Brasil o primeiro soberano latino-americano — e o 5º global em 12 meses, após Cazaquistão e Paquistão — a acessar o mercado denominado em CNY, camada institucional da infraestrutura financeira paralela BRICS+ (CIPS, NDB, Bond Connect bilateral em piloto).",
  source: "Reuters / Ministério da Fazenda / NAFMII",
  sourceUrl: "https://www.reuters.com/world/americas/brazil-plans-up-5-billion-yuan-panda-bond-issuance-says-finance-minister-2026-06-25/",
  date: "June 2026",
  datePt: "Junho 2026",
};
