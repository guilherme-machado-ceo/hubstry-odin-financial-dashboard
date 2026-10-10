// ============================================================
// ODIN — Auditoria das fontes públicas (PR 2a)
// Registro único do estado de verificação de cada dado curado exibido no
// painel. Regra: nenhum valor entra como "verificado" sem URL oficial e data.
//
// status:
//   verified   — confere com a fonte oficial citada
//   corrected  — estava divergente; corrigido neste PR com a fonte citada
//   unverified — sem fonte oficial localizada/acessível; exibido com marcação
//   retired    — série retirada da interface (PR 2c): fonte paga/sem método ou
//                sem série aberta compatível; não recebe substituto disfarçado
//
// A interface lê `isUnverified()` para marcar indicadores e KPIs; o teste
// scripts/test-data-audit.mjs confere que os valores do código batem com as
// evidências registradas aqui.
// ============================================================

export type AuditStatus = "verified" | "corrected" | "unverified" | "retired";

export interface AuditEvidence {
  claim: string;
  value: string;
  publisher: string;
  url: string;
  publishedAt: string;
}

export interface AuditEntry {
  id: string;
  datasetPt: string;
  datasetEn: string;
  location: string;
  status: AuditStatus;
  previous?: string;
  evidence: AuditEvidence[];
  notePt: string;
  noteEn: string;
}

export const DATA_AUDIT_VERIFIED_AT = "2026-10-01";

