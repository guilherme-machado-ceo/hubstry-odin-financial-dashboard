import { useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { volatilityRanking, volatilityDetails } from "@/data/lcBondsData";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { Share2 } from "lucide-react";
import { inRegion, type Region } from "@/data/regions";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; regionFilter: Region; }

export default function VolatilityChart({ onSourceClick, onEmbedClick, regionFilter }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  const filtered = volatilityRanking.filter((v) => {
    return inRegion(v.flag, regionFilter);
  });
  const chartData = [...filtered].reverse();
  // A tabela de detalhes obedece ao mesmo filtro do ranking.
  const detailsFiltered = volatilityDetails.filter((v) => inRegion(v.flag, regionFilter));

  return (
    <section id="volatility" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1"><EstBadge /></div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("section3.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1">{t("section3.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="volatility-ranking" jsonData={{ ranking: filtered, details: detailsFiltered }} />
            <button onClick={() => onEmbedClick("volatility")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="code" tick={{ fontSize: 11, fill: "#888", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} width={40} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(value: number) => [`${value}%`, "Volatility"]} />
              <Bar dataKey="volatility" radius={[0, 2, 2, 0]} barSize={20}>
                {chartData.map((entry, index) => <Cell key={index} fill={entry.code === "BRL" ? "#00FFFF" : "#333"} stroke={entry.code === "BRL" ? "#00FFFF" : "none"} strokeWidth={entry.code === "BRL" ? 1 : 0} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#00FFFF]" /><span className="text-[9px] font-mono text-[#888]">BRL (Brasil)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 bg-[#333]" /><span className="text-[9px] font-mono text-[#888]">Outros G20</span></div>
        </div>
        <div className="mt-6 border border-[#1a1a1a]">
          <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]"><span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">{t("section3.tableTitle")}</span></div>
          <div className="grid grid-cols-12 gap-0 bg-[#111] border-b border-[#1a1a1a] text-[9px] font-mono uppercase tracking-widest text-[#555] py-2 px-3">
            <div className="col-span-3">{t("section3.currency")}</div><div className="col-span-3">{t("spreads.country")}</div><div className="col-span-3 text-right">{t("section3.official")}</div><div className="col-span-3 text-right">{t("section3.estimated")}</div>
          </div>
          {detailsFiltered.map((v, i) => (
            <div key={v.currency} className={`grid grid-cols-12 gap-0 py-2 px-3 text-[11px] font-mono ${i < detailsFiltered.length - 1 ? "border-b border-[#111]" : ""} hover:bg-[#0e0e0e] transition-colors`}>
              <div className="col-span-3 font-bold text-[#aaa]">{v.currency}</div>
              <div className="col-span-3 text-[#888]">{locale === "pt" ? v.countryPt : v.country}</div>
              <div className="col-span-3 text-right text-[#555]">{v.official ? `${v.official}%` : "—"}</div>
              <div className="col-span-3 text-right text-[#FF8C00] font-bold">{v.estimated2025e}%</div>
            </div>
          ))}
        </div>
        <div className="mt-4"><button onClick={() => onSourceClick("bloomberg")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("section3.source")}: Bloomberg Terminal / Alpha Vantage →</button></div>
      </div>
    </section>
  );
}
