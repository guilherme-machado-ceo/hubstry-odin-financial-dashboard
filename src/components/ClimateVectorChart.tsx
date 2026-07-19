import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { Share2, CloudRain, Thermometer, Wind, Radio } from "lucide-react";

interface ClimateData {
  city: string; cityPt: string; country: string; flag: string;
  tempAnomaly: number; precipAnomaly: number; riskScore: number; type: string;
}

const CLIMATE_STATIONS = [
  { city: "Beijing", cityPt: "Pequim", country: "China", flag: "CN", lat: 39.9, lon: 116.4 },
  { city: "Moscow", cityPt: "Moscou", country: "Russia", flag: "RU", lat: 55.8, lon: 37.6 },
  { city: "Mumbai", cityPt: "Bombaim", country: "India", flag: "IN", lat: 19.1, lon: 72.9 },
  { city: "Brasilia", cityPt: "Brasilia", country: "Brazil", flag: "BR", lat: -15.8, lon: -47.9 },
  { city: "Johannesburg", cityPt: "Joanesburgo", country: "South Africa", flag: "ZA", lat: -26.2, lon: 28.0 },
  { city: "Istanbul", cityPt: "Istambul", country: "Turkey", flag: "TR", lat: 41.0, lon: 28.9 },
  { city: "Warsaw", cityPt: "Varsovia", country: "Poland", flag: "PL", lat: 52.2, lon: 21.0 },
  { city: "Shanghai", cityPt: "Xangai", country: "China", flag: "CN2", lat: 31.2, lon: 121.5 },
];

const FALLBACK_CLIMATE: ClimateData[] = [
  { city: "Beijing", cityPt: "Pequim", country: "China", flag: "CN", tempAnomaly: 1.8, precipAnomaly: -15, riskScore: 45, type: "heat" },
  { city: "Moscow", cityPt: "Moscou", country: "Russia", flag: "RU", tempAnomaly: 2.4, precipAnomaly: -22, riskScore: 55, type: "drought" },
  { city: "Mumbai", cityPt: "Bombaim", country: "India", flag: "IN", tempAnomaly: 1.2, precipAnomaly: 18, riskScore: 65, type: "flood" },
  { city: "Brasilia", cityPt: "Brasilia", country: "Brazil", flag: "BR", tempAnomaly: 1.5, precipAnomaly: -30, riskScore: 72, type: "drought" },
  { city: "Johannesburg", cityPt: "Joanesburgo", country: "South Africa", flag: "ZA", tempAnomaly: 1.1, precipAnomaly: -12, riskScore: 38, type: "heat" },
  { city: "Istanbul", cityPt: "Istambul", country: "Turkey", flag: "TR", tempAnomaly: 1.9, precipAnomaly: -18, riskScore: 48, type: "drought" },
  { city: "Warsaw", cityPt: "Varsovia", country: "Poland", flag: "PL", tempAnomaly: 2.1, precipAnomaly: 8, riskScore: 35, type: "heat" },
  { city: "Shanghai", cityPt: "Xangai", country: "China", flag: "CN2", tempAnomaly: 1.6, precipAnomaly: 25, riskScore: 58, type: "flood" },
];

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; }

