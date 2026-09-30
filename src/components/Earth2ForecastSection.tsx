import { useEffect, useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { t, getLocale } from "@/i18n";
import EstBadge from "./EstBadge";
import { Radio, Thermometer, Wind, Gauge, Satellite } from "lucide-react";

// ============================================================
// EARTH-2 FORECAST — previsao FourCastNet (NVIDIA Earth-2)
// Consome public/data/earth2-forecast.json, gerado 2x/dia pelo
// workflow "ODIN Earth-2 Forecast" (scripts/earth2/fetch_earth2.py).
// Padrao snapshot: zero chamada de API no cliente.
// ============================================================

interface ForecastPoint {
  leadHours: number;
  time: string;
  t2mC: number;
  wind10mMs: number;
  mslHPa: number;
}

interface Earth2City {
  city: string;
  cityPt: string;
  country: string;
  flag: string;
  lat: number;
  lon: number;
  forecast: ForecastPoint[];
  riskScore: number;
  type: string;
}

interface Earth2Snapshot {
  updatedAt: string;
  source: string;
  sourceUrl: string;
  model: string;
  initTime: string;
  horizonHours: number;
  data: { cities: Earth2City[] };
}

const CITY_COLORS = [
  "#00FF88", "#4488FF", "#FF8C00", "#FF4444",
  "#00FFFF", "#FF00FF", "#FFD700", "#9D7BFF",
];

const RISK_LABELS: Record<string, { pt: string; en: string }> = {
  storm:   { pt: "Tempestade",    en: "Storm" },
  heat:    { pt: "Calor extremo", en: "Extreme heat" },
  drought: { pt: "Estresse",      en: "Stress" },
  normal:  { pt: "Normal",        en: "Normal" },
};

interface Props {
  onSourceClick?: (id: string) => void;
}

export default function Earth2ForecastSection({ onSourceClick }: Props) {
  const locale = getLocale();
  const [snapshot, setSnapshot] = useState<Earth2Snapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string>("Brasilia");

  useEffect(() => {
    async function load() {
      try {
        const base = import.meta.env.BASE_URL || "/";
        const res = await fetch(`${base}data/earth2-forecast.json`, {
          signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: Earth2Snapshot = await res.json();
        if (!json?.data?.cities?.length) throw new Error("snapshot vazio");
        setSnapshot(json);
      } catch {
        setFailed(true);
      }
    }
    load();
  }, []);

  const cities = useMemo(() => snapshot?.data.cities ?? [], [snapshot]);

  // Serie do grafico: temperatura prevista por cidade, eixo X em dias (D+0..D+10)
  const chartData = useMemo(() => {
    if (!cities.length) return [];
    const byLead = new Map<number, Record<string, number>>();
    for (const c of cities) {
      for (const p of c.forecast) {
        if (p.leadHours % 24 !== 0) continue; // 1 ponto/dia para legibilidade
        const row = byLead.get(p.leadHours) ?? {};
        row[c.city] = p.t2mC;
        byLead.set(p.leadHours, row);
      }
    }
    return [...byLead.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([lead, row]) => ({ day: `D+${lead / 24}`, ...row }));
  }, [cities]);

  const selectedCity = cities.find((c) => c.city === selected) ?? cities[0];

  const fmtUpdated = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
          day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
        })
      : "";

  return (
    <section id="earth2" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {snapshot && !failed ? (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-[#76b900] border border-[#76b900]/30 px-1.5 py-0.5">
                  <Radio size={10} className="animate-pulse" />
                  NVIDIA EARTH-2
                  {snapshot.updatedAt && (
                    <span className="text-[#76b900]/60">— {fmtUpdated(snapshot.updatedAt)}</span>
                  )}
                </span>
              ) : (
                <EstBadge />
              )}
            </div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">
              {locale === "pt"
                ? "Previsão Climática — NVIDIA Earth-2 (FourCastNet)"
                : "Climate Forecast — NVIDIA Earth-2 (FourCastNet)"}
            </h2>
            <p className="text-[11px] font-mono text-[#555] mt-1 max-w-2xl leading-relaxed">
              {locale === "pt"
                ? `Previsão de ${snapshot?.horizonHours ?? 240}h gerada por IA (inferência hospedada NVIDIA), atualizada 2x/dia a partir do ciclo GFS mais recente. Complementa o Climate Vector, que mede anomalias passadas.`
                : `${snapshot?.horizonHours ?? 240}h AI-generated forecast (NVIDIA hosted inference), refreshed twice daily from the latest GFS cycle. Complements the Climate Vector, which tracks past anomalies.`}
            </p>
          </div>
        </div>

        {failed ? (
          <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 text-[11px] font-mono text-[#555]">
            {locale === "pt"
              ? "Snapshot Earth-2 ainda não disponível — o workflow roda 2x/dia e publica public/data/earth2-forecast.json."
              : "Earth-2 snapshot not available yet — the workflow runs twice daily and publishes public/data/earth2-forecast.json."}
          </div>
        ) : (
          <>
            {/* Cards de resumo */}
            <div className="grid grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a] mb-6">
              <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
                <Satellite size={14} className="text-[#76b900]" />
                <div>
                  <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">
                    {locale === "pt" ? "Ciclo inicial (GFS)" : "Init cycle (GFS)"}
                  </div>
                  <div className="text-sm font-mono font-bold text-[#76b900]">
                    {fmtUpdated(snapshot?.initTime)} UTC
                  </div>
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
                <Thermometer size={14} className="text-[#FF4444]" />
                <div>
                  <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">
                    {locale === "pt" ? "Máx. prevista (10d)" : "Forecast max (10d)"}
                  </div>
                  <div className="text-lg font-mono font-bold text-[#FF4444]">
                    {cities.length
                      ? `${Math.max(
                          ...cities.flatMap((c) => c.forecast.map((p) => p.t2mC))
                        ).toFixed(1)}°C`
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
                <Gauge size={14} className="text-[#FF8C00]" />
                <div>
                  <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">
                    {locale === "pt" ? "Cidades em alerta" : "Cities on alert"}
                  </div>
                  <div className="text-lg font-mono font-bold text-[#FF8C00]">
                    {cities.filter((c) => c.riskScore >= 50).length}/{cities.length}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Curvas de temperatura prevista */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">
                  {locale === "pt"
                    ? "Temperatura prevista (°C) — 10 dias"
                    : "Forecast temperature (°C) — 10 days"}
                </div>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis
                        dataKey="day"
                        tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }}
                        axisLine={{ stroke: "#222" }} tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }}
                        axisLine={{ stroke: "#222" }} tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#111", border: "1px solid #222", borderRadius: 0,
                          fontSize: 10, fontFamily: "JetBrains Mono", color: "#e0e0e0",
                        }}
                        formatter={(v: number, name: string) => [`${v.toFixed(1)}°C`, name]}
                      />
                      <Legend wrapperStyle={{ fontSize: 9, fontFamily: "JetBrains Mono" }} />
                      {cities.map((c, i) => (
                        <Line
                          key={c.city}
                          type="monotone"
                          dataKey={c.city}
                          name={locale === "pt" ? c.cityPt : c.city}
                          stroke={CITY_COLORS[i % CITY_COLORS.length]}
                          strokeWidth={c.city === selected ? 2.5 : 1}
                          strokeOpacity={c.city === selected ? 1 : 0.45}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Detalhe por cidade */}
              <div>
                <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">
                  {locale === "pt" ? "Detalhe por cidade" : "City detail"}
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {cities.map((c) => (
                    <button
                      key={c.city}
                      onClick={() => setSelected(c.city)}
                      className={`px-2 py-1 text-[10px] font-mono border transition-colors ${
                        selected === c.city
                          ? "border-[#76b900]/60 text-[#76b900]"
                          : "border-[#222] text-[#555] hover:text-[#00FFFF]"
                      }`}
                    >
                      {locale === "pt" ? c.cityPt : c.city}
                    </button>
                  ))}
                </div>
                {selectedCity && (
                  <div className="border border-[#1a1a1a] bg-[#0a0a0a]">
                    <div className="grid grid-cols-4 gap-px bg-[#1a1a1a] text-[9px] font-mono text-[#555] uppercase">
                      <div className="bg-[#0a0a0a] p-2">{locale === "pt" ? "Dia" : "Day"}</div>
                      <div className="bg-[#0a0a0a] p-2 flex items-center gap-1"><Thermometer size={9} />°C</div>
                      <div className="bg-[#0a0a0a] p-2 flex items-center gap-1"><Wind size={9} />m/s</div>
                      <div className="bg-[#0a0a0a] p-2 flex items-center gap-1"><Gauge size={9} />hPa</div>
                    </div>
                    {selectedCity.forecast
                      .filter((p) => p.leadHours % 24 === 0)
                      .slice(0, 11)
                      .map((p) => (
                        <div
                          key={p.leadHours}
                          className="grid grid-cols-4 gap-px bg-[#1a1a1a] text-[10px] font-mono"
                        >
                          <div className="bg-[#050505] p-2 text-[#888]">D+{p.leadHours / 24}</div>
                          <div className={`bg-[#050505] p-2 ${p.t2mC >= 35 ? "text-[#FF4444]" : "text-[#e0e0e0]"}`}>
                            {p.t2mC.toFixed(1)}
                          </div>
                          <div className={`bg-[#050505] p-2 ${p.wind10mMs >= 17 ? "text-[#FF00FF]" : "text-[#e0e0e0]"}`}>
                            {p.wind10mMs.toFixed(1)}
                          </div>
                          <div className="bg-[#050505] p-2 text-[#e0e0e0]">{p.mslHPa.toFixed(0)}</div>
                        </div>
                      ))}
                    <div className="p-2 text-[9px] font-mono text-[#555] flex items-center justify-between">
                      <span>
                        {locale === "pt" ? "Risco prospectivo" : "Forward-looking risk"}:{" "}
                        <span className="text-[#FF8C00]">{selectedCity.riskScore}/100</span> —{" "}
                        {RISK_LABELS[selectedCity.type]?.[locale === "pt" ? "pt" : "en"] ?? selectedCity.type}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={() => onSourceClick?.("nvidia-earth2")}
                className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors"
              >
                {t("climate.source")}: NVIDIA Earth-2 — FourCastNet NIM (build.nvidia.com) →
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}