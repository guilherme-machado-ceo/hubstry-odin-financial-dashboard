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
  inflectionPoints, sourceRefs,
} from "./lcBondsData";
import { goldReserves } from "./goldOilData";
import { openMarkets, latestFullYear, formatMonth, formatDay, type Verification, type Derivation } from "./openMarkets";
import { PANDA_BOND_EVENTS } from "./pandaBondsData";
import { inRegion, type Region } from "./regions";
import { isUnverified } from "./dataAudit";

export type LayerMode = "curated" | "live" | "mixed";

export interface LayerSource {
  id: string;
  name: string;
  url: string;
  /** Data de referência do dado (ISO) ou "live" para consulta ao vivo no navegador. */
  asOf: string;
}
/** Procedência em dois eixos (PR 2c), obrigatória em todo indicador:
 *  verification — confere com a fonte citada? (dataAudit.ts / coleta por código)
 *  derivation   — direct | transformed | derived | estimated. */
export interface LayerIndicator { labelPt: string; labelEn: string; valuePt: string; valueEn: string; sourceId: string;
  verification: Verification; derivation: Derivation; }
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
  /** "global" = seção não filtrável; Region = indicadores recalculados com o subconjunto da região. */
  scope: "global" | Region;
}

/** Idade máxima (dias) de um dado curado antes de precisar de revisão editorial — uso interno
 * (governança/CI); a interface mostra apenas a data de referência, sem rótulo de "desatualizado". */
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
/** Procedência de dado coletado/conferido na fonte. */
const V = (derivation: Derivation) => ({ verification: "verified" as Verification, derivation });
/** Procedência conforme a auditoria (src/data/dataAudit.ts). */
const A = (auditId: string, derivation: Derivation) => ({ verification: (isUnverified(auditId) ? "unverified" : "verified") as Verification, derivation });
const lastOf = <T,>(arr: T[]) => arr[arr.length - 1];
const lastYearOf = (annual: Record<string, number>) => String(Math.max(...Object.keys(annual).map(Number)));
const maxBy = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, b) => (f(b) > f(a) ? b : a));
const minBy = <T,>(arr: T[], f: (x: T) => number) => arr.reduce((a, b) => (f(b) < f(a) ? b : a));

// ── Dados derivados (sempre dos módulos exibidos) ─────────────────────────────
const lcLast = lastOf(bricsLatamTotal);
const tcxLast = lastOf(tcxHedgingData);
const lcShare = (c: typeof countryDebtData[number]) => (c.localCurrencyDebt[latestYearIndex] / c.totalDebt[latestYearIndex]) * 100;
const goldLast = lastOf(goldReserves);
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

// ── Seções filtráveis: indicadores recalculados com o subconjunto da região. ──
const yd = openMarkets.yieldDifferential;
const fxv = openMarkets.fxVolatility;
const oil = openMarkets.oil;
/** sourceId do JSON ("fred" | "banrep-trm") → sourceRef da seção. */
const fxRef = (sid: string) => (sid === "banrep-trm" ? "banrep-trm" : "fred-h10");
const fxYear = latestFullYear(fxv.currencies.map((c) => c.annual));
const bps = (v: number, l: "pt" | "en") => `${v > 0 ? "+" : ""}${v} ${l === "pt" ? "pb" : "bps"}`;

