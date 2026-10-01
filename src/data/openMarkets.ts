// ============================================================
// ODIN — Dados abertos de mercado (PR 2c)
// Leitura tipada de src/data/generated/open-markets.json, gerado por
// scripts/fetch-open-markets.mjs no workflow open-markets.yml. Nenhum valor é
// digitado aqui: diferencial de juros 10a (OCDE MEI via FRED), volatilidade
// cambial (Fed H.10 via FRED; TRM do Banco de la República) e petróleo (EIA
// via FRED), cada bloco com verificação + derivação e método explícito.
// Imports relativos (sem alias "@/") para o teste poder empacotar o módulo.
// ============================================================
import raw from "./generated/open-markets.json";

export type Verification = "verified" | "unverified";
export type Derivation = "direct" | "transformed" | "derived" | "estimated";

export interface SeriesMeta { sourceId: string; title: string; url: string; firstDate: string; lastDate: string; n: number }
export interface Gap { flag: string; code?: string; country: string; countryPt: string; reasonPt: string; reasonEn: string }
export interface YieldCountry {
  flag: string; country: string; countryPt: string; seriesId: string;
  latest: { month: string; localPct: number; usPct: number; bps: number };
  delta12mBps: number | null;
  trend: "stable" | "widening" | "narrowing" | null;
  annual: Record<string, number>;
}
export interface FxCurrency {
  code: string; flag: string; country: string; countryPt: string; seriesId: string; sourceId: string;
  annual: Record<string, number>;
  ytd: { from: string; to: string; n: number; vol: number } | null;
  lastDate: string;
}
export interface OilSeries { seriesId: string; annual: Record<string, number>; latest: { date: string; value: number } }
interface Block { verification: Verification; derivation: Derivation; unit: string; methodPt: string; methodEn: string }

export interface OpenMarkets {
  schemaVersion: string;
  methodVersion: string;
  retrievedAt: string;
  series: Record<string, SeriesMeta>;
  yieldDifferential: Block & { benchmark: string; countries: YieldCountry[]; gaps: Gap[] };
  fxVolatility: Block & { currencies: FxCurrency[]; gaps: Gap[] };
  oil: Block & { brent: OilSeries | null; wti: OilSeries | null };
  errors: Array<{ id: string; url: string; error: string }>;
}

export const openMarkets = raw as OpenMarkets;

/** Último ano civil completo presente em todas as moedas (ex.: 2025). */
export function latestFullYear(records: Array<Record<string, number>>): number | null {
  const years = records.map((r) => Math.max(...Object.keys(r).map(Number)));
  const y = Math.min(...years);
  return Number.isFinite(y) ? y : null;
}

/** "2026-08" → "ago/2026" | "Aug 2026". */
export function formatMonth(month: string, locale: string): string {
  const d = new Date(`${month}-15T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return month;
  return d.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

/** "2026-09-25" → "25/09/2026" | "Sep 25, 2026". */
export function formatDay(day: string, locale: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: locale === "pt" ? "2-digit" : "short", year: "numeric", timeZone: "UTC" });
}