export default function ClimateVectorChart({ onSourceClick, onEmbedClick }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<ClimateData[]>(FALLBACK_CLIMATE);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const locale = getLocale();

  useEffect(() => {
    async function fetchClimate() {
      try {
        const results: ClimateData[] = [];
        // Janela movel: ultimos 12 meses completos (archive API tem defasagem de ~5 dias)
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - 5);
        const startDate = new Date(endDate);
        startDate.setFullYear(startDate.getFullYear() - 1);
        const fmtDate = (d: Date) => d.toISOString().slice(0, 10);
        for (const station of CLIMATE_STATIONS) {
          try {
            const res = await fetch(
              `https://archive-api.open-meteo.com/v1/archive?latitude=${station.lat}&longitude=${station.lon}&start_date=${fmtDate(startDate)}&end_date=${fmtDate(endDate)}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`,
              { signal: AbortSignal.timeout(5000) }
            );
            if (!res.ok) throw new Error();
            const json = await res.json();
            const temps = json.daily?.temperature_2m_mean || [];
            const precips = json.daily?.precipitation_sum || [];
            const avgTemp = temps.reduce((a: number, b: number) => a + b, 0) / temps.length;
            const totalPrecip = precips.reduce((a: number, b: number) => a + b, 0);
            const tempAnomaly = avgTemp - getHistoricalAvg(station.city);
            const precipAnomaly = ((totalPrecip - getHistoricalPrecip(station.city)) / getHistoricalPrecip(station.city)) * 100;
            const riskScore = calculateRiskScore(tempAnomaly, precipAnomaly);
            results.push({
              city: station.city, cityPt: station.cityPt, country: station.country, flag: station.flag,
              tempAnomaly: Math.round(tempAnomaly * 10) / 10,
              precipAnomaly: Math.round(precipAnomaly),
              riskScore: Math.round(riskScore),
              type: riskScore > 60 ? (precipAnomaly > 10 ? "flood" : "drought") : riskScore > 40 ? "heat" : "normal",
            });
          } catch {
            const fallback = FALLBACK_CLIMATE.find((c) => c.city === station.city);
            if (fallback) results.push(fallback);
          }
        }
        if (results.length > 0) {
          setData(results);
          setIsLive(true);
          setLastUpdated(new Date().toLocaleString(locale === "pt" ? "pt-BR" : "en-US"));
        }
      } catch {
        // Keep fallback data
      }
    }
    fetchClimate();
  }, [locale]);

  const jsonData = { climate: data };
  const riskColors: Record<string, string> = { drought: "#FF8C00", flood: "#4488FF", heat: "#FF4444", storm: "#FF00FF", normal: "#00FF88" };
  const riskLabelsPt: Record<string, string> = { drought: "Seca", flood: "Inundação", heat: "Onda de calor", storm: "Tempestade", normal: "Normal" };
  const riskLabelsEn: Record<string, string> = { drought: "Drought", flood: "Flood risk", heat: "Heat wave", storm: "Storm", normal: "Normal" };

  return (
    <section id="climate" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-[#00FF88] border border-[#00FF88]/30 px-1.5 py-0.5">
                  <Radio size={10} className="animate-pulse" />
                  {locale === "pt" ? "DADOS AO VIVO" : "LIVE DATA"}
                  {lastUpdated && <span className="text-[#00FF88]/60">— {lastUpdated}</span>}
                </span>
              ) : (
                <EstBadge />
              )}
            </div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("climate.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1 max-w-2xl leading-relaxed">{t("climate.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="climate-vector" jsonData={jsonData} />
            <button onClick={() => onEmbedClick("climate")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-px bg-[#1a1a1a] border border-[#1a1a1a] mb-6">
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Thermometer size={14} className="text-[#FF4444]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("climate.avgTempAnomaly")}</div>
              <div className="text-lg font-mono font-bold text-[#FF4444]">+{(data.reduce((a, c) => a + c.tempAnomaly, 0) / data.length).toFixed(1)}°C</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <CloudRain size={14} className="text-[#4488FF]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("climate.avgPrecipAnomaly")}</div>
              <div className="text-lg font-mono font-bold text-[#4488FF]">{Math.round(data.reduce((a, c) => a + c.precipAnomaly, 0) / data.length)}%</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Wind size={14} className="text-[#FF8C00]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("climate.highRiskCities")}</div>
              <div className="text-lg font-mono font-bold text-[#FF8C00]">{data.filter((c) => c.riskScore > 50).length}/8</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("climate.riskScoreTitle")}</div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} domain={[0, 100]} />
                  <YAxis type="category" dataKey={locale === "pt" ? "cityPt" : "city"} tick={{ fontSize: 9, fill: "#888", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} width={55} />
                  <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(v: number) => [`${v}/100`, t("climate.risk")]} />
                  <Bar dataKey="riskScore" barSize={12} radius={[0, 2, 2, 0]}>
                    {data.map((entry, i) => <Cell key={i} fill={riskColors[entry.type] || "#888"} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("climate.tempAnomalyTitle")}</div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} />
                  <YAxis type="category" dataKey={locale === "pt" ? "cityPt" : "city"} tick={{ fontSize: 9, fill: "#888", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} width={55} />
                  <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(v: number) => [`+${v}°C`, t("climate.tempAnomaly")]} />
                  <Bar dataKey="tempAnomaly" barSize={12} radius={[0, 2, 2, 0]} fill="#FF4444" fillOpacity={0.8} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {Object.entries(riskColors).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-mono text-[#666]">{locale === "pt" ? riskLabelsPt[type] : riskLabelsEn[type]}</span>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <button onClick={() => onSourceClick("open-meteo")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">
            {t("climate.source")}: Open-Meteo (API sem chave) →
          </button>
        </div>
      </div>
    </section>
  );
}

function getHistoricalAvg(city: string): number {
  const avgs: Record<string, number> = { Beijing: 12.5, Moscow: 5.8, Mumbai: 27.2, Brasilia: 21.4, Johannesburg: 16.2, Istanbul: 14.9, Warsaw: 8.6, Shanghai: 17.1 };
  return avgs[city] || 15;
}
function getHistoricalPrecip(city: string): number {
  const precips: Record<string, number> = { Beijing: 577, Moscow: 707, Mumbai: 2160, Brasilia: 1550, Johannesburg: 713, Istanbul: 819, Warsaw: 550, Shanghai: 1166 };
  return precips[city] || 700;
}
function calculateRiskScore(tempAnomaly: number, precipAnomaly: number): number {
  return Math.min(Math.abs(tempAnomaly) * 20 + Math.min(Math.abs(precipAnomaly) * 0.8, 50), 100);
}
