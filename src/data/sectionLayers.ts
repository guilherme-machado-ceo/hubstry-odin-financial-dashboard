// ============================================================
// ODIN — CAMADAS ESTRUTURAIS POR SEÇÃO (M2) · sem IA
// Fontes, data de referência + frescor, indicadores, eventos, What to Watch e
// status da lente de Direito Econômico para as seções de dados que ainda não
// têm ODIN Insight. Todo valor é EXTRAÍDO dos mesmos módulos de dados que a
// seção exibe — nada é digitado aqui. Registro testado no CI
// (scripts/test-section-layers.mjs).
// Imports relativos (sem alias "@/") para o teste poder empacotar o módulo.
// ============================================================
import {
  kpis, bricsLatamTotal, tcxHedgingData, countryDebtData, latestYearIndex,
  inflectionPoints, spreadsData, volatilityRanking, stabilityScores, sourceRefs,
} from "./lcBondsData";
import { goldReserves, oilData } from "./goldOilData";
import { PANDA_BOND_EVENTS } from "./pandaBondsData";

export type LayerMode = "curated" | "live" | "mixed";

export interface LayerSource {
  id: string;
  name: string;
  url: string;
  /** Data de referência do dado (ISO) ou "live" para consulta ao vivo no navegador. */
  asOf: string;
}
export interface LayerIndicator { labelPt: string; labelEn: string; valuePt: string; valueEn: string; sourceId: string; estimated?: boolean; }
export interface LayerEvent { date: string; labelPt: string; labelEn: string; sourceLabel: string; estimated?: boolean; }
export interface LayerWatch { signalPt: string; signalEn: string; whyPt: string; whyEn: string; sourceId: string; }
export interface SectionLayerSpec {
  id: string;
  titlePt: string;
  titleEn: string;
  mode: LayerMode;
  sources: LayerSource[];
  indicators: LayerIndicator[];
  events: LayerEvent[];
  watch: LayerWatch;
  legal: { status: "not_applicable"; notePt: string; noteEn: string };
}

/** Idade máxima (dias) para um dado curado ser exibido como atual. */
export const CURATED_MAX_AGE_DAYS = 180;

const LEGAL_NA = {
  status: "not_applicable" as const,
  notePt: "Não aplicável nesta edição: não há referência jurídica curada para esta seção.",
  noteEn: "Not applicable in this edition: no curated legal reference for this section.",
};

const ref = (id: string): LayerSource => {
  const r = sourceRefs.find((s) => s.id === id);
  if (!r) throw new Error(`sourceRef inexistente: ${id}`);
  return { id: r.id, name: r.name, url: r.url, asOf: r.lastUpdated };
};
const live = (id: string, name: string, url: string): LayerSource => ({ id, name, url, asOf: "live" });

const nf = (locale: "pt" | "en", v: number, digits = 1) =>
  v.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const pt = (v: number, d = 1) => nf("pt", v, d);
const en = (v: number, d = 1) => nf("en", v, d);
/** Valor nos dois idiomas: `f` recebe o formatador numérico do idioma. */
const val = (f: (n: (v: number, d?: number) => string, l: "pt" | "en") => string) => ({ valuePt: f(pt, "pt"), valueEn: f(en, "en") });
const lastOf = <T,>(arr: T[]) => arr[arr.length - 1];
const maxBy = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, b) => (f(b) > f(a) ? b : a));
const minBy = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, b) => (f(b) < f(a) ? b : a));

