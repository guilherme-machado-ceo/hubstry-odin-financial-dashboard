import { useRef } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, Cell } from "recharts";
import { stabilityScores } from "@/data/lcBondsData";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { Share2 } from "lucide-react";
import { inRegion, type Region } from "@/data/regions";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; regionFilter: Region; }

export default function StabilityScatter({ onSourceClick, onEmbedClick, regionFilter }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  const filtered = stabilityScores.filter((s) => {
    return inRegion(s.flag, regionFilter);
  });

  const scatterData = filtered.map((s) => ({ x: s.lcDebtShare, y: s.stabilityScore, z: 200, name: locale === "pt" ? s.countryPt : s.country, flag: s.flag }));
  const colors: Record<string, string> = { BR: "#00FFFF", CN: "#FF4444", IN: "#FF8C00", RU: "#888888", ZA: "#44AAFF", MX: "#44FF44", AR: "#FF00FF", CO: "#FFFF00", CL: "#0088FF" };

  return (
    <section id="stability" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1"><EstBadge /></div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("stability.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1">{t("stability.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="stability-scatter" jsonData={{ scores: filtered }} />
            <button onClick={() => onEmbedClick("stability")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis type="number" dataKey="x" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} label={{ value: t("stability.xAxis"), position: "bottom", offset: 10, style: { fontSize: 9, fill: "#555" } }} domain={[0, 100]} />
              <YAxis type="number" dataKey="y" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} label={{ value: t("stability.yAxis"), angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 9, fill: "#555" } }} domain={[0, 100]} />
              <ZAxis type="number" dataKey="z" range={[100, 400]} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} />
              <Scatter data={scatterData}>
                {scatterData.map((entry, index) => <Cell key={index} fill={colors[entry.flag] || "#888"} fillOpacity={0.8} stroke={colors[entry.flag] || "#888"} strokeWidth={1} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {filtered.map((s) => <div key={s.flag} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[s.flag] || "#888" }} /><span className="text-[9px] font-mono text-[#666]">{locale === "pt" ? s.countryPt : s.country}</span></div>)}
        </div>
        <div className="mt-4"><button onClick={() => onSourceClick("imf-weo")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("stability.source")}: IMF WEO / BIS →</button></div>
      </div>
    </section>
  );
}
