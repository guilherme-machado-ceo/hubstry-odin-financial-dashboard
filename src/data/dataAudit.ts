// ============================================================
// ODIN — Auditoria das fontes públicas (PR 2a)
// Registro único do estado de verificação de cada dado curado exibido no
// painel. Regra: nenhum valor entra como "verificado" sem URL oficial e data.
//
// status:
//   verified   — confere com a fonte oficial citada
//   corrected  — estava divergente; corrigido neste PR com a fonte citada
//   unverified — sem fonte oficial localizada/acessível; exibido com marcação
//   replace_2c — série de fonte paga ou sem metodologia; será refeita no PR 2c
//
// A interface lê `isUnverified()` para marcar indicadores e KPIs; o teste
// scripts/test-data-audit.mjs confere que os valores do código batem com as
// evidências registradas aqui.
// ============================================================

export type AuditStatus = "verified" | "corrected" | "unverified" | "replace_2c";

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
    evidence: [{ claim: "Official quarterly CBAM certificate prices and timeline", value: "Q1 75.36 / Q2 75.28", publisher: "European Commission — Taxation and Customs Union", url: "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en", publishedAt: "2026-07-06" }],
    notePt: "Governado pelo pipeline de evidências (proveniência SHA-256). Revisão prevista em 2026-10-05.",
    noteEn: "Governed by the evidence pipeline (SHA-256 provenance). Review due 2026-10-05.",
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
  {
    id: "oil-bricsplus",
    datasetPt: "Produção BRICS+ e volume em petroyuan",
    datasetEn: "BRICS+ production and petroyuan volume",
    location: "goldOilData.ts › oilData (bricsProduction, petroyuanVolume)",
    status: "unverified",
    evidence: [],
    notePt: "Sem fonte aberta identificada para petroyuan; será removido no PR 2c se não houver série aberta.",
    noteEn: "No open source identified for petroyuan; will be removed in PR 2c if no open series exists.",
  },

  // ── A substituir no PR 2c ───────────────────────────────────
  {
    id: "spreads",
    datasetPt: "Spreads soberanos",
    datasetEn: "Sovereign spreads",
    location: "lcBondsData.ts › spreadsData",
    status: "replace_2c",
    evidence: [],
    notePt: "Fonte declarada: Bloomberg Terminal (pago), sem metodologia registrada (referência, prazo e data não documentados). Será refeito como \"Spread soberano (pb)\" = juro local 10 anos − Treasury 10 anos (OCDE/FRED).",
    noteEn: "Declared source: Bloomberg Terminal (paid), with no recorded methodology (benchmark, tenor and date undocumented). Will be rebuilt as \"Sovereign spread (bps)\" = local 10y yield − 10y Treasury (OECD/FRED).",
  },
  {
    id: "volatility",
    datasetPt: "Volatilidade cambial",
    datasetEn: "FX volatility",
    location: "lcBondsData.ts › volatilityData, volatilityDetails",
    status: "replace_2c",
    evidence: [],
    notePt: "Sem metodologia registrada. Será calculada a partir de câmbio diário público (BCB, FRED H.10).",
    noteEn: "No recorded methodology. Will be computed from public daily FX (BCB, FRED H.10).",
  },
  {
    id: "stability",
    datasetPt: "Score de estabilidade",
    datasetEn: "Stability score",
    location: "lcBondsData.ts › stabilityScores",
    status: "replace_2c",
    evidence: [],
    notePt: "Número curado sem fórmula. Sai da interface principal no PR 2c até existir um índice ODIN reproduzível.",
    noteEn: "Curated number with no formula. Leaves the main UI in PR 2c until a reproducible ODIN index exists.",
  },
  {
    id: "oil-prices",
    datasetPt: "Médias anuais de Brent e WTI",
    datasetEn: "Brent and WTI annual averages",
    location: "goldOilData.ts › oilData (brent, wti)",
    status: "replace_2c",
    evidence: [],
    notePt: "Atribuídas à Bloomberg. Serão substituídas pela série aberta da EIA.",
    noteEn: "Attributed to Bloomberg. Will be replaced by the open EIA series.",
  },
];

const byId = new Map(DATA_AUDIT.map((e) => [e.id, e]));

export function auditEntry(id: string): AuditEntry | undefined {
  return byId.get(id);
}

/** Verdadeiro para dados sem verificação oficial ou com substituição pendente. */
export function isUnverified(id: string): boolean {
  const s = byId.get(id)?.status;
  return s === "unverified" || s === "replace_2c";
}