// ── Dados derivados (sempre dos módulos exibidos) ─────────────────────────────
const lcLast = lastOf(bricsLatamTotal);
const tcxLast = lastOf(tcxHedgingData);
const debtBR = countryDebtData.find((c) => c.country === "Brazil")!;
const lcShare = (c: typeof countryDebtData[number]) => (c.localCurrencyDebt[latestYearIndex] / c.totalDebt[latestYearIndex]) * 100;
const debtMaxLC = maxBy(countryDebtData, lcShare);
const debtMinLC = minBy(countryDebtData, lcShare);
const spreadBR = spreadsData.find((s) => s.country === "Brazil")!;
const spreadMax = maxBy(spreadsData, (s) => s.spread2025e);
const spreadMin = minBy(spreadsData, (s) => s.spread2025e);
const volMax = maxBy(volatilityRanking, (v) => v.volatility);
const volMin = minBy(volatilityRanking, (v) => v.volatility);
const volBR = volatilityRanking.find((v) => v.code === "BRL")!;
const stabMax = maxBy(stabilityScores, (s) => s.stabilityScore);
const stabMin = minBy(stabilityScores, (s) => s.stabilityScore);
const stabBR = stabilityScores.find((s) => s.country === "Brazil")!;
const goldLast = lastOf(goldReserves);
const oilLast = lastOf(oilData);
const swapLine = inflectionPoints.find((p) => p.event.startsWith("PBOC↔BCB"));
const pandaSorted = [...PANDA_BOND_EVENTS].sort((a, b) => b.date.localeCompare(a.date));
const pandaLatestIssued = pandaSorted.find((e) => e.status === "issued");
const pandaBrazilPlanned = pandaSorted.find((e) => e.status === "planned" && e.issuer.startsWith("Brasil") && e.amountCnyBn != null);
// Uma fonte por URL (duas notas do NDB têm o mesmo nome e links diferentes).
// Entram as fontes dos eventos citados no bloco: os 3 mais recentes e o
// anúncio do Panda Bond soberano do Brasil.
const pandaCited = [...pandaSorted.slice(0, 3), ...pandaSorted.filter((e) => e.status === "planned" && e.issuer.startsWith("Brasil") && e.amountCnyBn != null).slice(0, 1)];
const pandaSources: LayerSource[] = [...new Map(pandaCited.map((e) => [e.sourceUrl, e])).values()]
  .map((e) => ({ id: `panda-${e.id}`, name: e.source, url: e.sourceUrl, asOf: e.verifiedAt }));
const pandaSourceId = (e: typeof PANDA_BOND_EVENTS[number]) =>
  pandaSources.find((s) => s.url === e.sourceUrl)?.id ?? pandaSources[0].id;

