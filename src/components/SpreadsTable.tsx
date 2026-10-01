import { useRef } from "react";
import { spreadsData } from "@/data/lcBondsData";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { Share2, TrendingDown, Minus, TrendingUp } from "lucide-react";
import { inRegion, type Region } from "@/data/regions";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; regionFilter: Region; }

export default function SpreadsTable({ onSourceClick, onEmbedClick, regionFilter }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  const filtered = spreadsData.filter((s) => {
    return inRegion(s.flag, regionFilter);
  });

  const trendIcon = (trend: string) => {
    if (trend === "reduzindo") return <TrendingDown size={12} className="text-[#00FF88]" />;
    if (trend === "estavel") return <Minus size={12} className="text-[#888]" />;
    return <TrendingUp size={12} className="text-[#FF4444]" />;
  };

  const trendColor = (trend: string) => {
    if (trend === "reduzindo") return "text-[#00FF88]";
    if (trend === "estavel") return "text-[#888]";
    return "text-[#FF4444]";
  };

  const trendLabel = (trend: string) => {
    if (locale === "pt") {
      if (trend === "reduzindo") return "Reduzindo";
      if (trend === "estavel") return "Estavel";
      return "Ampliando";
    }
    return trend;
  };

  return (
    <section id="spreads" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1"><EstBadge /></div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("spreads.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1">{t("spreads.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="spreads-volatility" jsonData={{ spreads: filtered }} />
            <button onClick={() => onEmbedClick("spreads")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="border border-[#1a1a1a] overflow-hidden">
          <div className="grid grid-cols-12 gap-0 bg-[#111] border-b border-[#1a1a1a] text-[9px] font-mono uppercase tracking-widest text-[#555] py-2 px-3">
            <div className="col-span-3">{t("spreads.country")}</div><div className="col-span-2 text-right">{t("spreads.spread2025e")}</div><div className="col-span-3">{t("spreads.trend")}</div><div className="col-span-2 text-right">{t("spreads.volatility")}</div><div className="col-span-2 text-right">{t("section3.official")}</div>
          </div>
          {filtered.map((s, i) => (
            <div key={s.country} className={`grid grid-cols-12 gap-0 py-2.5 px-3 text-[12px] font-mono transition-colors hover:bg-[#0e0e0e] ${i < filtered.length - 1 ? "border-b border-[#111]" : ""} ${s.flag === "BR" ? "bg-[#00FFFF]/5" : ""}`}>
              <div className="col-span-3 flex items-center gap-2">
                <span className="text-[14px]">{String.fromCodePoint(...[...s.flag.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))}</span>
                <span className={s.flag === "BR" ? "text-[#00FFFF] font-bold" : "text-[#aaa]"}>{locale === "pt" ? s.countryPt : s.country}</span>
              </div>
              <div className={`col-span-2 text-right font-bold ${s.spread2025e > 0 ? "text-[#FF8C00]" : "text-[#00FF88]"}`}>{s.spread2025e > 0 ? "+" : ""}{s.spread2025e}</div>
              <div className="col-span-3 flex items-center gap-1.5">
                {trendIcon(s.trend)}
                <span className={trendColor(s.trend)}>{trendLabel(s.trend)}</span>
              </div>
              <div className="col-span-2 text-right text-[#aaa]">{s.volatility2025e}%</div>
              <div className="col-span-2 text-right text-[#555]">{s.officialSpread ? `${s.officialSpread > 0 ? "+" : ""}${s.officialSpread}` : "—"}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => onSourceClick("bloomberg")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("spreads.source")}: Bloomberg / Alpha Vantage →</button>
          <span className="text-[9px] font-mono text-[#444]">{t("spreads.fxLabel")}</span>
        </div>
      </div>
    </section>
  );
}