function build_spreads(region: Region): SectionLayerSpec {
  const rows = yd.countries.filter((x) => inRegion(x.flag, region)).sort((a, b) => b.latest.bps - a.latest.bps);
  const gaps = yd.gaps.filter((g) => inRegion(g.flag, region));
  return {
    id: "spreads",
    titlePt: "Diferencial de juros soberanos (10 anos)",
    titleEn: "Sovereign yield differential (10-year)",
    mode: "curated",
    sources: [ref("oecd-mei-fred")],
    indicators: rows.map((c) => ({
      labelPt: `${c.countryPt} · ${formatMonth(c.latest.month, "pt")}`,
      labelEn: `${c.country} · ${formatMonth(c.latest.month, "en")}`,
      valuePt: bps(c.latest.bps, "pt"), valueEn: bps(c.latest.bps, "en"),
      sourceId: "oecd-mei-fred", ...V("derived"),
    })),
    events: gaps.length ? [{
      date: openMarkets.retrievedAt.slice(0, 10),
      labelPt: `Sem série aberta compatível: ${gaps.map((g) => g.countryPt).join(", ")}`,
      labelEn: `No compatible open series: ${gaps.map((g) => g.country).join(", ")}`,
      sourceLabel: "ODIN",
    }] : [],
    watch: {
      signalPt: "Próxima publicação mensal da OCDE (Indicadores Econômicos Principais)",
      signalEn: "Next monthly OECD release (Main Economic Indicators)",
      whyPt: "Atualiza o rendimento de 10 anos de cada país e dos EUA, e com ele o diferencial e a variação em 12 meses.",
      whyEn: "Updates each country's and the US 10-year yield, and with them the differential and its 12-month change.",
      sourceId: "oecd-mei-fred",
    },
    legal: LEGAL_NA,
    scope: region === "all" ? "global" : region,
  };
}

function build_volatility(region: Region): SectionLayerSpec {
  const rows = fxv.currencies.filter((x) => inRegion(x.flag, region) && fxYear != null && x.annual[fxYear] != null);
  const brl = rows.find((x) => x.code === "BRL");
  const volMax = maxBy(rows, (x) => x.annual[fxYear!]);
  const volMin = minBy(rows, (x) => x.annual[fxYear!]);
  const usesTrm = rows.some((x) => x.sourceId === "banrep-trm");
  const pct = (v: number) => val((n) => `${n(v)}%`);
  return {
    id: "volatility",
    titlePt: "Volatilidade cambial",
    titleEn: "FX volatility",
    mode: "curated",
    sources: [ref("fred-h10"), ...(usesTrm ? [ref("banrep-trm")] : [])],
    indicators: [
      ...(brl ? [{ labelPt: `BRL · ${fxYear}`, labelEn: `BRL · ${fxYear}`, ...pct(brl.annual[fxYear!]), sourceId: "fred-h10", ...V("derived") }] : []),
      ...(brl?.ytd ? [{ labelPt: `BRL · ${fxYear! + 1} até ${formatDay(brl.ytd.to, "pt")}`, labelEn: `BRL · ${fxYear! + 1} to ${formatDay(brl.ytd.to, "en")}`, ...pct(brl.ytd.vol), sourceId: "fred-h10", ...V("derived") }] : []),
      { labelPt: `Maior · ${volMax.code} (${fxYear})`, labelEn: `Highest · ${volMax.code} (${fxYear})`, ...pct(volMax.annual[fxYear!]), sourceId: fxRef(volMax.sourceId), ...V("derived") },
      { labelPt: `Menor · ${volMin.code} (${fxYear})`, labelEn: `Lowest · ${volMin.code} (${fxYear})`, ...pct(volMin.annual[fxYear!]), sourceId: fxRef(volMin.sourceId), ...V("derived") },
    ],
    events: [],
    watch: {
      signalPt: "Fechamento do ano corrente no câmbio diário (Federal Reserve H.10)",
      signalEn: "Close of the current year in daily FX (Federal Reserve H.10)",
      whyPt: "Completa o ano em curso e permite comparar a volatilidade com a do ano anterior.",
      whyEn: "Completes the current year and allows comparing volatility with the previous year.",
      sourceId: "fred-h10",
    },
    legal: LEGAL_NA,
    scope: region === "all" ? "global" : region,
  };
}

