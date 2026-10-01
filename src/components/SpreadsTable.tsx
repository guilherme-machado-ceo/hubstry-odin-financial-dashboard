// ============================================================
// Diferencial de juros soberanos de 10 anos vs EUA (PR 2c)
// Substitui a tabela de "spreads" atribuída ao Bloomberg (sem metodologia).
// Dados: src/data/generated/open-markets.json (OCDE MEI via FRED), calculados
// por scripts/fetch-open-markets.mjs. Países sem série aberta compatível
// aparecem em "lacunas", com o motivo — sem substituto de outra definição.
// ============================================================
import { useRef } from "react";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import { Share2, TrendingDown, Minus, TrendingUp } from "lucide-react";
import { inRegion, type Region } from "@/data/regions";
import { openMarkets, latestFullYear, formatMonth } from "@/data/openMarkets";
import { term } from "@/data/glossary";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; regionFilter: Region; }

const flagEmoji = (flag: string) => String.fromCodePoint(...[...flag.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)));
const signed = (v: number) => `${v > 0 ? "+" : ""}${v}`;

export default function SpreadsTable({ onSourceClick, onEmbedClick, regionFilter }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  const yd = openMarkets.yieldDifferential;
  const rows = yd.countries.filter((c) => inRegion(c.flag, regionFilter)).sort((a, b) => b.latest.bps - a.latest.bps);
  const gaps = yd.gaps.filter((g) => inRegion(g.flag, regionFilter));
  const avgYear = latestFullYear(yd.countries.filter((c) => Object.keys(c.annual).length).map((c) => c.annual));
  const nf = (v: number, d = 2) => v.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

  const trendIcon = (tr: string | null) => {
    if (tr === "narrowing") return <TrendingDown size={12} className="text-[#00FF88]" />;
    if (tr === "widening") return <TrendingUp size={12} className="text-[#FF4444]" />;
    return <Minus size={12} className="text-[#888]" />;
  };

  return (
    <section id="spreads" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("spreads.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1 max-w-3xl leading-relaxed">{t("spreads.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ExportButton chartRef={chartRef} filename="yield-differential" jsonData={{ method: locale === "pt" ? yd.methodPt : yd.methodEn, countries: rows, gaps }} />
            <button onClick={() => onEmbedClick("spreads")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="border border-[#1a1a1a] overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-12 gap-0 bg-[#111] border-b border-[#1a1a1a] text-[9px] font-mono uppercase tracking-widest text-[#555] py-2 px-3">
              <div className="col-span-3">{t("spreads.country")}</div>
              <div className="col-span-2 text-right">{t("spreads.differential")}</div>
              <div className="col-span-2 text-right">{t("spreads.month")}</div>
              <div className="col-span-2 pl-6">{t("spreads.delta12m")}</div>
              <div className="col-span-1 text-right">{t("spreads.avgYear")} {avgYear ?? ""}</div>
              <div className="col-span-2 text-right">{t("spreads.yields")}</div>
            </div>
            {rows.map((c, i) => (
              <div key={c.flag} data-yield-row={c.flag} className={`grid grid-cols-12 gap-0 py-2.5 px-3 text-[12px] font-mono hover:bg-[#0e0e0e] ${i < rows.length - 1 ? "border-b border-[#111]" : ""}`}>
                <div className="col-span-3 flex items-center gap-2"><span className="text-[14px]">{flagEmoji(c.flag)}</span><span className="text-[#aaa]">{locale === "pt" ? c.countryPt : c.country}</span></div>
                <div className="col-span-2 text-right font-bold text-[#FF8C00]">{signed(c.latest.bps)}</div>
                <div className="col-span-2 text-right text-[#777]">{formatMonth(c.latest.month, locale)}</div>
                <div className="col-span-2 pl-6 flex items-center gap-1.5 text-[#aaa]">
                  {trendIcon(c.trend)}
                  <span>{c.delta12mBps == null ? "—" : signed(c.delta12mBps)}</span>
                  {c.trend && <span className="text-[9px] text-[#666]">{t(`spreads.${c.trend}`)}</span>}
                </div>
                <div className="col-span-1 text-right text-[#888]">{avgYear && c.annual[avgYear] != null ? signed(c.annual[avgYear]) : "—"}</div>
                <div className="col-span-2 text-right text-[#666]">{nf(c.latest.localPct)} / {nf(c.latest.usPct)}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-[9px] font-mono text-[#555]">
          <span data-term="derived">{term("derived", locale)}</span> · <span data-term="verified">{term("verified", locale)}</span> · {t("spreads.trendRule")}
        </p>
        {gaps.length > 0 && (
          <div className="mt-4 border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2" data-gaps="spreads">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-1">{t("spreads.gapsTitle")}</div>
            <ul className="space-y-0.5">
              {gaps.map((g) => (
                <li key={g.flag} className="text-[10px] font-mono text-[#777]"><span className="text-[#aaa]">{locale === "pt" ? g.countryPt : g.country}</span> — {locale === "pt" ? g.reasonPt : g.reasonEn}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4">
          <button onClick={() => onSourceClick("oecd-mei-fred")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("spreads.source")}: OECD Main Economic Indicators (FRED) →</button>
        </div>
      </div>
    </section>
  );
}
