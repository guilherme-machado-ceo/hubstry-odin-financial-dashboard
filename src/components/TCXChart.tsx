import { useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { tcxHedgingData, kpis } from "@/data/lcBondsData";
import { t } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { Share2 } from "lucide-react";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; }

export default function TCXChart({ onSourceClick, onEmbedClick }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  return (
    <section id="tcx" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1"><EstBadge /></div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("section4.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1">{t("section4.subtitle")} · {kpis.tcxCurrencies} {t("hero.kpiCurrencies")} · 2025e</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="tcx-hedging" jsonData={{ tcx: tcxHedgingData, summary: { currencies: kpis.tcxCurrencies, portfolioLatest: tcxHedgingData[tcxHedgingData.length - 1].portfolioOutstanding } }} />
            <button onClick={() => onEmbedClick("tcx")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={tcxHedgingData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v}bi`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#555" }} />
              <Line yAxisId="left" type="monotone" dataKey="annualHedged" name={t("section4.seriesHedged")} stroke="#00FFFF" strokeWidth={1.5} dot={false} />
              <Line yAxisId="left" type="monotone" dataKey="portfolioOutstanding" name={t("section4.seriesOutstanding")} stroke="#e0e0e0" strokeWidth={1.5} dot={false} />
              <Line yAxisId="right" type="monotone" dataKey="currencies" name={t("section4.seriesCurrencies")} stroke="#FF8C00" strokeWidth={1} strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4"><button onClick={() => onSourceClick("tcx")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("section4.source")}: TCX Global / BIS →</button></div>
      </div>
    </section>
  );
}