function build_debt(region: Region): SectionLayerSpec {
  const rows = countryDebtData.filter((x) => inRegion(x.flag, region));
  const debtBR = rows.find((x) => x.country === "Brazil")!;
  const debtMaxLC = maxBy(rows, lcShare);
  const debtMinLC = minBy(rows, lcShare);
  return {
    id: "debt",
    titlePt: "Composição da dívida (moeda local × estrangeira)",
    titleEn: "Debt composition (local × foreign currency)",
    mode: "curated",
    sources: [ref("imf-weo")],
    indicators: [
      { labelPt: "Brasil · dívida em moeda local", labelEn: "Brazil · local-currency debt share", ...val((n) => `${n(lcShare(debtBR))}%`), sourceId: "imf-weo", ...A("country-debt", "derived") },
      { labelPt: `Maior participação · ${debtMaxLC.countryPt}`, labelEn: `Highest share · ${debtMaxLC.country}`, ...val((n) => `${n(lcShare(debtMaxLC))}%`), sourceId: "imf-weo", ...A("country-debt", "derived") },
      { labelPt: `Menor participação · ${debtMinLC.countryPt}`, labelEn: `Lowest share · ${debtMinLC.country}`, ...val((n) => `${n(lcShare(debtMinLC))}%`), sourceId: "imf-weo", ...A("country-debt", "derived") },
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
    scope: region === "all" ? "global" : region,
  };
}

export const SECTION_LAYERS: SectionLayerSpec[] = [
  {
    id: "hero",
    titlePt: "Visão geral · KPIs e PTAX",
    titleEn: "Overview · KPIs and PTAX",
    mode: "mixed",
    sources: [ref("bis-debt"), ref("cips"), ref("ndb"), ref("bcb-sgs-13762"), live("bcb-sgs-10813", "BCB SGS 10813 — PTAX", "https://api.bcb.gov.br/dados/serie/bcdata.sgs.10813")],
    indicators: [
      { labelPt: "Mercado de títulos em moeda local (BRICS + LATAM)", labelEn: "Local-currency bond market (BRICS + LATAM)", valuePt: kpis.lcBondMarketTotal, valueEn: kpis.lcBondMarketTotal, sourceId: "bis-debt", ...A("lc-market-total", "derived") },
      { labelPt: "Throughput do CIPS", labelEn: "CIPS throughput", valuePt: kpis.cipsThroughput, valueEn: kpis.cipsThroughput, sourceId: "cips", ...V("direct") },
      { labelPt: "Meta de financiamento em moeda local do NDB (2022–2026)", labelEn: "NDB local-currency financing target (2022–2026)", valuePt: `${kpis.ndbLCTarget}%`, valueEn: `${kpis.ndbLCTarget}%`, sourceId: "ndb", ...V("direct") },
      { labelPt: "Participação atual em moeda local do NDB", labelEn: "NDB current local-currency share", valuePt: `${kpis.ndbLCShare}%`, valueEn: `${kpis.ndbLCShare}%`, sourceId: "ndb", ...A("ndb-lc-share-disbursed", "direct") },
      { labelPt: `Dívida Bruta do Governo Geral do Brasil (${kpis.dividaBrutaBRDate.split(" ")[0]})`, labelEn: `Brazil General Government Gross Debt (${kpis.dividaBrutaBRDate.split(" ")[0]})`, ...val((n, l) => `${n(kpis.dividaBrutaBR)}% ${l === "pt" ? "do PIB" : "of GDP"}`), sourceId: "bcb-sgs-13762", ...V("direct") },
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
    scope: "global",
  },
  {
    id: "brazil",
    titlePt: "Brasil em foco · Panda Bonds",
    titleEn: "Brazil spotlight · Panda Bonds",
    mode: "curated",
    sources: [...pandaSources, ref("gov-cn-swap")],
    indicators: [
      ...(pandaLatestIssued ? [{
        labelPt: `Última emissão registrada (${pandaLatestIssued.issuer})`,
        labelEn: `Latest recorded issuance (${pandaLatestIssued.issuer})`,
        ...val((n, l) => `¥${n(pandaLatestIssued.amountCnyBn ?? 0)}${l === "pt" ? " bi" : " bn"} · ${pandaLatestIssued.date}`),
        sourceId: pandaSourceId(pandaLatestIssued),
        ...V("direct"),
      }] : []),
      ...(pandaBrazilPlanned ? [{
        labelPt: "Panda Bond soberano do Brasil (anunciado, não emitido)",
        labelEn: "Brazil sovereign Panda Bond (announced, not issued)",
        ...val((n, l) => `${l === "pt" ? "até" : "up to"} ¥${n(pandaBrazilPlanned.amountCnyBn ?? 0)}${l === "pt" ? " bi" : " bn"}`),
        sourceId: pandaSourceId(pandaBrazilPlanned),
        ...V("direct"),
      }] : []),
      ...(swapLine ? [{ labelPt: "Linha de swap PBOC↔BCB", labelEn: "PBOC↔BCB swap line", valuePt: swapLine.value, valueEn: swapLine.value, sourceId: "gov-cn-swap", ...V("direct") }] : []),
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
    scope: "global",
  },
  {
    id: "market-size",
    titlePt: "Tamanho do mercado em moeda local",
    titleEn: "Local-currency market size",
    mode: "curated",
    sources: [ref("bis-debt")],
    indicators: [
      { labelPt: `Total BRICS + LATAM (${lcLast.year})`, labelEn: `BRICS + LATAM total (${lcLast.year})`, ...val((n, l) => `US$ ${n(lcLast.total / 1000)}${l === "pt" ? " tri" : "T"}`), sourceId: "bis-debt", ...A("lc-market-total", "derived") },
      { labelPt: `BRICS (${lcLast.year})`, labelEn: `BRICS (${lcLast.year})`, ...val((n, l) => `US$ ${n(lcLast.brics / 1000)}${l === "pt" ? " tri" : "T"}`), sourceId: "bis-debt", ...A("lc-market-total", "derived") },
      { labelPt: `LATAM (${lcLast.year})`, labelEn: `LATAM (${lcLast.year})`, ...val((n, l) => `US$ ${n(lcLast.latam / 1000, 2)}${l === "pt" ? " tri" : "T"}`), sourceId: "bis-debt", ...A("lc-market-total", "derived") },
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
    scope: "global",
  },
  build_spreads("all"),
  build_volatility("all"),
  {
    id: "tcx",
    titlePt: "Hedge em moeda local (TCX)",
    titleEn: "Local-currency hedging (TCX)",
    mode: "curated",
    sources: [ref("tcx")],
    indicators: [
      { labelPt: `Volume protegido no ano (${tcxLast.year})`, labelEn: `Annual hedged volume (${tcxLast.year})`, ...val((n, l) => `US$ ${n(tcxLast.annualHedged, 2)}${l === "pt" ? " bi" : " bn"}`), sourceId: "tcx", ...V("direct") },
      { labelPt: "Volume protegido desde 2007", labelEn: "Volume hedged since 2007", ...val((n, l) => `~US$ ${n(kpis.tcxHedgedValue, 0)}${l === "pt" ? " bi" : " bn"}`), sourceId: "tcx", ...V("direct") },
      { labelPt: "Moedas cobertas desde 2007", labelEn: "Currencies covered since 2007", valuePt: String(kpis.tcxCurrencies), valueEn: String(kpis.tcxCurrencies), sourceId: "tcx", ...V("direct") },
      { labelPt: `Carteira em aberto (${tcxLast.year})`, labelEn: `Outstanding portfolio (${tcxLast.year})`, ...val((n, l) => `US$ ${n(tcxLast.portfolioOutstanding)}${l === "pt" ? " bi" : " bn"}`), sourceId: "tcx", ...A("tcx-series-other", "direct") },
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
    scope: "global",
  },
  build_debt("all"),
  {
    id: "gold",
    titlePt: "Reservas de ouro",
    titleEn: "Gold reserves",
    mode: "curated",
    sources: [ref("wgc-ifs")],
    indicators: [
      { labelPt: `China (${goldLast.year})`, labelEn: `China (${goldLast.year})`, ...val((_, l) => `${goldLast.China.toLocaleString(l === "pt" ? "pt-BR" : "en-US")} t`), sourceId: "wgc-ifs", ...A("gold-reserves", "direct") },
      { labelPt: `Rússia (${goldLast.year})`, labelEn: `Russia (${goldLast.year})`, ...val((_, l) => `${goldLast.Russia.toLocaleString(l === "pt" ? "pt-BR" : "en-US")} t`), sourceId: "wgc-ifs", ...A("gold-reserves", "direct") },
      { labelPt: `Brasil (${goldLast.year})`, labelEn: `Brazil (${goldLast.year})`, ...val((_, l) => `${goldLast.Brazil.toLocaleString(l === "pt" ? "pt-BR" : "en-US")} t`), sourceId: "wgc-ifs", ...A("gold-reserves", "direct") },
    ],
    events: [],
    watch: {
      signalPt: "Próxima atualização trimestral do World Gold Council (dados FMI IFS)",
      signalEn: "Next quarterly World Gold Council update (IMF IFS data)",
      whyPt: "Confirma as compras de ouro dos bancos centrais no ano corrente.",
      whyEn: "Confirms central-bank gold purchases for the current year.",
      sourceId: "wgc-ifs",
    },
    legal: LEGAL_NA,
    scope: "global",
  },
  {
    id: "oil",
    titlePt: "Vetor petróleo",
    titleEn: "Oil vector",
    mode: "mixed",
    sources: [ref("eia-fred"), live("yahoo-finance", "Yahoo Finance — Brent/WTI", "https://finance.yahoo.com/")],
    indicators: [
      ...(oil.brent ? [{ labelPt: `Brent · média ${lastYearOf(oil.brent.annual)}`, labelEn: `Brent · ${lastYearOf(oil.brent.annual)} average`, ...val((n, l) => `US$ ${n(oil.brent!.annual[lastYearOf(oil.brent!.annual)], 2)}${l === "pt" ? "/barril" : "/bbl"}`), sourceId: "eia-fred", ...V("derived") }] : []),
      ...(oil.wti ? [{ labelPt: `WTI · média ${lastYearOf(oil.wti.annual)}`, labelEn: `WTI · ${lastYearOf(oil.wti.annual)} average`, ...val((n, l) => `US$ ${n(oil.wti!.annual[lastYearOf(oil.wti!.annual)], 2)}${l === "pt" ? "/barril" : "/bbl"}`), sourceId: "eia-fred", ...V("derived") }] : []),
      ...(oil.brent ? [{ labelPt: `Brent · ${formatDay(oil.brent.latest.date, "pt")}`, labelEn: `Brent · ${formatDay(oil.brent.latest.date, "en")}`, ...val((n, l) => `US$ ${n(oil.brent!.latest.value, 2)}${l === "pt" ? "/barril" : "/bbl"}`), sourceId: "eia-fred", ...V("direct") }] : []),
    ],
    events: [],
    watch: {
      signalPt: "Preço spot diário de Brent e WTI (EIA)",
      signalEn: "Daily Brent and WTI spot price (EIA)",
      whyPt: "Atualiza o último preço diário e, ao fim do ano, a média anual calculada pelo ODIN.",
      whyEn: "Updates the latest daily price and, at year end, the annual average computed by ODIN.",
      sourceId: "eia-fred",
    },
    legal: LEGAL_NA,
    scope: "global",
  },
];

const REGION_BUILDERS: Record<string, (r: Region) => SectionLayerSpec> = {
  spreads: build_spreads, volatility: build_volatility, debt: build_debt,
};

/** Camadas da seção; seções filtráveis são recalculadas para `region`. */
export function getSectionLayers(id: string, region: Region = "all"): SectionLayerSpec | undefined {
  const builder = REGION_BUILDERS[id];
  if (builder) return builder(region);
  return SECTION_LAYERS.find((s) => s.id === id);
}

/** Frescor de uma fonte em relação a `now`. */
export function sourceFreshness(source: LayerSource, now = Date.now()): "live" | "current" | "stale" {
  if (source.asOf === "live") return "live";
  const age = (now - Date.parse(source.asOf)) / 864e5;
  return age > CURATED_MAX_AGE_DAYS ? "stale" : "current";
}
