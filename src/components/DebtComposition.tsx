import { useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { countryDebtData, latestYearIndex } from "@/data/lcBondsData";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { Share2 } from "lucide-react";
import { inRegion, type Region } from "@/data/regions";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; regionFilter: Region; }

export default function DebtComposition({ onSourceClick, onEmbedClick, regionFilter }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  // Pertencimento por bandeira (fonte única em regions.ts): o Brasil está em BRICS e em LATAM,
  // como nas demais seções — antes, pelo campo `region`, ele sumia do filtro BRICS.
  const filtered = countryDebtData.filter((c) => inRegion(c.flag, regionFilter));
  const chartData = filtered.map((c) => ({ country: locale === "pt" ? c.countryPt : c.country, countryEn: c.country, localCurrency: c.localCurrencyDebt[latestYearIndex], foreignCurrency: c.foreignCurrencyDebt[latestYearIndex], total: c.totalDebt[latestYearIndex], debtToGDP: c.debtToGDP, debtToGDPLabel: c.debtToGDPLabel, debtToGDPSource: c.debtToGDPSource, debtToGDPSnapshot: c.debtToGDPSnapshot }));

  return (
    <section id="debt-composition" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("section5.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1">{t("section5.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="debt-composition" jsonData={{ composition: chartData }} />
            <button onClick={() => onEmbedClick("debt-composition")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="country" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#555" }} />
              <Bar dataKey="localCurrency" name="LC Debt %" stackId="a" fill="#00FFFF" barSize={40} />
              <Bar dataKey="foreignCurrency" name="FX Debt %" stackId="a" fill="#333" barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 border border-[#1a1a1a]">
          <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]"><span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">{t("section5.debtToGdp")} — {t("section5.official")} vs. {t("section5.estimated")}</span></div>
          <div className="grid grid-cols-12 gap-0 bg-[#111] border-b border-[#1a1a1a] text-[9px] font-mono uppercase tracking-widest text-[#555] py-2 px-3">
            <div className="col-span-3">{t("spreads.country")}</div><div className="col-span-2 text-right">{t("section5.official")}</div><div className="col-span-2 text-right">{t("section5.estimated")}</div><div className="col-span-2 text-right">{t("section5.vsEst")}</div><div className="col-span-3">{t("sourceOverlay.source")}</div>
          </div>
          {chartData.map((c, i) => (
            <div key={c.countryEn} className={`grid grid-cols-12 gap-0 py-2 px-3 text-[11px] font-mono ${i < chartData.length - 1 ? "border-b border-[#111]" : ""} hover:bg-[#0e0e0e] transition-colors`}>
              <div className="col-span-3 font-bold text-[#aaa]">{c.country}</div>
              <div className="col-span-2 text-right text-[#555]">{c.debtToGDPSource === "2025e" ? "—" : c.debtToGDPLabel}</div>
              <div className="col-span-2 text-right text-[#e0e0e0]">{c.debtToGDPLabel}</div>
              <div className="col-span-2 text-right">{c.debtToGDPSource !== "2025e" ? <span className="text-[#FF8C00]">est.</span> : <EstBadge />}</div>
              <div className="col-span-3 text-[8px] text-[#444]">{c.debtToGDPSource} · {c.debtToGDPSnapshot}</div>
            </div>
          ))}
        </div>
        <div className="mt-4"><button onClick={() => onSourceClick("imf-weo")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("section5.source")}: IMF WEO / BIS / BCB →</button></div>
      </div>
    </section>
  );
}