export const DATA_AUDIT: AuditEntry[] = [
  // ── Verificados ─────────────────────────────────────────────
  {
    id: "cips-2024",
    datasetPt: "Volume processado pelo CIPS em 2024",
    datasetEn: "CIPS 2024 processed volume",
    location: "lcBondsData.ts › kpis.cipsThroughput",
    status: "verified",
    evidence: [{ claim: "CIPS processed 175 trillion yuan in cross-border RMB payments in 2024, up 43% y/y", value: "175", publisher: "Shanghai Municipal People's Government", url: "https://english.shanghai.gov.cn/en-FinancialReformandInnovation/20250108/0d5502fd008549f1bb306f5ccf1ffe7a.html", publishedAt: "2025-01-08" }],
    notePt: "Dado de 2024. O total de 2025 ainda não foi localizado em fonte oficial.",
    noteEn: "2024 figure. The 2025 total has not yet been located in an official source.",
  },
  {
    id: "swap-pboc-bcb",
    datasetPt: "Linha de swap PBOC↔BCB",
    datasetEn: "PBOC↔BCB swap line",
    location: "lcBondsData.ts › inflectionPoints",
    status: "verified",
    evidence: [{ claim: "190 billion yuan, or 157 billion reais, valid for five years (signed 13 May 2025)", value: "190/157", publisher: "The State Council of the PRC (gov.cn)", url: "https://english.www.gov.cn/news/202505/14/content_WS6823d9a4c6d0868f4e8f283b.html", publishedAt: "2025-05-14" }],
    notePt: "Valores e prazo conferem.",
    noteEn: "Amounts and term match.",
  },
  {
    id: "ndb-lc-target",
    datasetPt: "Meta de financiamento em moeda local do NDB",
    datasetEn: "NDB local-currency financing target",
    location: "lcBondsData.ts › kpis.ndbLCTarget",
    status: "verified",
    evidence: [{ claim: "financing denominated in local currencies is projected to account for 30% of financing provided by the Bank (2022–2026)", value: "30", publisher: "New Development Bank — General Strategy 2022–2026", url: "https://www.ndb.int/wp-content/uploads/2022/07/NDB_StrategyDocument_Eversion-1.pdf", publishedAt: "2022-07-01" }],
    notePt: "A meta de 30% confere. A participação atual (25%) não foi localizada em documento oficial do NDB.",
    noteEn: "The 30% target matches. The current share (25%) was not located in an official NDB document.",
  },
  {
    id: "tcx-annual-2022-2023",
    datasetPt: "Volume anual protegido pelo TCX (2022 e 2023)",
    datasetEn: "TCX annual hedged volume (2022 and 2023)",
    location: "lcBondsData.ts › tcxHedgingData[2022, 2023].annualHedged",
    status: "verified",
    evidence: [
      { claim: "TCX hedged ... a total of USD 1.38 billion across 43 currencies (2022)", value: "1.38", publisher: "TCX — 2022 Annual Results press release", url: "https://www.tcxfund.com/wp-content/uploads/2023/05/PR-2022-Annual-Results_May-2023.pdf", publishedAt: "2023-05-01" },
      { claim: "TCX hedged a record of USD 2.3 billion ... 569 transactions across 43 currencies (2023)", value: "2.3", publisher: "TCX — 2023 Annual Results press release", url: "https://www.tcxfund.com/wp-content/uploads/2024/05/TCX-2023-Annual-Results_Press-Release_May-2024.pdf", publishedAt: "2024-05-01" },
    ],
    notePt: "Conferem. Os demais anos (2015–2021 e 2024) não foram verificados.",
    noteEn: "Match. Other years (2015–2021 and 2024) were not verified.",
  },
  {
    id: "tcx-currencies-cumulative",
    datasetPt: "Moedas cobertas pelo TCX desde 2007",
    datasetEn: "Currencies covered by TCX since 2007",
    location: "lcBondsData.ts › kpis.tcxCurrencies",
    status: "verified",
    evidence: [{ claim: "TCX has hedged a total volume of nearly USD 20 billion in development loans in 71 currencies", value: "71", publisher: "TCX — 2025 Annual Results press release", url: "https://www.tcxfund.com/wp-content/uploads/2026/05/PR-TCX-announces-strong-2025-annual-results.pdf", publishedAt: "2026-05-28" }],
    notePt: "71 é o total acumulado desde 2007, não o número de moedas de 2025 (54).",
    noteEn: "71 is the cumulative total since 2007, not the 2025 currency count (54).",
  },
  {
    id: "cbam",
    datasetPt: "Preços CBAM e marcos do regime definitivo",
    datasetEn: "CBAM prices and definitive-regime milestones",
    location: "public/data/sources/cbam-carbon.json",
    status: "verified",
    evidence: [{ claim: "Official quarterly CBAM certificate prices and timeline", value: "Q1 75.36 / Q2 75.28 / Q3 82.32", publisher: "European Commission — Taxation and Customs Union", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en", publishedAt: "2026-10-05" }],
    notePt: "Governado pelo pipeline de evidências (proveniência SHA-256).",
    noteEn: "Governed by the evidence pipeline (SHA-256 provenance).",
  },
  {
    id: "panda-events",
    datasetPt: "Eventos de Panda Bonds",
    datasetEn: "Panda Bond events",
    location: "pandaBondsData.ts › PANDA_BOND_EVENTS",
    status: "verified",
    evidence: [{ claim: "Each event carries its own sourceUrl and verifiedAt (2026-09-30)", value: "per event", publisher: "pandaBondsData.ts (per-event sources)", url: "https://github.com/guilherme-machado-ceo/hubstry-odin-financial-dashboard/blob/main/src/data/pandaBondsData.ts", publishedAt: "2026-09-30" }],
    notePt: "Cada evento já tem URL e data de verificação próprias.",
    noteEn: "Each event already has its own URL and verification date.",
  },

  // ── Corrigidos neste PR ─────────────────────────────────────
  {
    id: "tcx-annual-2025",
    datasetPt: "Volume protegido pelo TCX em 2025",
    datasetEn: "TCX 2025 hedged volume",
    location: "lcBondsData.ts › tcxHedgingData[2025].annualHedged",
    status: "corrected",
    previous: "3.2",
    evidence: [{ claim: "hedging USD 2.84 billion in currency risk across 572 transactions in 54 currencies (2025)", value: "2.84", publisher: "TCX — 2025 Annual Results press release", url: "https://www.tcxfund.com/wp-content/uploads/2026/05/PR-TCX-announces-strong-2025-annual-results.pdf", publishedAt: "2026-05-28" }],
    notePt: "Corrigido de US$ 3,2 bi para US$ 2,84 bi.",
    noteEn: "Corrected from USD 3.2bn to USD 2.84bn.",
  },
  {
    id: "tcx-cumulative",
    datasetPt: "Hedge acumulado do TCX desde 2007",
    datasetEn: "TCX cumulative hedge since 2007",
    location: "lcBondsData.ts › kpis.tcxHedgedCumulative",
    status: "corrected",
    previous: "$8.1B",
    evidence: [{ claim: "protected borrowers from almost USD 20 billion in foreign exchange risk since its inception", value: "20", publisher: "TCX — 2025 Annual Results press release", url: "https://www.tcxfund.com/wp-content/uploads/2026/05/PR-TCX-announces-strong-2025-annual-results.pdf", publishedAt: "2026-05-28" }],
    notePt: "O KPI \"hedge acumulado\" mostrava US$ 8,1 bi (valor de carteira, não acumulado). Corrigido para ~US$ 20 bi.",
    noteEn: "The \"cumulative hedge\" KPI showed USD 8.1bn (a portfolio figure, not cumulative). Corrected to ~USD 20bn.",
  },
  {
    id: "dbgg-brasil",
    datasetPt: "Dívida Bruta do Governo Geral do Brasil (% do PIB)",
    datasetEn: "Brazil General Government Gross Debt (% of GDP)",
    location: "lcBondsData.ts › kpis.dividaBrutaBR; countryDebtData[Brazil].debtToGDP",
    status: "corrected",
    previous: "80.4 (04/2026)",
    evidence: [{ claim: "SGS series 13762 — DBGG % GDP, latest observation 01/07/2026 = 82.56", value: "82.56", publisher: "Banco Central do Brasil — SGS 13762", url: "https://api.bcb.gov.br/dados/serie/bcdata.sgs.13762/dados/ultimos/6?formato=json", publishedAt: "2026-10-01" }],
    notePt: "Atualizado para jul/2026 (82,6%). O rótulo dizia \"Governo Federal\"; a série é do Governo Geral. O valor de abr/2026 na própria série é 80,10 (revisado).",
    noteEn: "Updated to Jul/2026 (82.6%). The label said \"Federal Government\"; the series is General Government. The Apr/2026 value in the series itself is 80.10 (revised).",
  },

  // ── Não verificados (exibidos com marcação) ─────────────────
  {
    id: "lc-market-total",
    datasetPt: "Mercado de títulos em moeda local BRICS + LATAM (total e crescimento)",
    datasetEn: "BRICS + LATAM local-currency bond market (total and growth)",
    location: "lcBondsData.ts › kpis.lcBondMarketTotal, lcBondGrowthPct, bricsLatamTotal",
    status: "unverified",
    evidence: [],
    notePt: "Atribuído ao BIS, mas o agregado BRICS+LATAM não é publicado pronto e o cálculo não está documentado. A queda BRICS 2024→2025 (23,2 → 21,4 tri) não tem explicação. Reconstruir a partir das estatísticas de títulos de dívida do BIS (data.bis.org) com método explícito.",
    noteEn: "Attributed to the BIS, but the BRICS+LATAM aggregate is not published as such and the calculation is undocumented. The BRICS 2024→2025 drop (23.2 → 21.4tn) is unexplained. Rebuild from BIS debt securities statistics (data.bis.org) with an explicit method.",
  },
  {
    id: "brics-trade-lc",
    datasetPt: "Comércio BRICS em moeda local (45%) e série bilateral",
    datasetEn: "BRICS local-currency trade (45%) and bilateral series",
    location: "lcBondsData.ts › kpis.bricsTradeLCShare, bricsLatamBilateral",
    status: "unverified",
    evidence: [],
    notePt: "Nenhuma fonte registrada no repositório; não há estatística oficial consolidada para o bloco.",
    noteEn: "No source recorded in the repository; there is no consolidated official statistic for the bloc.",
  },
  {
    id: "ndb-lc-share-disbursed",
    datasetPt: "Participação atual (25%) e desembolsos em moeda local do NDB (~US$ 12 bi)",
    datasetEn: "NDB current local-currency share (25%) and disbursements (~USD 12bn)",
    location: "lcBondsData.ts › kpis.ndbLCShare, ndbLCDisbursed",
    status: "unverified",
    evidence: [],
    notePt: "Os 25% aparecem apenas em imprensa secundária; os ~US$ 12 bi não têm fonte. Conferir no relatório anual do NDB.",
    noteEn: "The 25% appears only in secondary press; the ~USD 12bn has no source. Check against the NDB annual report.",
  },
  {
    id: "tcx-series-other",
    datasetPt: "TCX: carteira em aberto, moedas por ano e anos não verificados",
    datasetEn: "TCX: outstanding portfolio, currencies per year and unverified years",
    location: "lcBondsData.ts › tcxHedgingData (portfolioOutstanding, currencies)",
    status: "unverified",
    evidence: [],
    notePt: "O TCX não divulga carteira em aberto nos comunicados anuais; a série de moedas mistura contagem anual e acumulada.",
    noteEn: "TCX does not disclose the outstanding portfolio in its annual releases; the currency series mixes annual and cumulative counts.",
  },
  {
    id: "gold-reserves",
    datasetPt: "Reservas de ouro (2015–2025) e ouro como % das reservas (2025)",
    datasetEn: "Gold reserves (2015–2025) and gold as % of reserves (2025)",
    location: "goldOilData.ts › goldReserves, goldShare",
    status: "corrected",
    previous: "2025: China 2353, Russia 2333, India 901, Brazil 270, Turkey 765, Poland 516",
    evidence: [{ claim: "Q4 2025 tonnes: China 2306.3, Russia 2326.5, India 880.3, Brazil 172.4, Türkiye 614.3, Poland 550.2", value: "2306.3/2326.5/880.3/172.4/614.3/550.2", publisher: "World Gold Council — Quarterly time series on world official gold reserves (IMF IFS data), updated Sep 2026", url: "https://www.gold.org/goldhub/data/gold-reserves-by-country", publishedAt: "2026-09-30" }],
    notePt: "Série inteira (fim de cada ano, 2015–2025) refeita com uma única fonte. A maior divergência era o Brasil (270 t no repositório vs. 172,4 t). A Turquia segue o ajuste técnico documentado pelo WGC (https://www.gold.org/download/file/16208/Central-bank-stats-methodology-technical-adjustments.pdf), por isso difere de números divulgados localmente. A Rússia saiu da tabela de % das reservas porque o WGC não publica o total russo.",
    noteEn: "Whole series (each year-end, 2015–2025) rebuilt from a single source. The largest discrepancy was Brazil (270t in the repository vs. 172.4t). Türkiye follows the technical adjustment documented by the WGC (https://www.gold.org/download/file/16208/Central-bank-stats-methodology-technical-adjustments.pdf), hence it differs from figures published locally. Russia was dropped from the % of reserves table because the WGC does not publish Russia's total.",
  },

  {
    id: "country-debt",
    datasetPt: "Composição da dívida por moeda e dívida/PIB (exceto Brasil)",
    datasetEn: "Debt composition by currency and debt/GDP (except Brazil)",
    location: "lcBondsData.ts › countryDebtData",
    status: "unverified",
    evidence: [],
    notePt: "Sem fonte por ponto; referências heterogêneas (Índia com dado de 2018). Refazer com FMI (WEO/GFS) e BIS.",
    noteEn: "No per-point source; heterogeneous references (India uses 2018 data). Rebuild from IMF (WEO/GFS) and BIS.",
  },
  // ── Dados abertos coletados por código (PR 2c) ──────────────
  {
    id: "yield-differential",
    datasetPt: "Diferencial de juros soberanos de 10 anos vs EUA (pb)",
    datasetEn: "10-year sovereign yield differential vs US (bps)",
    location: "src/data/generated/open-markets.json › yieldDifferential",
    status: "verified",
    evidence: [
      { claim: "OECD MEI 10-year yield, Mexico, latest month 2026-08: 9.16% vs US 4.68% → 448 bps", value: "448", publisher: "OECD Main Economic Indicators via FRED (IRLTLT01MXM156N)", url: "https://fred.stlouisfed.org/series/IRLTLT01MXM156N", publishedAt: "2026-10-01" },
      { claim: "OECD MEI 10-year yield, India, latest month 2026-07: 6.78% vs US 4.6% → 218 bps", value: "218", publisher: "OECD Main Economic Indicators via FRED (INDIRLTLT01STM)", url: "https://fred.stlouisfed.org/series/INDIRLTLT01STM", publishedAt: "2026-10-01" },
      { claim: "OECD MEI 10-year yield, South Africa, latest month 2026-08: 8.75% vs US 4.68% → 407 bps", value: "407", publisher: "OECD Main Economic Indicators via FRED (IRLTLT01ZAM156N)", url: "https://fred.stlouisfed.org/series/IRLTLT01ZAM156N", publishedAt: "2026-10-01" },
      { claim: "OECD MEI 10-year yield, Chile, latest month 2026-07: 5.55% vs US 4.6% → 95 bps", value: "95", publisher: "OECD Main Economic Indicators via FRED (IRLTLT01CLM156N)", url: "https://fred.stlouisfed.org/series/IRLTLT01CLM156N", publishedAt: "2026-10-01" },
    ],
    notePt: "Coletado por scripts/fetch-open-markets.mjs (OCDE MEI via FRED) e derivado (país − EUA). Nova métrica com nome próprio; não substitui o spread EMBI. Brasil, China, Rússia, Colômbia e Argentina ficam em lacunas (sem série aberta compatível).",
    noteEn: "Collected by scripts/fetch-open-markets.mjs (OECD MEI via FRED) and derived (country − US). A new metric under its own name; it does not replace the EMBI spread. Brazil, China, Russia, Colombia and Argentina are listed as gaps (no compatible open series).",
  },
  {
    id: "fx-volatility",
    datasetPt: "Volatilidade cambial anualizada (%)",
    datasetEn: "Annualized FX volatility (%)",
    location: "src/data/generated/open-markets.json › fxVolatility",
    status: "verified",
    evidence: [
      { claim: "BRL annualized volatility 2025 from daily Brazilian Reals to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)", value: "11", publisher: "Federal Reserve H.10 via FRED", url: "https://fred.stlouisfed.org/series/DEXBZUS", publishedAt: "2026-10-01" },
      { claim: "MXN annualized volatility 2025 from daily Mexican Pesos to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)", value: "9.5", publisher: "Federal Reserve H.10 via FRED", url: "https://fred.stlouisfed.org/series/DEXMXUS", publishedAt: "2026-10-01" },
      { claim: "INR annualized volatility 2025 from daily Indian Rupees to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)", value: "4.6", publisher: "Federal Reserve H.10 via FRED", url: "https://fred.stlouisfed.org/series/DEXINUS", publishedAt: "2026-10-01" },
      { claim: "CNY annualized volatility 2025 from daily Chinese Yuan Renminbi to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)", value: "2.6", publisher: "Federal Reserve H.10 via FRED", url: "https://fred.stlouisfed.org/series/DEXCHUS", publishedAt: "2026-10-01" },
      { claim: "ZAR annualized volatility 2025 from daily South African Rand to U.S. Dollar Spot Exchange Rate (Federal Reserve H.10)", value: "10.1", publisher: "Federal Reserve H.10 via FRED", url: "https://fred.stlouisfed.org/series/DEXSFUS", publishedAt: "2026-10-01" },
      { claim: "COP annualized volatility 2025 from daily Tasa Representativa del Mercado (TRM), COP por US$", value: "11.7", publisher: "Banco de la Rep\u00fablica \u2014 TRM (datos.gov.co)", url: "https://www.datos.gov.co/d/32sa-8pi3", publishedAt: "2026-10-01" },
    ],
    notePt: "Derivada do câmbio diário público (desvio-padrão dos retornos logarítmicos × √252). ARS, RUB, TRY e IDR ficam em lacunas.",
    noteEn: "Derived from public daily FX (std. dev. of log returns × √252). ARS, RUB, TRY and IDR are listed as gaps.",
  },
  {
    id: "oil-eia",
    datasetPt: "Médias anuais de Brent e WTI",
    datasetEn: "Brent and WTI annual averages",
    location: "src/data/generated/open-markets.json › oil",
    status: "verified",
    evidence: [
      { claim: "BRENT annual average 2025 from EIA daily spot", value: "69.14", publisher: "U.S. EIA via FRED (DCOILBRENTEU)", url: "https://fred.stlouisfed.org/series/DCOILBRENTEU", publishedAt: "2026-10-01" },
      { claim: "WTI annual average 2025 from EIA daily spot", value: "65.39", publisher: "U.S. EIA via FRED (DCOILWTICO)", url: "https://fred.stlouisfed.org/series/DCOILWTICO", publishedAt: "2026-10-01" },
    ],
    notePt: "Médias dos preços spot diários da EIA (via FRED), calculadas pelo ODIN.",
    noteEn: "Averages of EIA daily spot prices (via FRED), computed by ODIN.",
  },

  // ── Retirados da interface (PR 2c) ──────────────────────────
  {
    id: "spreads",
    datasetPt: "Spreads soberanos atribuídos ao Bloomberg",
    datasetEn: "Sovereign spreads attributed to Bloomberg",
    location: "removido (lcBondsData.ts › spreadsData)",
    status: "retired",
    evidence: [],
    notePt: "Fonte paga e sem metodologia registrada; os valores misturavam definições (ex.: Argentina 5.800 pb, típico de spread em dólar). Sem equivalente aberto da mesma definição: a série saiu. Em seu lugar entra uma métrica diferente, com nome próprio: diferencial de juros soberanos de 10 anos (OCDE).",
    noteEn: "Paid source with no recorded methodology; values mixed definitions (e.g. Argentina 5,800 bps, typical of a dollar spread). No open equivalent with the same definition: the series was removed. A different metric under its own name replaces it: 10-year sovereign yield differential (OECD).",
  },
  {
    id: "volatility",
    datasetPt: "Volatilidade cambial \"2025e\" atribuída ao Bloomberg",
    datasetEn: "\"2025e\" FX volatility attributed to Bloomberg",
    location: "removido (lcBondsData.ts › volatilityData, volatilityDetails, volatilityRanking)",
    status: "retired",
    evidence: [],
    notePt: "Estimativas sem método. Substituída pela volatilidade calculada do câmbio diário público (mesma grandeza, método explícito).",
    noteEn: "Estimates without a method. Replaced by volatility computed from public daily FX (same quantity, explicit method).",
  },
  {
    id: "stability",
    datasetPt: "Score de estabilidade",
    datasetEn: "Stability score",
    location: "removido (lcBondsData.ts › stabilityScores; StabilityScatter.tsx; Camadas; filtro regional)",
    status: "retired",
    evidence: [],
    notePt: "Número curado sem fórmula reproduzível. Removido da interface, das camadas, do filtro regional e dos testes até existir um índice ODIN com fórmula, componentes, pesos e fontes publicados.",
    noteEn: "Curated number with no reproducible formula. Removed from the UI, layers, regional filter and tests until an ODIN index with a published formula, components, weights and sources exists.",
  },
  {
    id: "oil-bricsplus",
    datasetPt: "Produção BRICS+ e volume em petroyuan",
    datasetEn: "BRICS+ production and petroyuan volume",
    location: "removido (goldOilData.ts › oilData)",
    status: "retired",
    evidence: [],
    notePt: "Sem série aberta compatível e sem chave de API: saiu do gráfico.",
    noteEn: "No compatible open series without an API key: removed from the chart.",
  },
  {
    id: "oil-prices",
    datasetPt: "Médias de Brent e WTI atribuídas ao Bloomberg",
    datasetEn: "Brent and WTI averages attributed to Bloomberg",
    location: "removido (goldOilData.ts › oilData)",
    status: "retired",
    evidence: [],
    notePt: "Substituídas pelas médias da EIA (registro oil-eia). Ex.: Brent 2025 era 74,5; pela EIA, 69,14.",
    noteEn: "Replaced by EIA averages (entry oil-eia). E.g. Brent 2025 was 74.5; per the EIA, 69.14.",
  },
];

const byId = new Map(DATA_AUDIT.map((e) => [e.id, e]));

export function auditEntry(id: string): AuditEntry | undefined {
  return byId.get(id);
}

/** Verdadeiro para dados sem verificação oficial ou com substituição pendente. */
export function isUnverified(id: string): boolean {
  const s = byId.get(id)?.status;
  return s === "unverified";
}
