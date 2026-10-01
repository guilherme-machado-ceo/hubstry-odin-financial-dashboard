import { useRef } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { goldReserves, goldShare } from "@/data/goldOilData";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import { Share2 } from "lucide-react";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; }

export default function GoldReservesChart({ onSourceClick, onEmbedClick }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();

  return (
    <section id="gold" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("gold.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1 max-w-2xl leading-relaxed">{t("gold.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="gold-reserves" jsonData={{ goldReserves, goldShare }} />
            <button onClick={() => onEmbedClick("gold")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={goldReserves} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gC" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF4444" stopOpacity={0.15}/><stop offset="95%" stopColor="#FF4444" stopOpacity={0}/></linearGradient>
                <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FFD700" stopOpacity={0.15}/><stop offset="95%" stopColor="#FFD700" stopOpacity={0}/></linearGradient>
                <linearGradient id="gI" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF8C00" stopOpacity={0.15}/><stop offset="95%" stopColor="#FF8C00" stopOpacity={0}/></linearGradient>
                <linearGradient id="gB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00FFFF" stopOpacity={0.15}/><stop offset="95%" stopColor="#00FFFF" stopOpacity={0}/></linearGradient>
                <linearGradient id="gT" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#FF00FF" stopOpacity={0.15}/><stop offset="95%" stopColor="#FF00FF" stopOpacity={0}/></linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#44FF44" stopOpacity={0.15}/><stop offset="95%" stopColor="#44FF44" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} label={{ value: "tonnes", angle: -90, position: "insideLeft", offset: 10, style: { fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" } }} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} />
              <Legend wrapperStyle={{ fontSize: 10, fontFamily: "JetBrains Mono", color: "#555" }} />
              <Area type="monotone" dataKey="China" name={t("gold.seriesChina")} stroke="#FF4444" strokeWidth={1.5} fill="url(#gC)" dot={false} />
              <Area type="monotone" dataKey="Russia" name={t("gold.seriesRussia")} stroke="#FFD700" strokeWidth={1.5} fill="url(#gR)" dot={false} />
              <Area type="monotone" dataKey="India" name={t("gold.seriesIndia")} stroke="#FF8C00" strokeWidth={1.5} fill="url(#gI)" dot={false} />
              <Area type="monotone" dataKey="Brazil" name={t("gold.seriesBrazil")} stroke="#00FFFF" strokeWidth={1.5} fill="url(#gB)" dot={false} />
              <Area type="monotone" dataKey="Turkey" name={t("gold.seriesTurkey")} stroke="#FF00FF" strokeWidth={1} strokeDasharray="4 4" fill="url(#gT)" dot={false} />
              <Area type="monotone" dataKey="Poland" name={t("gold.seriesPoland")} stroke="#44FF44" strokeWidth={1} strokeDasharray="4 4" fill="url(#gP)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-6 border border-[#1a1a1a]">
          <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]"><span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">{t("goldShare.title")}</span></div>
          <div className="grid grid-cols-12 gap-0 bg-[#111] border-b border-[#1a1a1a] text-[9px] font-mono uppercase tracking-widest text-[#555] py-2 px-3">
            <div className="col-span-4">{t("goldShare.country")}</div><div className="col-span-4 text-right">{t("goldShare.goldPct")}</div><div className="col-span-4"><span className="text-[8px]">Bar</span></div>
          </div>
          {[...goldShare].sort((a, b) => b.pct2025 - a.pct2025).map((g, i) => (
            <div key={g.flag} className={`grid grid-cols-12 gap-0 py-2 px-3 text-[11px] font-mono ${i < goldShare.length - 1 ? "border-b border-[#111]" : ""} hover:bg-[#0e0e0e] transition-colors`}>
              <div className="col-span-4 flex items-center gap-2">
                <span className="text-[14px]">{String.fromCodePoint(...[...g.flag.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0)))}</span>
                <span className={g.flag === "BR" ? "text-[#00FFFF] font-bold" : "text-[#aaa]"}>{locale === "pt" ? g.countryPt : g.country}</span>
              </div>
              <div className="col-span-4 text-right font-bold text-[#FFD700]">{g.pct2025}%</div>
              <div className="col-span-4 flex items-center"><div className="w-full h-1.5 bg-[#222]"><div className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF8C00]" style={{ width: `${Math.min(g.pct2025, 100)}%` }} /></div></div>
            </div>
          ))}
        </div>
        <div className="mt-4"><button onClick={() => onSourceClick("wgc-ifs")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("gold.source")} →</button></div>
      </div>
    </section>
  );
}
