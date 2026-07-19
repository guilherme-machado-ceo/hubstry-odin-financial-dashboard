// ============================================================
// SEÇÃO 15 — CARBON PRICING & CBAM
// Preço oficial do certificado CBAM (Comissão Europeia), instrumentos
// globais de precificação (World Bank), CO2 por consumo (snapshot OWID)
// e timeline regulatória do regime definitivo (desde 01/01/2026).
// ============================================================
import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line, Legend } from "recharts";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import { Share2, Landmark, Globe2, Scale, CalendarClock } from "lucide-react";
import { fetchSnapshot, formatUpdatedAt } from "@/lib/api";
import { CBAM_CERT_PRICES, CBAM_TIMELINE, CBAM_SECTORS, CARBON_INSTRUMENTS, FALLBACK_OWID } from "@/data/carbonData";
import type { OwidSeries } from "@/data/carbonData";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; }

const OWID_COLORS: Record<string, string> = { BRA: "#00FFFF", CHN: "#FF4444", IND: "#FF8C00", USA: "#4488FF", OWID_EU27: "#00FF88" };
const STATUS_COLORS: Record<string, string> = { done: "#00FF88", next: "#FF8C00", future: "#555" };

export default function CarbonPricingSection({ onSourceClick, onEmbedClick }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [owid, setOwid] = useState<OwidSeries[]>(FALLBACK_OWID);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const locale = getLocale();

  useEffect(() => {
    fetchSnapshot<{ series: OwidSeries[] }>("owid-co2.json", { series: FALLBACK_OWID })
      .then((res) => { setOwid(res.data.series); setUpdatedAt(res.updatedAt); });
  }, []);

  // Série unificada para o LineChart: [{year, BRA, CHN, ...}]
  const years = [...new Set(owid.flatMap((s) => s.points.map((p) => p[0])))].sort((a, b) => a - b);
  const owidChart = years.map((y) => {
    const row: Record<string, number> = { year: y };
    for (const s of owid) {
      const pt = s.points.find((p) => p[0] === y);
      if (pt) row[s.code] = pt[1];
    }
    return row;
  });

  const currentCert = CBAM_CERT_PRICES.filter((c) => c.priceEur !== null).at(-1);
  const certChart = CBAM_CERT_PRICES.filter((c) => c.priceEur !== null);
  const instruments = [...CARBON_INSTRUMENTS].sort((a, b) => b.valueUsd - a.valueUsd);
  const jsonData = { cbamCertPrices: CBAM_CERT_PRICES, instruments: CARBON_INSTRUMENTS, owidConsumptionCo2: owid };

  return (
    <section id="carbon" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-[#00FFFF] border border-[#00FFFF]/30 px-1.5 py-0.5">
                <Landmark size={10} />
                {t("carbon.badgeOfficial")}
                {updatedAt && <span className="text-[#00FFFF]/60">· {t("carbon.badgeSnapshot")} {formatUpdatedAt(updatedAt, locale)}</span>}
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("carbon.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1 max-w-2xl leading-relaxed">{t("carbon.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="carbon-pricing-cbam" jsonData={jsonData} />
            <button onClick={() => onEmbedClick("carbon")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] mb-6">
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Landmark size={14} className="text-[#00FFFF]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("carbon.kpiCert")}</div>
              <div className="text-lg font-mono font-bold text-[#00FFFF]">€{currentCert?.priceEur?.toFixed(2)}/t</div>
              <div className="text-[8px] font-mono text-[#444]">{currentCert?.quarter} · EU ETS auction avg.</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Scale size={14} className="text-[#FF8C00]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("carbon.kpiThreshold")}</div>
              <div className="text-lg font-mono font-bold text-[#FF8C00]">50 t/ano</div>
              <div className="text-[8px] font-mono text-[#444]">Reg. (UE) 2025/2083</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Globe2 size={14} className="text-[#00FF88]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("carbon.kpiSectors")}</div>
              <div className="text-lg font-mono font-bold text-[#00FF88]">6 (+180)</div>
              <div className="text-[8px] font-mono text-[#444]">{t("carbon.kpiSectorsNote")}</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <CalendarClock size={14} className="text-[#FF4444]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("carbon.kpiSurrender")}</div>
              <div className="text-lg font-mono font-bold text-[#FF4444]">30/09/2027</div>
              <div className="text-[8px] font-mono text-[#444]">{t("carbon.kpiSurrenderNote")}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Preço oficial do certificado CBAM */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("carbon.certChartTitle")}</div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={certChart} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: "#888", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(v: number) => [`€${v.toFixed(2)}/tCO₂e`, "CBAM"]} />
                  <Bar dataKey="priceEur" barSize={36} radius={[2, 2, 0, 0]}>
                    {certChart.map((_, i) => <Cell key={i} fill="#00FFFF" fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] font-mono text-[#444] mt-1">{t("carbon.certPendingNote")}</div>
          </div>

          {/* Instrumentos globais de precificação */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("carbon.instrumentsTitle")}</div>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={instruments} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 9, fill: "#888", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} width={130} />
                  <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(v: number) => [`≈ $${v}/tCO₂e`, t("carbon.price")]} />
                  <Bar dataKey="valueUsd" barSize={12} radius={[0, 2, 2, 0]}>
                    {instruments.map((entry, i) => <Cell key={i} fill={entry.name === "EU ETS" ? "#00FFFF" : "#4488FF"} fillOpacity={0.75} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] font-mono text-[#444] mt-1">{t("carbon.instrumentsNote")}</div>
          </div>
        </div>

        {/* CO2 por consumo — o recorte das emissões embutidas */}
        <div className="mb-6">
          <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("carbon.owidTitle")}</div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={owidChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                <XAxis dataKey="year" tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(v: number, name: string) => [`${v} t`, owid.find((s) => s.code === name)?.country ?? name]} />
                <Legend wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono", color: "#888" }} formatter={(v: string) => owid.find((s) => s.code === v)?.country ?? v} />
                {owid.map((s) => (
                  <Line key={s.code} type="monotone" dataKey={s.code} stroke={OWID_COLORS[s.code] || "#888"} strokeWidth={1.5} dot={false} connectNulls />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[8px] font-mono text-[#444] mt-1">{t("carbon.owidNote")}</div>
        </div>

        {/* Timeline regulatória + setores */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("carbon.timelineTitle")}</div>
            <div className="space-y-2">
              {CBAM_TIMELINE.map((m, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-[10px] font-mono font-bold w-14 shrink-0 pt-0.5" style={{ color: STATUS_COLORS[m.status] }}>{m.date}</span>
                  <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: STATUS_COLORS[m.status] }} />
                  <span className="text-[10px] font-mono text-[#999] leading-relaxed">{locale === "pt" ? m.labelPt : m.labelEn}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("carbon.sectorsTitle")}</div>
            <div className="flex flex-wrap gap-2 mb-4">
              {CBAM_SECTORS.map((s) => (
                <span key={s.nameEn} className="text-[10px] font-mono text-[#00FFFF] border border-[#00FFFF]/30 px-2 py-1">{locale === "pt" ? s.namePt : s.nameEn}</span>
              ))}
              <span className="text-[10px] font-mono text-[#555] border border-[#222] px-2 py-1">+180 cat. downstream (2028)</span>
            </div>
            <div className="border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-4">
              <div className="text-[10px] font-mono font-bold text-[#00FFFF] uppercase tracking-widest mb-2">{t("carbon.brazilTitle")}</div>
              <p className="text-[11px] font-mono text-[#999] leading-relaxed">{t("carbon.brazilText")}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button onClick={() => onSourceClick("ec-cbam")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("carbon.source")}: Comissão Europeia (TAXUD) →</button>
          <button onClick={() => onSourceClick("worldbank-carbon")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">World Bank Carbon Pricing →</button>
          <button onClick={() => onSourceClick("owid")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">Our World in Data →</button>
        </div>
      </div>
    </section>
  );
}
