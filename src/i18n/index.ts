// ============================================================
// i18n ENGINE v2.3 — PT / EN / ZH-ready
// DOGMA EDITORIAL: Siglas expandidas na 1a ocorrencia
// Contexto minimo para non-spec-user-friendly
// ============================================================

export type Locale = "pt" | "en" | "zh";

interface T { [k: string]: string | T; }

const contextExplainerPt = `Este dashboard acompanha a transição do sistema financeiro global de um modelo centrado no dólar americano (USD) para um sistema multipolar onde Moedas Locais (ML), ouro e infraestrutura própria (CIPS, NDB, Bond Connect) ganham protagonismo. BRICS = Brasil, Russia, India, China, África do Sul. LATAM = América Latina. Dados de 2015-2025.`;

const contextExplainerEn = `This dashboard tracks the global financial system's transition from a US dollar (USD)-centric model to a multipolar system where Local Currencies (LC), gold, and proprietary infrastructure (CIPS, NDB, Bond Connect) gain prominence. BRICS = Brazil, Russia, India, China, South Africa. LATAM = Latin America. Data from 2015-2025.`;

const pt: T = {
  context: { explainer: contextExplainerPt, tag: "ECONOMIA GEOPOLITICA", readMore: "Entenda o contexto" },
  nav: {
    title: "ODIN: FINANCIAL INTELLIGENCE",
    subtitle: "DASHBOARD BRICS+ — MERCADO DE TITULOS, COMMODITIES E CLIMA",
    toggle: "PT / EN", timeRange: "Período", months12: "12M", years3: "3A", years5: "5A", years10: "10A",
    region: "Região", all: "Todos (BRICS + LATAM)", brics: "BRICS (Brasil, Russia, India, China, África do Sul)", latam: "LATAM (América Latina)",
  },
  hero: {
    headline: "G20 — VOLATILIDADE CAMBIAL: MOEDA LOCAL (ML) vs DOLAR AMERICANO (USD)",
    kpiMarket: "Mercado de LC Bonds (Títulos em Moeda Local)", kpiGrowth: "Crescimento em 10 Anos",
    kpiTrade: "Comércio BRICS em Moeda Local", kpiNDB: "NDB (Novo Banco de Desenvolvimento) — Desembolsos em ML",
    kpiTCX: "TCX (The Currency Exchange Fund) — Hedge Acumulado", kpiCurrencies: "Moedas Cobertas pelo TCX",
    live: "AO VIVO", ptaxLabel: "BRL/USD Ptax (Taxa de Câmbio comercial do BCB)",
    dividaBruta: "Dívida Bruta do Governo Federal (%% do PIB — Produto Interno Bruto)", inflectionTitle: "PONTOS DE VIRADA 2025-2026",
  },
  banner: {
    tag: "CONTEXTO GEOPOLITICO",
    headline: "Brasil emite primeiro Panda Bond soberano em CNY 6 bilhões — Marco na saída do financiamento em USD (Dólar Americano)",
    summary: "Pela primeira vez, o Brasil levanta dívida soberana em yuan chinês (CNY) em vez de dolares (USD). Isso sinaliza uma mudança estrutural: títulos de Moeda Local (ML) substituem instrumentos em dólar, enquanto nações BRICS constroem infraestrutura paralela (CIPS — sistema de pagamentos chinês, NDB — Novo Banco de Desenvolvimento, Bond Connect — conexão entre B3 e bolsa de Xangai).",
    source: "Fonte", date: "Junho 2025",
  },
  news: {
    title: "INTELIGÊNCIA DE MERCADO: NOTICIAS FINANCEIRAS EM TEMPO REAL (RSS)",
    subtitle: "Feeds agregados de fontes globais — Sem chave de API necessária (Google News RSS)",
    readMore: "Ler mais", source: "Fonte", error: "Feed temporariamente indisponível. Usando dados de contingência.",
  },
  climate: {
    title: "VETOR CLIMATICO: ANOMALIAS E RISCOS AMBIENTAIS BRICS+",
    subtitle: "Anomalias de temperatura e precipitação (Open-Meteo — API sem chave) vs. médias históricas. Clima afeta commodities agrícolas, energia e moedas.",
    avgTempAnomaly: "Anomalia Média de Temp.", avgPrecipAnomaly: "Anomalia de Precipitação", highRiskCities: "Cidades em Alto Risco",
    riskScoreTitle: "Índice de Risco Climático (0-100)", tempAnomalyTitle: "Anomalia de Temperatura (°C vs. média histórica)",
    risk: "Risco", tempAnomaly: "Anomalia de Temp.", source: "Fonte: Open-Meteo (dados abertos) / NASA GISS",
    scoreNote: "Score heurístico baseado em referências fixas aproximadas; não corresponde a uma classificação climatológica oficial.",
  },
  section1: {
    title: "BRASIL EM DESTAQUE: PANDA BOND E INFRAESTRUTURA DE MOEDA LOCAL (ML)",
    subtitle: "Ponto de virada 2025-2026 — Por que isso importa? O Brasil está trocando o financiamento em dólar (USD) por yuan (CNY) e reais (BRL), reduzindo risco cambial e dependência do sistema financeiro americano.",
    pandaBond: "Panda Bond Soberano (dívida emitida na China em yuan)",
    cips: "CIPS (Cross-Border Interbank Payment System) — Sistema de pagamentos transfronteiriços da China",
    ndbTarget: "Meta LC do NDB (Novo Banco de Desenvolvimento) para 2026",
    swapLine: "Swap PBOC↔BCB (Banco Central da China ↔ Banco Central do Brasil) — Linha de câmbio entre bancos centrais",
    bondConnect: "Bond Connect Bilateral (conexão entre B3 e bolsa de Xangai CFETS)",
    infographic: "FLUXO: Como funciona o financiamento Brasil-China em Moeda Local",
    flowStep1: "Emissão Panda Bond (B3 / CFETS — China Foreign Exchange Trade System)",
    flowStep2: "Liquidação via CIPS (sistema chinês, sem intermediário em USD)",
    flowStep3: "Conversão CNH (yuan offshore) ↔ BRL (real brasileiro)",
    flowStep4: "Investimento em Infraestrutura (sem exposição ao dólar)",
    flowStep5: "Hedge via TCX (The Currency Exchange Fund) ou NDB",
    readAnalysis: "Leia a análise completa →", embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte Primária", estBadge: "⚠️ est. (valor estimado)", ndbProgress: "Progresso rumo a meta de 30%% em Moeda Local (ML) — NDB 2026",
  },
  section2: {
    title: "TAMANHO DO MERCADO: BRICS + LATAM LC BONDS (TÍTULOS EM MOEDA LOCAL)",
    subtitle: "Evolução 2015-2025 em US$ bilhões — O que são LC Bonds? Títulos de dívida emitidos na moeda do próprio país, não em dólar. Isso protege contra variações cambiais.",
    seriesBrics: "BRICS (Brasil, Russia, India, China, África do Sul)", seriesLatam: "LATAM (América Latina)", seriesTotal: "Total",
    embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte", estBadge: "⚠️ est. (valor estimado)",
  },
  section3: {
    title: "VOLATILIDADE CAMBIAL G20: RANKING 2025e (ESTIMADO)",
    subtitle: "Desvio-padrão anualizado (%%) — O que é volatilidade? Quanto a moeda de um país sobe e desce contra o dólar em um ano. Quanto maior, mais arriscado.",
    embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte", estBadge: "⚠️ est. (estimado, não oficial)", tableTitle: "Volatilidade Anualizada — Dados Oficiais vs. Estimados 2025",
    currency: "Moeda", official: "Oficial (Alpha Vantage — provedor de dados de mercado)", estimated: "2025e (estimativa)",
  },
  section4: {
    title: "TCX (THE CURRENCY EXCHANGE FUND): HEDGING (PROTEÇÃO) DE MOEDA LOCAL",
    subtitle: "Portfolio outstanding (US$ bi) — O que é TCX? Um fundo que protege investidores contra risco de câmbio em mercados emergentes. Cobre 71 moedas.",
    seriesHedged: "Hedge Anual (proteção contratada)", seriesOutstanding: "Portfolio Total (patrimônio sob gestão)", seriesCurrencies: "Número de Moedas Cobertas",
    embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte", estBadge: "⚠️ est. (estimado)",
  },
  section5: {
    title: "COMPOSIÇÃO DA DÍVIDA: MOEDA LOCAL (ML) vs MOEDA ESTRANGEIRA (ME)",
    subtitle: "Estrutura por país (%% da dívida total) — Por que ML é melhor? Dívida em moeda própria não sobe quando o dólar sobe. Dívida em dólar (ME) fica mais cara se a moeda local cai.",
    embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte", estBadge: "⚠️ est. (estimado)", debtToGdp: "Dívida vs. PIB (Produto Interno Bruto)",
    official: "Dado Oficial", estimated: "2025e (estimativa)", vsEst: "vs est.",
  },
  spreads: {
    title: "DIFERENCIAIS DE TAXA (SPREAD) vs VOLATILIDADE CAMBIAL",
    subtitle: "Spread vs USD em basis points (bps — 1 bps = 0.01%%) e volatilidade FX anualizada (%%) — O que é spread? A diferença de juros que um país paga vs. os EUA. Quanto maior, mais caro é o dinheiro.",
    country: "País", spread2025e: "Spread 2025e (bps)", trend: "Tendência do Spread", volatility: "Volatilidade FX (%%)",
    reducing: "Reduzindo (ficando mais barato)", stable: "Estável", widening: "Ampliando (ficando mais caro)",
    embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte", estBadge: "⚠️ est. (estimado)", fxLabel: "FX = Foreign Exchange (câmbio internacional)",
  },
  stability: {
    title: "GANHO DE ESTABILIDADE ECONÔMICA vs PARTICIPAÇÃO DE DÍVIDA EM MOEDA LOCAL",
    subtitle: "Score composto de estabilidade (0-100) vs. %% da dívida em ML — Países com mais dívida em moeda própria tendem a ser mais estáveis economicamente.",
    xAxis: "Participação de Dívida em Moeda Local (ML) — 2025e", yAxis: "Score de Estabilidade Econômica (0-100)",
    embedLabel: "Embed", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte", estBadge: "⚠️ est. (estimado)",
  },
  gold: {
    title: "RESERVAS DE OURO: A ÂNCORA ANTI-DÓLAR DOS BRICS+",
    subtitle: "Toneladas de ouro em reservas oficiais (2015-2025) — Por que ouro importa? Ouro é dinheiro real que nenhum país pode imprimir. BRICS+ estão acumulando ouro para reduzir dependência do dólar (USD).",
    seriesChina: "China (PBOC — Banco Central da China)", seriesRussia: "Russia (Banco Central da Russia)",
    seriesIndia: "India (RBI — Reserve Bank of India)", seriesBrazil: "Brasil (BCB — Banco Central do Brasil)",
    seriesTurkey: "Turquia (CBRT — Banco Central da Turquia)", seriesPoland: "Polônia (NBP — Banco Central da Polônia, parceiro — não membro BRICS)",
    embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte: World Gold Council (WGC — Conselho Mundial do Ouro) / IMF COFER", estBadge: "⚠️ est. (estimado)",
  },
  goldShare: { title: "OURO COMO %% DAS RESERVAS TOTAIS (2025)", subtitle: "Quanto do cofre de cada país está em ouro vs. dólares, euros, etc. — Quanto maior o %% em ouro, menos dependência do dólar.", country: "País", goldPct: "Ouro (%% das reservas)" },
  oil: {
    title: "VETOR PETRÓLEO: PREÇO E PRODUÇÃO BRICS+",
    subtitle: "Brent (US$/barril) e produção BRICS+ (milhões de barris/dia) — Petróleo é a commodity mais negociada do mundo. Se o preço sobe, moedas de exportadores (como o BRL) tendem a valorizar.",
    seriesBrent: "Brent (referência internacional de petróleo)", seriesWTI: "WTI (West Texas Intermediate — referência americana)",
    seriesProduction: "Produção BRICS+ (milhões de barris/dia)", seriesPetroyuan: "Petroyuan (US$ bi negociados em yuan na Shanghai INE — Bolsa de Xangai)",
    embedLabel: "Incorporar", exportPNG: "Exportar PNG", exportPDF: "Exportar PDF", exportJSON: "Exportar JSON",
    source: "Fonte: EIA (Energy Information Administration — Departamento de Energia dos EUA) / OPEC / Shanghai INE", estBadge: "⚠️ est. (estimado)",
  },
  carbon: {
    title: "PRECIFICAÇÃO DE CARBONO E CBAM: O PREÇO DO CARBONO NA FRONTEIRA EUROPEIA",
    subtitle: "CBAM (Carbon Border Adjustment Mechanism — Mecanismo de Ajuste de Carbono na Fronteira) em regime definitivo desde 01/01/2026. O preço do certificado segue a média dos leilões do EU ETS (EU Emissions Trading System — Sistema de Comércio de Emissões da União Europeia): trimestral em 2026, semanal a partir de 2027.",
    badgeOfficial: "DADO OFICIAL — Q2 2026 · última publicação da Comissão Europeia: 06/07/2026",
    badgeSnapshot: "snapshot OWID",
    kpiCert: "Certificado CBAM (€/tCO₂e)", kpiThreshold: "Isenção de minimis", kpiSectors: "Setores cobertos", kpiSectorsNote: "expansão downstream em 2028", kpiSurrender: "1ª declaração + entrega", kpiSurrenderNote: "referente às importações de 2026",
    certChartTitle: "Preço oficial do certificado CBAM (€/tCO₂e, por trimestre)",
    certPendingNote: "Q3 2026 publica em 05/10/2026; Q4 2026 em 04/01/2027. Fonte: Comissão Europeia (TAXUD).",
    instrumentsTitle: "Precificação de carbono no mundo (USD/tCO₂e, aprox.)", instrumentsNote: "Valores aproximados, snapshot Q2 2026 — verificar World Bank Carbon Pricing Dashboard antes de publicar.", price: "Preço",
    owidTitle: "CO₂ por consumo per capita (t/ano) — o recorte das emissões embutidas no comércio", owidNote: "Emissões por consumo (não territoriais): a base conceitual do CBAM. Fonte: Our World in Data / Global Carbon Project, via snapshot diário.",
    timelineTitle: "Linha do tempo regulatória (Reg. (UE) 2023/956 + 2025/2083)",
    sectorsTitle: "Setores no escopo do CBAM",
    brazilTitle: "RECORTE BRASIL",
    brazilText: "Quem responde às obrigações do CBAM é o importador autorizado na União Europeia (o declarante CBAM). Exportadores brasileiros de produtos cobertos serão pressionados a fornecer dados verificáveis sobre as emissões embutidas, com efeitos contratuais, financeiros e competitivos. Um preço de carbono efetivamente pago no Brasil pode ser abatido da obrigação — desde que elegível, comprovado e reconhecido conforme a metodologia europeia. O SBCE (Sistema Brasileiro de Comércio de Emissões — Lei 15.042/2024), quando operacional, pode criar essa possibilidade, mas não assegura dedução automática.",
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
  insight: {
    badge: "IA assistida · não revisado por analista",
    dataOf: "Dados de", generatedAt: "Gerado em",
    confidence: "Confiança", data: "dados", interpretation: "interpretação",
    levelHigh: "alta", levelMedium: "média", levelLow: "baixa",
    stale: "Dados potencialmente desatualizados; interpretação pode não refletir o snapshot mais recente.",
    preserved: "Texto preservado de geração anterior (última atualização falhou).",
  },
  sourceOverlay: { title: "Fonte Primária", methodology: "Metodologia de Cálculo", lastUpdated: "Atualizado em", close: "Fechar" },
  embedOverlay: { title: "Widget de Incorporação (Embed)", description: "Copie o código abaixo para incorporar esta seção em seu site ou post:", copy: "Copiar", copied: "Copiado!", close: "Fechar" },
  footer: {
    compiledBy: "Compilado por", hubstry: "Hubstry Deep Tech", overall: "Overall 720°",
    snapshot: "edição 2026.07 · dados estáticos: Q2 2026 · snapshots diários via APIs abertas",
    sources: "Fontes Primárias", disclaimer: "Valores aproximados. Verificar contra fontes primárias antes de publicar ou tomar decisão de investimento. Este dashboard é para fins educativos e de análise geopolítica, não constitui recomendação financeira.",
  },
  brazilSticky: {
    label: "BRASIL EM DESTAQUE", lcDebt: "Dívida em Moeda Local (ML — %% do total)", fcDebt: "Dívida em Moeda Estrangeira (ME — %% do total)",
    trend: "Tendência 2015→2025", improving: "Melhorando", stable: "Estável", concerning: "Preocupante",
  },
};

const en: T = {
  context: { explainer: contextExplainerEn, tag: "GEOPOLITICAL ECONOMY", readMore: "Understand the context" },
  nav: {
    title: "ODIN: FINANCIAL INTELLIGENCE",
    subtitle: "BRICS+ DASHBOARD — BOND MARKET, COMMODITIES & CLIMATE",
    toggle: "EN / PT", timeRange: "Time Range", months12: "12M", years3: "3Y", years5: "5Y", years10: "10Y",
    region: "Region", all: "All (BRICS + LATAM)", brics: "BRICS (Brazil, Russia, India, China, South Africa)", latam: "LATAM (Latin America)",
  },
  hero: {
    headline: "G20 — CURRENCY VOLATILITY: LOCAL CURRENCY (LC) vs US DOLLAR (USD)",
    kpiMarket: "LC Bond Market (Local Currency Denominated Debt)", kpiGrowth: "10-Year Growth",
    kpiTrade: "BRICS LC Trade Share", kpiNDB: "NDB (New Development Bank) LC Disbursements",
    kpiTCX: "TCX (The Currency Exchange Fund) Cumulative Hedge", kpiCurrencies: "TCX Covered Currencies",
    live: "LIVE", ptaxLabel: "BRL/USD Ptax (BCB Commercial Exchange Rate)",
    dividaBruta: "Federal Gross Debt (%% of GDP — Gross Domestic Product)", inflectionTitle: "2025-2026 INFLECTION POINTS",
  },
  banner: {
    tag: "GEOPOLITICAL CONTEXT",
    headline: "Brazil Issues First Sovereign Panda Bond in CNY 6 Billion — Landmark Shift from USD (US Dollar) Financing",
    summary: "For the first time, Brazil raises sovereign debt denominated in Chinese yuan (CNY) rather than US dollars (USD). This signals a structural shift in emerging market financing: Local Currency (LC) bonds are replacing dollar-denominated instruments as BRICS nations build parallel financial infrastructure (CIPS — Chinese payment system, NDB — New Development Bank, Bond Connect — B3-Shanghai Stock Exchange link).",
    source: "Source", date: "June 2025",
  },
  news: {
    title: "MARKET INTELLIGENCE: REAL-TIME FINANCIAL NEWS (RSS)",
    subtitle: "Aggregated feeds from global sources — No API key required (Google News RSS)",
    readMore: "Read more", source: "Source", error: "Feed temporarily unavailable. Using fallback data.",
  },
  climate: {
    title: "CLIMATE VECTOR: ANOMALIES & ENVIRONMENTAL RISKS BRICS+",
    subtitle: "Temperature and precipitation anomalies (Open-Meteo — keyless API) vs. historical averages. Climate affects agricultural commodities, energy, and currencies.",
    avgTempAnomaly: "Avg. Temp. Anomaly", precipAnomaly: "Precip. Anomaly", avgPrecipAnomaly: "Precip. Anomaly", highRiskCities: "High Risk Cities",
    riskScoreTitle: "Climate Risk Index (0-100)", tempAnomalyTitle: "Temperature Anomaly (°C vs. historical avg.)",
    risk: "Risk", tempAnomaly: "Temp. Anomaly", source: "Source: Open-Meteo (open data) / NASA GISS",
    scoreNote: "Heuristic score based on approximate fixed references; not an official climatological classification.",
  },
  section1: {
    title: "BRAZIL SPOTLIGHT: PANDA BOND & LOCAL CURRENCY (LC) INFRASTRUCTURE",
    subtitle: "2025-2026 Inflection Point — Why does this matter? Brazil is switching from dollar (USD) financing to yuan (CNY) and reals (BRL), reducing currency risk and dependence on the US financial system.",
    pandaBond: "Sovereign Panda Bond (debt issued in China in yuan)",
    cips: "CIPS (Cross-Border Interbank Payment System) — China's cross-border payment system",
    ndbTarget: "NDB (New Development Bank) LC Target for 2026",
    swapLine: "PBOC↔BCB Swap Line (People's Bank of China ↔ Banco Central do Brasil) — Central bank currency exchange facility",
    bondConnect: "Bilateral Bond Connect (link between B3 and Shanghai CFETS)",
    infographic: "FLOW: How Brazil-China Local Currency Financing Works",
    flowStep1: "Panda Bond Issuance (B3 / CFETS — China Foreign Exchange Trade System)",
    flowStep2: "Settlement via CIPS (Chinese system, no USD intermediary)",
    flowStep3: "CNH (offshore yuan) ↔ BRL (Brazilian real) Conversion",
    flowStep4: "Infrastructure Investment (no dollar exposure)",
    flowStep5: "Hedge via TCX (The Currency Exchange Fund) or NDB",
    readAnalysis: "Read full analysis →", embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Primary Source", estBadge: "⚠️ est. (estimated)", ndbProgress: "Progress toward 30%% Local Currency (LC) Target — NDB 2026",
  },
  section2: {
    title: "MARKET SIZE: BRICS + LATAM LC BONDS (LOCAL CURRENCY DENOMINATED DEBT)",
    subtitle: "2015-2025 Evolution in US$ billions — What are LC Bonds? Debt instruments issued in a country's own currency, not dollars. This protects against currency fluctuations.",
    seriesBrics: "BRICS (Brazil, Russia, India, China, South Africa)", seriesLatam: "LATAM (Latin America)", seriesTotal: "Total",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source", estBadge: "⚠️ est. (estimated)",
  },
  section3: {
    title: "G20 CURRENCY VOLATILITY: 2025e RANKING",
    subtitle: "Annualized standard deviation (%%) — What is volatility? How much a currency rises and falls against the dollar in a year. Higher = riskier.",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source", estBadge: "⚠️ est. (estimated, not official)", tableTitle: "Annualized Volatility — Official Data vs. 2025 Estimates",
    currency: "Currency", official: "Official (Alpha Vantage — market data provider)", estimated: "2025e (estimate)",
  },
  section4: {
    title: "TCX (THE CURRENCY EXCHANGE FUND): LOCAL CURRENCY HEDGING",
    subtitle: "Portfolio outstanding (US$ bn) — What is TCX? A fund that protects investors against currency risk in emerging markets. Covers 71 currencies.",
    seriesHedged: "Annual Hedge (protection contracted)", seriesOutstanding: "Total Portfolio (assets under management)", seriesCurrencies: "Number of Covered Currencies",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source", estBadge: "⚠️ est. (estimated)",
  },
  section5: {
    title: "DEBT COMPOSITION: LOCAL CURRENCY (LC) vs FOREIGN CURRENCY (FX)",
    subtitle: "Structure by country (%% of total debt) — Why LC is better? Debt in your own currency doesn't rise when the dollar rises. Dollar debt (FX) gets more expensive if your currency falls.",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source", estBadge: "⚠️ est. (estimated)", debtToGdp: "Debt-to-GDP (Gross Domestic Product) Ratio",
    official: "Official Data", estimated: "2025e (estimate)", vsEst: "vs est.",
  },
  spreads: {
    title: "RATE SPREADS vs CURRENCY VOLATILITY",
    subtitle: "Spread vs USD in basis points (bps — 1 bps = 0.01%%) and annualized FX volatility (%%) — What is spread? The interest rate difference a country pays vs. the US. Higher = more expensive money.",
    country: "Country", spread2025e: "2025e Spread (bps)", trend: "Spread Trend", volatility: "FX Volatility (%%)",
    reducing: "Reducing (getting cheaper)", stable: "Stable", widening: "Widening (getting more expensive)",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source", estBadge: "⚠️ est. (estimated)", fxLabel: "FX = Foreign Exchange (international currency market)",
  },
  stability: {
    title: "ECONOMIC STABILITY vs LOCAL CURRENCY DEBT SHARE",
    subtitle: "Composite stability score (0-100) vs. %% of debt in LC — Countries with more debt in their own currency tend to be economically more stable.",
    xAxis: "Local Currency (LC) Debt Share — 2025e", yAxis: "Economic Stability Score (0-100)",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source", estBadge: "⚠️ est. (estimated)",
  },
  gold: {
    title: "GOLD RESERVES: THE ANTI-DOLLAR ANCHOR OF BRICS+",
    subtitle: "Official gold holdings in tonnes (2015-2025) — Why gold matters? Gold is real money no country can print. BRICS+ are accumulating gold to reduce dollar (USD) dependency.",
    seriesChina: "China (PBOC — People's Bank of China)", seriesRussia: "Russia (Central Bank of Russia)",
    seriesIndia: "India (RBI — Reserve Bank of India)", seriesBrazil: "Brazil (BCB — Banco Central do Brasil)",
    seriesTurkey: "Turkey (CBRT — Central Bank of the Republic of Turkey)", seriesPoland: "Poland (NBP — National Bank of Poland, partner — not BRICS member)",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source: World Gold Council (WGC) / IMF COFER (Currency Composition of Official Foreign Exchange Reserves)", estBadge: "⚠️ est. (estimated)",
  },
  goldShare: { title: "GOLD AS %% OF TOTAL RESERVES (2025)", subtitle: "How much of each country's vault is in gold vs. dollars, euros, etc. — Higher %% in gold = less dollar dependency.", country: "País", goldPct: "Gold (%% of reserves)" },
  oil: {
    title: "OIL VECTOR: PRICE & BRICS+ PRODUCTION",
    subtitle: "Brent (US$/barrel) and BRICS+ production (million barrels/day) — Oil is the world's most traded commodity. When price rises, exporter currencies (like BRL) tend to appreciate.",
    seriesBrent: "Brent (international oil benchmark)", seriesWTI: "WTI (West Texas Intermediate — US benchmark)",
    seriesProduction: "BRICS+ Production (million barrels/day)", seriesPetroyuan: "Petroyuan (US$ bn traded in yuan on Shanghai INE — Shanghai International Energy Exchange)",
    embedLabel: "Embed", exportPNG: "Export PNG", exportPDF: "Export PDF", exportJSON: "Export JSON",
    source: "Source: EIA (Energy Information Administration) / OPEC (Organization of the Petroleum Exporting Countries) / Shanghai INE", estBadge: "⚠️ est. (estimated)",
  },
  carbon: {
    title: "CARBON PRICING & CBAM: THE PRICE OF CARBON AT THE EUROPEAN BORDER",
    subtitle: "CBAM (Carbon Border Adjustment Mechanism) in its definitive regime since 01/01/2026. The certificate price tracks the EU ETS (EU Emissions Trading System) auction average: quarterly in 2026, weekly from 2027.",
    badgeOfficial: "OFFICIAL DATA — Q2 2026 · last European Commission publication: 2026-07-06",
    badgeSnapshot: "OWID snapshot",
    kpiCert: "CBAM certificate (€/tCO₂e)", kpiThreshold: "De minimis exemption", kpiSectors: "Covered sectors", kpiSectorsNote: "downstream expansion in 2028", kpiSurrender: "1st declaration + surrender", kpiSurrenderNote: "covering 2026 imports",
    certChartTitle: "Official CBAM certificate price (€/tCO₂e, per quarter)",
    certPendingNote: "Q3 2026 publishes on 2026-10-05; Q4 2026 on 2027-01-04. Source: European Commission (TAXUD).",
    instrumentsTitle: "Carbon pricing worldwide (USD/tCO₂e, approx.)", instrumentsNote: "Approximate values, Q2 2026 snapshot — verify against the World Bank Carbon Pricing Dashboard before publishing.", price: "Price",
    owidTitle: "Consumption-based CO₂ per capita (t/year) — the embedded-emissions lens", owidNote: "Consumption-based (not territorial) emissions: the conceptual basis of CBAM. Source: Our World in Data / Global Carbon Project, via daily snapshot.",
    timelineTitle: "Regulatory timeline (Reg. (EU) 2023/956 + 2025/2083)",
    sectorsTitle: "Sectors under CBAM scope",
    brazilTitle: "BRAZIL ANGLE",
    brazilText: "CBAM obligations fall on the authorised importer in the European Union (the CBAM declarant). Brazilian exporters of covered goods will be pressed to provide verifiable embedded-emissions data, with contractual, financial and competitive effects. A carbon price effectively paid in Brazil may be deducted from the obligation — provided it is eligible, proven and recognised under the EU methodology. The SBCE (Brazilian Emissions Trading System — Law 15,042/2024), once operational, may create that possibility, but does not guarantee automatic deduction.",
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
  insight: {
    badge: "AI-assisted · not analyst-reviewed",
    dataOf: "Data as of", generatedAt: "Generated",
    confidence: "Confidence", data: "data", interpretation: "interpretation",
    levelHigh: "high", levelMedium: "medium", levelLow: "low",
    stale: "Data may be stale; interpretation may not reflect the latest snapshot.",
    preserved: "Text preserved from a previous generation (last update failed).",
  },
  sourceOverlay: { title: "Primary Source", methodology: "Calculation Methodology", lastUpdated: "Last updated", close: "Close" },
  embedOverlay: { title: "Embed Widget", description: "Copy the code below to embed this section on your site or post:", copy: "Copy", copied: "Copied!", close: "Close" },
  footer: {
    compiledBy: "Compiled by", hubstry: "Hubstry Deep Tech", overall: "Overall 720°",
    snapshot: "edition 2026.07 · static data: Q2 2026 · daily snapshots via open APIs",
    sources: "Primary Sources", disclaimer: "Approximate values. Verify against primary sources before publishing or making investment decisions. This dashboard is for educational and geopolitical analysis purposes, not financial advice.",
  },
  brazilSticky: {
    label: "BRAZIL HIGHLIGHT", lcDebt: "LC Debt (%% of total)", fcDebt: "FX Debt (%% of total)",
    trend: "Trend 2015→2025", improving: "Improving", stable: "Stable", concerning: "Concerning",
  },
};

const translations: Record<Locale, T> = { pt, en, zh: en };

let currentLocale: Locale = "pt";
const listeners: Set<() => void> = new Set();

export function setLocale(locale: Locale) { currentLocale = locale; listeners.forEach((cb) => cb()); }
export function getLocale(): Locale { return currentLocale; }
export function subscribe(callback: () => void) { listeners.add(callback); return () => listeners.delete(callback); }

export function t(key: string): string {
  const keys = key.split(".");
  let current: T | string = translations[currentLocale];
  for (const k of keys) { if (typeof current !== "object" || current === null) return key; current = current[k]; }
  return typeof current === "string" ? current : key;
}

export function toggleLocale() { setLocale(currentLocale === "pt" ? "en" : "pt"); }
