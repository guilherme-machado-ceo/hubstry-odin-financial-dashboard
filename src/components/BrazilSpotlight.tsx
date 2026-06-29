import { useRef } from "react";
import { inflectionPoints, countryDebtData, kpis, latestYearIndex } from "@/data/lcBondsData";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { ArrowRight, ChevronRight, Share2 } from "lucide-react";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; }

function FXInfrastructureSVG() {
  const nodes = [
    { id: "B3", label: "B3", labelPt: "B3", x: 50, y: 280, color: "#00FFFF" },
    { id: "CFETS", label: "CFETS", labelPt: "CFETS", x: 250, y: 100, color: "#FF8C00" },
    { id: "CIPS", label: "CIPS", labelPt: "CIPS", x: 450, y: 200, color: "#00FFFF" },
    { id: "NDB", label: "NDB", labelPt: "NDB", x: 350, y: 380, color: "#FF8C00" },
    { id: "TCX", label: "TCX", labelPt: "TCX", x: 150, y: 420, color: "#00FF88" },
  ];
  const edges = [
    { from: "B3", to: "CFETS", label: "Bond Connect" },
    { from: "CFETS", to: "CIPS", label: "CNY Settlement" },
    { from: "CIPS", to: "NDB", label: "ML Disbursement" },
    { from: "NDB", to: "TCX", label: "Hedge" },
    { from: "TCX", to: "B3", label: "BRL Flow" },
  ];
  return (
    <svg viewBox="0 0 500 500" className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-700">
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00FFFF" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#00FFFF" stopOpacity="0" />
        </radialGradient>
        <filter id="blur">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="500" height="500" fill="#0a0a0a" />
      {/* Grid background */}
      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a1a1a" strokeWidth="0.5" />
      </pattern>
      <rect width="500" height="500" fill="url(#grid)" />
      {/* Edges */}
      {edges.map((e) => {
        const a = nodes.find((n) => n.id === e.from)!;
        const b = nodes.find((n) => n.id === e.to)!;
        return (
          <g key={`${e.from}-${e.to}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#1a1a1a" strokeWidth="1.5" />
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={a.color} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 4">
              <animate attributeName="stroke-dashoffset" from="0" to="8" dur="2s" repeatCount="indefinite" />
            </line>
            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 5} fill="#555" fontSize="7" fontFamily="JetBrains Mono, monospace" textAnchor="middle">{e.label}</text>
          </g>
        );
      })}
      {/* Nodes */}
      {nodes.map((n) => (
        <g key={n.id}>
          <circle cx={n.x} cy={n.y} r="30" fill="url(#glow)" />
          <circle cx={n.x} cy={n.y} r="8" fill={n.color} fillOpacity="0.2" stroke={n.color} strokeWidth="1" />
          <text x={n.x} y={n.y - 18} fill={n.color} fontSize="10" fontFamily="JetBrains Mono, monospace" fontWeight="bold" textAnchor="middle">{n.id}</text>
        </g>
      ))}
      {/* Pulse rings */}
      {nodes.map((n, i) => (
        <circle key={`pulse-${n.id}`} cx={n.x} cy={n.y} r="8" fill="none" stroke={n.color} strokeWidth="0.5" opacity="0.6">
          <animate attributeName="r" from="8" to="25" dur="3s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
          <animate attributeName="opacity" from="0.6" to="0" dur="3s" begin={`${i * 0.6}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export default function BrazilSpotlight({ onSourceClick, onEmbedClick }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  const brazil = countryDebtData.find((c) => c.country === "Brazil")!;
  const latestLC = brazil.localCurrencyDebt[latestYearIndex];
  const latestFC = brazil.foreignCurrencyDebt[latestYearIndex];
  const ndbProgress = (kpis.ndbLCShare / kpis.ndbLCTarget) * 100;

  return (
    <section id="brazil-spotlight" className="border-b border-[#1a1a1a] bg-[#050505] relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#00FFFF]/30 to-transparent" />
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-[#00FFFF]" />
              <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#00FFFF]">{t("brazilSticky.label")}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#e0e0e0] tracking-tight">{t("section1.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1">{t("section1.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="brazil-spotlight" jsonData={{ brazil: { lcDebt: latestLC, fcDebt: latestFC, debtToGDP: kpis.dividaBrutaBR } }} />
            <button onClick={() => onEmbedClick("brazil-spotlight")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
              {inflectionPoints.map((point) => (
                <div key={point.event} className="bg-[#111] p-4 group hover:bg-[#161616] transition-colors relative">
                  {point.isEstimated && <div className="absolute top-2 right-2"><EstBadge /></div>}
                  <div className="text-[9px] font-mono text-[#00FFFF] mb-1">{point.year}</div>
                  <div className="text-[11px] font-mono text-[#aaa] mb-2 group-hover:text-[#e0e0e0] transition-colors">{locale === "pt" ? point.eventPt : point.event}</div>
                  <div className="text-[16px] font-mono font-bold text-[#e0e0e0]">{point.value}</div>
                  <button onClick={() => onSourceClick("bloomberg")} className="text-[8px] font-mono text-[#444] mt-2 hover:text-[#00FFFF] transition-colors">{point.source} →</button>
                </div>
              ))}
            </div>

            <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#555]">{t("section1.ndbProgress")}</span>
                <span className="text-[9px] font-mono text-[#00FFFF]">{kpis.ndbLCShare}% → {kpis.ndbLCTarget}%</span>
              </div>
              <div className="w-full h-2 bg-[#222] relative">
                <div className="h-full bg-gradient-to-r from-[#00FFFF] to-[#00FF88] transition-all duration-1000" style={{ width: `${ndbProgress}%` }} />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[8px] font-mono text-[#444]">0%</span>
                <span className="text-[8px] font-mono text-[#00FFFF]">Current: {kpis.ndbLCShare}%</span>
                <span className="text-[8px] font-mono text-[#00FF88]">Target: {kpis.ndbLCTarget}%</span>
              </div>
            </div>

            <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-4">{t("section1.infographic")}</div>
              <div className="flex flex-col md:flex-row items-stretch gap-0">
                {[t("section1.flowStep1"), t("section1.flowStep2"), t("section1.flowStep3"), t("section1.flowStep4"), t("section1.flowStep5")].map((step, i) => (
                  <div key={i} className="flex md:flex-col items-center flex-1">
                    <div className="bg-[#111] border border-[#222] p-3 flex-1 w-full flex md:flex-col items-center gap-2 md:gap-1 group hover:border-[#00FFFF]/30 transition-colors">
                      <span className="text-[10px] font-mono text-[#00FFFF] w-5 h-5 flex items-center justify-center border border-[#00FFFF]/30 shrink-0">{i + 1}</span>
                      <span className="text-[9px] font-mono text-[#aaa] text-center leading-tight group-hover:text-[#e0e0e0] transition-colors">{step}</span>
                    </div>
                    {i < 4 && <div className="flex md:hidden items-center justify-center w-4"><ChevronRight size={10} className="text-[#333]" /></div>}
                    {i < 4 && <div className="hidden md:flex items-center justify-center h-3"><div className="w-px h-full bg-[#222]" /></div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
              <div className="bg-[#111] p-4">
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-2">{t("brazilSticky.lcDebt")}</div>
                <div className="text-2xl font-mono font-bold text-[#00FFFF]">{latestLC}%</div>
                <div className="w-full h-1 bg-[#222] mt-2"><div className="h-full bg-[#00FFFF]" style={{ width: `${latestLC}%` }} /></div>
              </div>
              <div className="bg-[#111] p-4">
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-2">{t("brazilSticky.fcDebt")}</div>
                <div className="text-2xl font-mono font-bold text-[#FF8C00]">{latestFC}%</div>
                <div className="w-full h-1 bg-[#222] mt-2"><div className="h-full bg-[#FF8C00]" style={{ width: `${latestFC}%` }} /></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="border border-[#1a1a1a] bg-[#0a0a0a] h-full min-h-[400px] relative overflow-hidden group">
              <FXInfrastructureSVG />
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent">
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-[#00FFFF]">FOREIGN EXCHANGE INFRASTRUCTURE</span>
                <div className="text-[10px] font-mono text-[#555] mt-1">B3 / CFETS / CIPS / NDB / TCX</div>
              </div>
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#00FFFF]/30" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#00FFFF]/30" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-[#00FFFF]/30" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-[#00FFFF]/30" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <button onClick={() => onSourceClick("bcb")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("section1.source")}: BCB / PBOC / NDB / CIPS →</button>
          <a href="#" className="text-[10px] font-mono text-[#00FFFF] hover:underline flex items-center gap-1">{t("section1.readAnalysis")} <ArrowRight size={10} /></a>
        </div>
      </div>
    </section>
  );
}
