// ============================================================
// i18n — ODIN Dashboard (PT-BR / EN)
// ============================================================

export type Locale = "pt" | "en";

let current: Locale = "pt";
const listeners = new Set<() => void>();

export function getLocale(): Locale { return current; }
export function toggleLocale() {
  current = current === "pt" ? "en" : "pt";
  listeners.forEach((fn) => fn());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

const pt = {
  nav: { brand: "ODIN", subtitle: "BRICS+ Financial Intelligence" },
  context: {
    label: "CONTEXTO",
    text: "Dashboard desenvolvido para acompanhar o vetor financeiro do BRICS+, com foco em títulos em moeda local (LC Bonds), fluxos de capital e estabilidade macro. Dados de fontes primárias (BIS, ADB, OMFIF, Banco Central do Brasil) com metodologia documentada.",
  },
  ticker: { label: "BRICS+ FINANCE" },
  hero: {
    title: "BRICS+ LOCAL CURRENCY BONDS",
    subtitle: "Monitoramento em tempo real do mercado de títulos soberanos em moedas locais do bloco — spreads, volatilidade, composição de dívida e vetores de estabilidade.",
    kpi1: "LC Bonds Outstanding", kpi2: "Cobertura BRICS+", kpi3: "Moedas Monitoradas", kpi4: "Fontes Primárias",
    filterLabel: "Filtrar por região:",
  },
  brazil: {
    title: "BRASIL SPOTLIGHT",
    subtitle: "Posição do Brasil no vetor de moedas locais — destaque para títulos prefixados, integração com o sistema financeiro asiático e resiliência cambial.",
    item1: "NTN-F e LTN: liquidez crescente no mercado secundário",
    item2: "PTAX (Banco Central) como referência de câmbio — dado ao vivo abaixo",
    item3: "Integração CIPS-BRICS: acordos de swap com China (R$ 157 bilhões)",
    item4: "Reservas internacionais: US$ 330+ bilhões (5º maior do mundo)",
    ptaxTitle: "PTAX / USD-BRL (Banco Central — PTAX)",
  },
  market: {
    title: "MARKET SIZE: LC BONDS $27.4T",
    subtitle: "Evolução do estoque total de títulos em moeda local no BRICS+ (US$ trilhões). Fonte: BIS Debt Securities Statistics + ADB AsianBondsOnline.",
    yLabel: "US$ trilhões",
  },
  spreads: {
    title: "SPREADS SOBERANOS (bp)",
    subtitle: "Spreads de títulos soberanos em moeda local vs. benchmark (UST 10Y para USD, CGB para CNY). Pontos-base (bp) — quanto maior, mais risco percebido.",
    country: "País", bond: "Título", spread: "Spread (bp)", yield: "Yield (%)", change: "Δ 30d (bp)",
  },
  volatility: {
    title: "VOLATILIDADE: LC BONDS vs UST vs BUND",
    subtitle: "Volatilidade anualizada (30d rolling, % ao ano). Fonte: cálculo próprio sobre séries BIS/ADB. Linha tracejada = média do período.",
    yLabel: "Volatilidade (% a.a.)",
  },
  tcx: {
    title: "TCX — THE CURRENCY EXCHANGE FUND",
    subtitle: "Cobertura cambial (hedge) via TCX para investidores em moedas de mercados emergentes. Índice de custo de hedge (basis points anuais).",
    yLabel: "Custo de Hedge (bp a.a.)",
  },
  debt: {
    title: "COMPOSIÇÃO DA DÍVIDA: LC vs FC",
    subtitle: "Percentual da dívida soberana denominada em moeda local (LC) vs. moeda estrangeira (FC). Maior LC = menor vulnerabilidade cambial.",
    lcLabel: "Moeda Local (%)", fcLabel: "Moeda Estrangeira (%)",
  },
  stability: {
    title: "STABILITY MAP: RISCO vs LIQUIDEZ",
    subtitle: "Dispersão de países BRICS+ em dois eixos: risco soberano (spread, eixo Y) e liquidez de mercado (bid-ask spread, eixo X). Quadrante inferior-esquerdo = mais estável.",
    xLabel: "Liquidez (bid-ask bp)", yLabel: "Risco (spread bp)",
  },
  gold: {
    title: "GOLD RESERVES: ACUMULAÇÃO BRICS+",
    subtitle: "Reservas oficiais de ouro (toneladas) — Banco Central do Brasil, China, Rússia, Índia. Fonte: World Gold Council / OMFIF.",
    yLabel: "Toneladas",
  },
  oil: {
    title: "OIL VECTOR: PETRÓLEO E O CICLO DE COMMODITIES",
    subtitle: "Preço do Brent (US$/bbl) vs. produção OPEC+ (MMbbl/dia). Vetor crítico para exportadores BRICS+ (Brasil, Rússia, Arábia Saudita).",
    brentLabel: "Brent (US$/bbl)", opecLabel: "OPEC+ Prod. (MMbbl/d)",
  },
  climate: {
    title: "CLIMATE VECTOR: ANOMALIAS TÉCNICAS E RISCO CLIMÁTICO",
    subtitle: "Anomalias de temperatura (°C vs. média 1991-2020) e índice composto de risco climático. Dados: Open-Meteo (ERA5) + NASA POWER, ao vivo.",
    yLabelTemp: "Anomalia Temp. (°C)", yLabelRisk: "Índice de Risco (0-10)",
    stationsTitle: "Estações monitoradas",
  },
  carbon: {
    title: "PRECIFICAÇÃO DE CARBONO E CBAM: O PREÇO DO CARBONO NA FRONTEIRA EUROPEIA",
    subtitle: "CBAM (Carbon Border Adjustment Mechanism — Mecanismo de Ajuste de Carbono na Fronteira) em regime definitivo desde 01/01/2026. O preço do certificado segue a média dos leilões do EU ETS (EU Emissions Trading System — Sistema de Comércio de Emissões da União Europeia): trimestral em 2026, semanal a partir de 2027.",
    kpiCert: "Certificado CBAM (€/tCO₂e)", kpiThreshold: "Isenção de minimis", kpiSectors: "Setores cobertos", kpiSectorsNote: "expansão downstream em 2028", kpiSurrender: "1ª declaração + entrega", kpiSurrenderNote: "referente às importações de 2026",
    certChartTitle: "Preço oficial do certificado CBAM (€/tCO₂e, por trimestre)",
    certPendingNote: "Q3 2026 publica em 05/10/2026; Q4 2026 em 04/01/2027. Fonte: Comissão Europeia (TAXUD).",
    instrumentsTitle: "Precificação de carbono no mundo (USD/tCO₂e, aprox.)", instrumentsNote: "Valores aproximados, snapshot Q2 2026 — verificar World Bank Carbon Pricing Dashboard antes de publicar.", price: "Preço",
    owidTitle: "CO₂ por consumo per capita (t/ano) — o recorte das emissões embutidas no comércio", owidNote: "Emissões por consumo (não territoriais): a base conceitual do CBAM. Fonte: Our World in Data / Global Carbon Project, via snapshot diário.",
    timelineTitle: "Linha do tempo regulatória (Reg. (UE) 2023/956 + 2025/2083)",
    sectorsTitle: "Setores no escopo do CBAM",
    brazilTitle: "RECORTE BRASIL",
    brazilText: "Exportadores brasileiros de aço, alumínio, cimento e fertilizantes passam a responder pelo carbono embutido ao vender para a União Europeia. Preço de carbono pago na origem é dedutível: o SBCE (Sistema Brasileiro de Comércio de Emissões — Lei 15.042/2024), quando operacional, pode reduzir o custo do CBAM para a indústria nacional.",
    source: "Fonte",
  },
  blockchain: {
    title: "BLOCKCHAIN E ATIVOS DIGITAIS: MERCADO, ON-CHAIN E RWAs",
    subtitle: "Stablecoins como trilhos digitais do dólar americano (o contrafluxo da narrativa das Moedas Locais), protocolos RWA (Real World Assets — ativos do mundo real tokenizados) por TVL (Total Value Locked — valor total bloqueado) e o elo com o carbono tokenizado.",
    kpiStables: "Stablecoins — valor de mercado", kpiFee: "Taxa prioritária BTC",
    stablesTitle: "Maiores stablecoins por valor de mercado (USD)", stablesNote: "Snapshot diário via DefiLlama Stablecoins API (sem chave). USDT + USDC ≈ 90% do mercado.",
    rwaTitle: "Protocolos RWA por TVL (USD)", rwaNote: "RWA (Real World Assets): títulos, fundos e commodities tokenizados. Fonte: DefiLlama Protocols API.", mcap: "Valor de mercado",
    tokenTitle: "CARBONO TOKENIZADO (ponte com a seção anterior)",
    tokenText: "Toucan Protocol e KlimaDAO levaram créditos de carbono on-chain em 2021-22; o setor encolheu após o hype, mas segue como infraestrutura experimental para um mercado de carbono programável — relevante se o SBCE e o CBAM evoluírem para trilhos digitais.",
    thesis: "ENQUADRAMENTO: enquanto o BRICS+ constrói trilhos de Moeda Local (CIPS, NDB, Panda Bonds), as stablecoins de dólar processam volumes recordes — a digitalização, paradoxalmente, reforça o USD. Ler esta seção junto com as seções 5-7 é ler a disputa monetária do século em dois trilhos simultâneos.",
    source: "Fonte",
  },
  sourceOverlay: { title: "Fonte Primária", methodology: "Metodologia de Cálculo", lastUpdated: "Atualizado em", close: "Fechar" },
  embed: { title: "Embed / Compartilhar", description: "Copie o snippet abaixo para incorporar esta seção.", copy: "Copiar", copied: "Copiado!", close: "Fechar" },
  footer: {
    line1: "ODIN Dashboard — BRICS+ Financial Intelligence",
    line2: "Dados de fontes primárias com metodologia documentada. Não constitui recomendação de investimento.",
    line3: "Desenvolvido por Hubstry Deep Tech",
  },
};

export type T = typeof pt;

const en: T = {
  nav: { brand: "ODIN", subtitle: "BRICS+ Financial Intelligence" },
  context: {
    label: "CONTEXT",
    text: "Dashboard built to track the BRICS+ financial vector, focusing on local currency bonds (LC Bonds), capital flows and macro stability. Data from primary sources (BIS, ADB, OMFIF, Central Bank of Brazil) with documented methodology.",
  },
  ticker: { label: "BRICS+ FINANCE" },
  hero: {
    title: "BRICS+ LOCAL CURRENCY BONDS",
    subtitle: "Real-time monitoring of the bloc's sovereign local-currency bond market — spreads, volatility, debt composition and stability vectors.",
    kpi1: "LC Bonds Outstanding", kpi2: "BRICS+ Coverage", kpi3: "Tracked Currencies", kpi4: "Primary Sources",
    filterLabel: "Filter by region:",
  },
  brazil: {
    title: "BRAZIL SPOTLIGHT",
    subtitle: "Brazil's position in the local currency vector — highlighting fixed-rate bonds, integration with the Asian financial system and FX resilience.",
    item1: "NTN-F and LTN: growing secondary market liquidity",
    item2: "PTAX (Central Bank) as FX reference — live data below",
    item3: "CIPS-BRICS integration: swap agreements with China (BRL 157 billion)",
    item4: "International reserves: USD 330+ billion (5th largest worldwide)",
    ptaxTitle: "PTAX / USD-BRL (Central Bank — PTAX)",
  },
  market: {
    title: "MARKET SIZE: LC BONDS $27.4T",
    subtitle: "Total outstanding local-currency bonds in BRICS+ (USD trillions). Source: BIS Debt Securities Statistics + ADB AsianBondsOnline.",
    yLabel: "USD trillions",
  },
  spreads: {
    title: "SOVEREIGN SPREADS (bp)",
    subtitle: "Local-currency sovereign bond spreads vs. benchmark (UST 10Y for USD, CGB for CNY). Basis points (bp) — higher means more perceived risk.",
    country: "Country", bond: "Bond", spread: "Spread (bp)", yield: "Yield (%)", change: "Δ 30d (bp)",
  },
  volatility: {
    title: "VOLATILITY: LC BONDS vs UST vs BUND",
    subtitle: "Annualized volatility (30d rolling, % per year). Source: own calculation on BIS/ADB series. Dashed line = period average.",
    yLabel: "Volatility (% p.a.)",
  },
  tcx: {
    title: "TCX — THE CURRENCY EXCHANGE FUND",
    subtitle: "Currency hedging via TCX for investors in emerging market currencies. Hedge cost index (annual basis points).",
    yLabel: "Hedge Cost (bp p.a.)",
  },
  debt: {
    title: "DEBT COMPOSITION: LC vs FC",
    subtitle: "Share of sovereign debt denominated in local currency (LC) vs. foreign currency (FC). Higher LC = lower FX vulnerability.",
    lcLabel: "Local Currency (%)", fcLabel: "Foreign Currency (%)",
  },
  stability: {
    title: "STABILITY MAP: RISK vs LIQUIDITY",
    subtitle: "BRICS+ countries scattered across two axes: sovereign risk (spread, Y axis) and market liquidity (bid-ask spread, X axis). Lower-left quadrant = most stable.",
    xLabel: "Liquidity (bid-ask bp)", yLabel: "Risk (spread bp)",
  },
  gold: {
    title: "GOLD RESERVES: BRICS+ ACCUMULATION",
    subtitle: "Official gold reserves (tonnes) — Central Bank of Brazil, China, Russia, India. Source: World Gold Council / OMFIF.",
    yLabel: "Tonnes",
  },
  oil: {
    title: "OIL VECTOR: OIL AND THE COMMODITY CYCLE",
    subtitle: "Brent price (USD/bbl) vs. OPEC+ production (MMbbl/day). Critical vector for BRICS+ exporters (Brazil, Russia, Saudi Arabia).",
    brentLabel: "Brent (USD/bbl)", opecLabel: "OPEC+ Prod. (MMbbl/d)",
  },
  climate: {
    title: "CLIMATE VECTOR: TECHNICAL ANOMALIES AND CLIMATE RISK",
    subtitle: "Temperature anomalies (°C vs. 1991-2020 average) and composite climate risk index. Data: Open-Meteo (ERA5) + NASA POWER, live.",
    yLabelTemp: "Temp. Anomaly (°C)", yLabelRisk: "Risk Index (0-10)",
    stationsTitle: "Monitored stations",
  },
  carbon: {
    title: "CARBON PRICING & CBAM: THE PRICE OF CARBON AT THE EUROPEAN BORDER",
    subtitle: "CBAM (Carbon Border Adjustment Mechanism) in its definitive regime since 01/01/2026. The certificate price tracks the EU ETS (EU Emissions Trading System) auction average: quarterly in 2026, weekly from 2027.",
    kpiCert: "CBAM certificate (€/tCO₂e)", kpiThreshold: "De minimis exemption", kpiSectors: "Covered sectors", kpiSectorsNote: "downstream expansion in 2028", kpiSurrender: "1st declaration + surrender", kpiSurrenderNote: "covering 2026 imports",
    certChartTitle: "Official CBAM certificate price (€/tCO₂e, per quarter)",
    certPendingNote: "Q3 2026 publishes on 2026-10-05; Q4 2026 on 2027-01-04. Source: European Commission (TAXUD).",
    instrumentsTitle: "Carbon pricing worldwide (USD/tCO₂e, approx.)", instrumentsNote: "Approximate values, Q2 2026 snapshot — verify against the World Bank Carbon Pricing Dashboard before publishing.", price: "Price",
    owidTitle: "Consumption-based CO₂ per capita (t/year) — the embedded-emissions lens", owidNote: "Consumption-based (not territorial) emissions: the conceptual basis of CBAM. Source: Our World in Data / Global Carbon Project, via daily snapshot.",
    timelineTitle: "Regulatory timeline (Reg. (EU) 2023/956 + 2025/2083)",
    sectorsTitle: "Sectors under CBAM scope",
    brazilTitle: "BRAZIL ANGLE",
    brazilText: "Brazilian exporters of steel, aluminium, cement and fertilisers now answer for embedded carbon when selling to the European Union. Carbon prices paid at origin are deductible: the SBCE (Brazilian Emissions Trading System — Law 15,042/2024), once operational, may reduce the CBAM cost for national industry.",
    source: "Source",
  },
  blockchain: {
    title: "BLOCKCHAIN & DIGITAL ASSETS: MARKET, ON-CHAIN AND RWAs",
    subtitle: "Stablecoins as digital rails for the US dollar (the counterflow to the Local Currencies narrative), RWA (Real World Assets) protocols by TVL (Total Value Locked), and the tokenized-carbon bridge.",
    kpiStables: "Stablecoins — market cap", kpiFee: "BTC priority fee",
    stablesTitle: "Largest stablecoins by market cap (USD)", stablesNote: "Daily snapshot via DefiLlama Stablecoins API (no key). USDT + USDC ≈ 90% of the market.",
    rwaTitle: "RWA protocols by TVL (USD)", rwaNote: "RWA (Real World Assets): tokenized bonds, funds and commodities. Source: DefiLlama Protocols API.", mcap: "Market cap",
    tokenTitle: "TOKENIZED CARBON (bridge to the previous section)",
    tokenText: "Toucan Protocol and KlimaDAO brought carbon credits on-chain in 2021-22; the sector shrank after the hype but remains as experimental infrastructure for a programmable carbon market — relevant if SBCE and CBAM evolve toward digital rails.",
    thesis: "FRAMING: while BRICS+ builds Local Currency rails (CIPS, NDB, Panda Bonds), dollar stablecoins process record volumes — digitalization, paradoxically, reinforces the USD. Reading this section together with sections 5-7 is reading the century's monetary dispute on two simultaneous rails.",
    source: "Source",
  },
  sourceOverlay: { title: "Primary Source", methodology: "Calculation Methodology", lastUpdated: "Last updated", close: "Close" },
  embed: { title: "Embed / Share", description: "Copy the snippet below to embed this section.", copy: "Copy", copied: "Copied!", close: "Close" },
  footer: {
    line1: "ODIN Dashboard — BRICS+ Financial Intelligence",
    line2: "Data from primary sources with documented methodology. Not investment advice.",
    line3: "Built by Hubstry Deep Tech",
  },
};

const dict: Record<Locale, T> = { pt, en };

export function t(key: string): string {
  const parts = key.split(".");
  let obj: unknown = dict[current];
  for (const p of parts) {
    if (obj && typeof obj === "object" && p in (obj as Record<string, unknown>)) {
      obj = (obj as Record<string, unknown>)[p];
    } else {
      return key;
    }
  }
  return typeof obj === "string" ? obj : key;
}