export const SECTION_LAYERS: SectionLayerSpec[] = [
  {
    id: "hero",
    titlePt: "Visão geral · KPIs e PTAX",
    titleEn: "Overview · KPIs and PTAX",
    mode: "mixed",
    sources: [ref("bis-debt"), ref("cips"), ref("ndb"), live("bcb-sgs-10813", "BCB SGS 10813 — PTAX", "https://api.bcb.gov.br/dados/serie/bcdata.sgs.10813")],
    indicators: [
      { labelPt: "Mercado de títulos em moeda local (BRICS + LATAM)", labelEn: "Local-currency bond market (BRICS + LATAM)", valuePt: kpis.lcBondMarketTotal, valueEn: kpis.lcBondMarketTotal, sourceId: "bis-debt" },
      { labelPt: "Throughput do CIPS", labelEn: "CIPS throughput", valuePt: kpis.cipsThroughput, valueEn: kpis.cipsThroughput, sourceId: "cips" },
      { labelPt: "Participação de moeda local no NDB (meta)", labelEn: "NDB local-currency share (target)", valuePt: `${kpis.ndbLCShare}% (${kpis.ndbLCTarget}%)`, valueEn: `${kpis.ndbLCShare}% (${kpis.ndbLCTarget}%)`, sourceId: "ndb" },
    ],
    events: inflectionPoints.slice(0, 3).map((p) => ({ date: String(p.year), labelPt: `${p.eventPt}: ${p.value}`, labelEn: `${p.event}: ${p.value}`, sourceLabel: p.source, estimated: p.isEstimated })),
    watch: {
      signalPt: "Próxima atualização das estatísticas de títulos de dívida do BIS",
      signalEn: "Next update of BIS debt securities statistics",
      whyPt: "Atualiza o tamanho do mercado em moeda local exibido no topo do painel.",
      whyEn: "Updates the local-currency market size shown at the top of the dashboard.",
      sourceId: "bis-debt",
    },
    legal: LEGAL_NA,
  },
  {
    id: "brazil",
    titlePt: "Brasil em foco · Panda Bonds",
    titleEn: "Brazil spotlight · Panda Bonds",
    mode: "curated",
    sources: [...pandaSources, ref("bcb")],
    indicators: [
      ...(pandaLatestIssued ? [{
        labelPt: `Última emissão registrada (${pandaLatestIssued.issuer})`,
        labelEn: `Latest recorded issuance (${pandaLatestIssued.issuer})`,
        ...val((n, l) => `¥${n(pandaLatestIssued.amountCnyBn ?? 0)}${l === "pt" ? " bi" : " bn"} · ${pandaLatestIssued.date}`),
        sourceId: pandaSourceId(pandaLatestIssued),
      }] : []),
      ...(pandaBrazilPlanned ? [{
        labelPt: "Panda Bond soberano do Brasil (anunciado, não emitido)",
        labelEn: "Brazil sovereign Panda Bond (announced, not issued)",
        ...val((n, l) => `${l === "pt" ? "até" : "up to"} ¥${n(pandaBrazilPlanned.amountCnyBn ?? 0)}${l === "pt" ? " bi" : " bn"}`),
        sourceId: pandaSourceId(pandaBrazilPlanned),
      }] : []),
      ...(swapLine ? [{ labelPt: "Linha de swap PBOC↔BCB", labelEn: "PBOC↔BCB swap line", valuePt: swapLine.value, valueEn: swapLine.value, sourceId: "bcb" }] : []),
    ],
    events: pandaSorted.slice(0, 3).map((e) => ({ date: e.date, labelPt: e.titlePt, labelEn: e.titleEn, sourceLabel: e.source })),
    watch: {
      signalPt: "Registro ou emissão do Panda Bond soberano do Brasil",
      signalEn: "Registration or issuance of Brazil's sovereign Panda Bond",
      whyPt: "Converte o anúncio em operação e define valor, prazo e custo efetivos.",
      whyEn: "Turns the announcement into a transaction and sets the actual size, tenor and cost.",
      sourceId: pandaBrazilPlanned ? pandaSourceId(pandaBrazilPlanned) : pandaSources[0].id,
    },
    legal: LEGAL_NA,
  },
  {
    id: "market-size",
    titlePt: "Tamanho do mercado em moeda local",
    titleEn: "Local-currency market size",
    mode: "curated",
    sources: [ref("bis-debt")],
    indicators: [
      { labelPt: `Total BRICS + LATAM (${lcLast.year})`, labelEn: `BRICS + LATAM total (${lcLast.year})`, ...val((n, l) => `US$ ${n(lcLast.total / 1000)}${l === "pt" ? " tri" : "T"}`), sourceId: "bis-debt" },
      { labelPt: `BRICS (${lcLast.year})`, labelEn: `BRICS (${lcLast.year})`, ...val((n, l) => `US$ ${n(lcLast.brics / 1000)}${l === "pt" ? " tri" : "T"}`), sourceId: "bis-debt" },
      { labelPt: `LATAM (${lcLast.year})`, labelEn: `LATAM (${lcLast.year})`, ...val((n, l) => `US$ ${n(lcLast.latam / 1000, 2)}${l === "pt" ? " tri" : "T"}`), sourceId: "bis-debt" },
    ],
    events: [],
    watch: {
      signalPt: "Próxima atualização das estatísticas de títulos de dívida do BIS",
      signalEn: "Next update of BIS debt securities statistics",
      whyPt: "Substitui a série curada e confirma o tamanho do mercado no ano mais recente.",
      whyEn: "Replaces the curated series and confirms the market size for the latest year.",
      sourceId: "bis-debt",
    },
    legal: LEGAL_NA,
  },
  {
    id: "spreads",
    titlePt: "Spreads soberanos",
    titleEn: "Sovereign spreads",
    mode: "curated",
    sources: [ref("bloomberg")],
    indicators: [
      { labelPt: "Spread do Brasil (2025e)", labelEn: "Brazil spread (2025e)", ...val((_, l) => `${spreadBR.spread2025e} ${l === "pt" ? "pb" : "bps"}`), sourceId: "bloomberg", estimated: true },
      { labelPt: `Maior spread · ${spreadMax.countryPt}`, labelEn: `Widest spread · ${spreadMax.country}`, ...val((_, l) => `${spreadMax.spread2025e} ${l === "pt" ? "pb" : "bps"}`), sourceId: "bloomberg", estimated: true },
      { labelPt: `Menor spread · ${spreadMin.countryPt}`, labelEn: `Tightest spread · ${spreadMin.country}`, ...val((_, l) => `${spreadMin.spread2025e} ${l === "pt" ? "pb" : "bps"}`), sourceId: "bloomberg", estimated: true },
    ],
    events: [],
    watch: {
      signalPt: "Revisão da série curada de spreads soberanos",
      signalEn: "Review of the curated sovereign spread series",
      whyPt: "Os valores de 2025 são estimativas; a revisão os substitui por observações.",
      whyEn: "2025 values are estimates; the review replaces them with observations.",
      sourceId: "bloomberg",
    },
    legal: LEGAL_NA,
  },
  {
    id: "volatility",
    titlePt: "Volatilidade cambial",
    titleEn: "FX volatility",
    mode: "curated",
    sources: [ref("bloomberg")],
    indicators: [
      { labelPt: "Volatilidade do BRL", labelEn: "BRL volatility", ...val((n) => `${n(volBR.volatility)}%`), sourceId: "bloomberg", estimated: true },
      { labelPt: `Maior · ${volMax.code}`, labelEn: `Highest · ${volMax.code}`, ...val((n) => `${n(volMax.volatility)}%`), sourceId: "bloomberg", estimated: true },
      { labelPt: `Menor · ${volMin.code}`, labelEn: `Lowest · ${volMin.code}`, ...val((n) => `${n(volMin.volatility)}%`), sourceId: "bloomberg", estimated: true },
    ],
    events: [],
    watch: {
      signalPt: "Revisão da série curada de volatilidade cambial",
      signalEn: "Review of the curated FX volatility series",
      whyPt: "Atualiza o ranking e substitui estimativas por observações.",
      whyEn: "Updates the ranking and replaces estimates with observations.",
      sourceId: "bloomberg",
    },
    legal: LEGAL_NA,
  },
  {
    id: "tcx",
    titlePt: "Hedge em moeda local (TCX)",
    titleEn: "Local-currency hedging (TCX)",
    mode: "curated",
    sources: [ref("tcx")],
    indicators: [
      { labelPt: `Volume protegido no ano (${tcxLast.year})`, labelEn: `Annual hedged volume (${tcxLast.year})`, ...val((n, l) => `US$ ${n(tcxLast.annualHedged)}${l === "pt" ? " bi" : " bn"}`), sourceId: "tcx" },
      { labelPt: `Carteira em aberto (${tcxLast.year})`, labelEn: `Outstanding portfolio (${tcxLast.year})`, ...val((n, l) => `US$ ${n(tcxLast.portfolioOutstanding)}${l === "pt" ? " bi" : " bn"}`), sourceId: "tcx" },
      { labelPt: "Moedas cobertas", labelEn: "Currencies covered", valuePt: String(tcxLast.currencies), valueEn: String(tcxLast.currencies), sourceId: "tcx" },
    ],
    events: [],
    watch: {
      signalPt: "Próximo relatório anual do TCX",
      signalEn: "Next TCX annual report",
      whyPt: "Confirma volume protegido, carteira e número de moedas do ano corrente.",
      whyEn: "Confirms hedged volume, portfolio and currency count for the current year.",
      sourceId: "tcx",
    },
    legal: LEGAL_NA,
  },
  {
    id: "debt",
    titlePt: "Composição da dívida (moeda local × estrangeira)",
    titleEn: "Debt composition (local × foreign currency)",
    mode: "curated",
    sources: [ref("imf-weo")],
    indicators: [
      { labelPt: "Brasil · dívida em moeda local", labelEn: "Brazil · local-currency debt share", ...val((n) => `${n(lcShare(debtBR))}%`), sourceId: "imf-weo" },
      { labelPt: `Maior participação · ${debtMaxLC.countryPt}`, labelEn: `Highest share · ${debtMaxLC.country}`, ...val((n) => `${n(lcShare(debtMaxLC))}%`), sourceId: "imf-weo" },
      { labelPt: `Menor participação · ${debtMinLC.countryPt}`, labelEn: `Lowest share · ${debtMinLC.country}`, ...val((n) => `${n(lcShare(debtMinLC))}%`), sourceId: "imf-weo" },
    ],
    events: [],
    watch: {
      signalPt: "Próxima edição do IMF World Economic Outlook",
      signalEn: "Next IMF World Economic Outlook release",
      whyPt: "Atualiza dívida bruta e composição por moeda dos países do painel.",
      whyEn: "Updates gross debt and currency composition for the countries shown.",
      sourceId: "imf-weo",
    },
    legal: LEGAL_NA,
  },
  {
    id: "stability",
    titlePt: "Estabilidade × dívida em moeda local",
    titleEn: "Stability × local-currency debt",
    mode: "curated",
    sources: [ref("imf-weo")],
    indicators: [
      { labelPt: "Brasil · score de estabilidade (curado)", labelEn: "Brazil · stability score (curated)", valuePt: `${stabBR.stabilityScore}/100`, valueEn: `${stabBR.stabilityScore}/100`, sourceId: "imf-weo" },
      { labelPt: `Maior · ${stabMax.countryPt}`, labelEn: `Highest · ${stabMax.country}`, valuePt: `${stabMax.stabilityScore}/100`, valueEn: `${stabMax.stabilityScore}/100`, sourceId: "imf-weo" },
      { labelPt: `Menor · ${stabMin.countryPt}`, labelEn: `Lowest · ${stabMin.country}`, valuePt: `${stabMin.stabilityScore}/100`, valueEn: `${stabMin.stabilityScore}/100`, sourceId: "imf-weo" },
    ],
    events: [],
    watch: {
      signalPt: "Próxima edição do IMF World Economic Outlook",
      signalEn: "Next IMF World Economic Outlook release",
      whyPt: "Atualiza as variáveis macroeconômicas que compõem o score curado.",
      whyEn: "Updates the macro variables behind the curated score.",
      sourceId: "imf-weo",
    },
    legal: LEGAL_NA,
  },
  {
    id: "gold",
    titlePt: "Reservas de ouro",
    titleEn: "Gold reserves",
    mode: "curated",
    sources: [ref("imf-weo")],
    indicators: [
      { labelPt: `China (${goldLast.year})`, labelEn: `China (${goldLast.year})`, ...val((_, l) => `${goldLast.China.toLocaleString(l === "pt" ? "pt-BR" : "en-US")} t`), sourceId: "imf-weo" },
      { labelPt: `Rússia (${goldLast.year})`, labelEn: `Russia (${goldLast.year})`, ...val((_, l) => `${goldLast.Russia.toLocaleString(l === "pt" ? "pt-BR" : "en-US")} t`), sourceId: "imf-weo" },
      { labelPt: `Brasil (${goldLast.year})`, labelEn: `Brazil (${goldLast.year})`, ...val((_, l) => `${goldLast.Brazil.toLocaleString(l === "pt" ? "pt-BR" : "en-US")} t`), sourceId: "imf-weo" },
    ],
    events: [],
    watch: {
      signalPt: "Próxima atualização das estatísticas de reservas do FMI",
      signalEn: "Next update of IMF reserve statistics",
      whyPt: "Confirma as compras de ouro dos bancos centrais no ano corrente.",
      whyEn: "Confirms central-bank gold purchases for the current year.",
      sourceId: "imf-weo",
    },
    legal: LEGAL_NA,
  },
  {
    id: "oil",
    titlePt: "Vetor petróleo",
    titleEn: "Oil vector",
    mode: "mixed",
    sources: [ref("bloomberg"), live("yahoo-finance", "Yahoo Finance — Brent/WTI", "https://finance.yahoo.com/")],
    indicators: [
      { labelPt: `Brent · média ${oilLast.year}`, labelEn: `Brent · ${oilLast.year} average`, ...val((n, l) => `US$ ${n(oilLast.brent)}${l === "pt" ? "/barril" : "/bbl"}`), sourceId: "bloomberg" },
      { labelPt: `Produção BRICS+ (${oilLast.year})`, labelEn: `BRICS+ production (${oilLast.year})`, ...val((n, l) => `${n(oilLast.bricsProduction)}${l === "pt" ? " mi barris/dia" : " mb/d"}`), sourceId: "bloomberg" },
      { labelPt: `Petroyuan na Shanghai INE (${oilLast.year})`, labelEn: `Petroyuan on Shanghai INE (${oilLast.year})`, ...val((n, l) => `US$ ${n(oilLast.petroyuanVolume)}${l === "pt" ? " bi" : " bn"}`), sourceId: "bloomberg" },
    ],
    events: [],
    watch: {
      signalPt: "Cotação diária de Brent e WTI",
      signalEn: "Daily Brent and WTI quotes",
      whyPt: "O preço ao vivo é exibido na seção; a média anual curada é revisada à parte.",
      whyEn: "The live price is shown in the section; the curated annual average is reviewed separately.",
      sourceId: "yahoo-finance",
    },
    legal: LEGAL_NA,
  },
];

export function getSectionLayers(id: string): SectionLayerSpec | undefined {
  return SECTION_LAYERS.find((s) => s.id === id);
}

/** Frescor de uma fonte em relação a `now`. */
export function sourceFreshness(source: LayerSource, now = Date.now()): "live" | "current" | "stale" {
  if (source.asOf === "live") return "live";
  const age = (now - Date.parse(source.asOf)) / 864e5;
  return age > CURATED_MAX_AGE_DAYS ? "stale" : "current";
}
