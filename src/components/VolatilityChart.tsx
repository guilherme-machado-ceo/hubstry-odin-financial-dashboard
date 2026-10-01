// ============================================================
// Volatilidade cambial anualizada (PR 2c)
// Substitui o ranking "2025e" atribuído ao Bloomberg (sem metodologia).
// Dados: src/data/generated/open-markets.json — Fed H.10 via FRED (BRL, MXN,
// INR, CNY, ZAR) e TRM do Banco de la República (COP), calculados por
// scripts/fetch-open-markets.mjs. Moedas sem série aberta compatível
// aparecem em "lacunas", com o motivo.
// ============================================================
import { useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import { Share2 } from "lucide-react";
import { inRegion, type Region } from "@/data/regions";
import { openMarkets, latestFullYear, formatDay } from "@/data/openMarkets";
import { term } from "@/data/glossary";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; regionFilter: Region; }

export default function VolatilityChart({ onSourceClick, onEmbedClick, regionFilter }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const locale = getLocale();
  const fx = openMarkets.fxVolatility;
  const year = latestFullYear(fx.currencies.map((c) => c.annual));
  const filtered = fx.currencies.filter((c) => inRegion(c.flag, regionFilter));
  const ranked = [...filtered].filter((c) => year != null && c.annual[year] != null).sort((a, b) => b.annual[year!] - a.annual[year!]);
  const chartData = ranked.map((c) => ({ code: c.code, volatility: c.annual[year!] }));
  // A tabela de detalhes obedece ao mesmo filtro do ranking.
  const detailsFiltered = filtered;
  const gaps = fx.gaps.filter((g) => inRegion(g.flag, regionFilter));
  const nf = (v: number) => v.toLocaleString(locale === "pt" ? "pt-BR" : "en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  return (
    <section id="volatility" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("section3.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1 max-w-3xl leading-relaxed">{t("section3.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ExportButton chartRef={chartRef} filename="fx-volatility" jsonData={{ method: locale === "pt" ? fx.methodPt : fx.methodEn, year, currencies: detailsFiltered, gaps }} />
            <button onClick={() => onEmbedClick("volatility")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="code" tick={{ fontSize: 11, fill: "#888", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} width={40} />
              <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 11, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(value: number) => [`${nf(value)}%`, `${year}`]} />
              <Bar dataKey="volatility" radius={[0, 2, 2, 0]} barSize={20}>
                {chartData.map((entry, index) => <Cell key={index} fill={entry.code === "BRL" ? "#00FFFF" : "#333"} stroke={entry.code === "BRL" ? "#00FFFF" : "none"} strokeWidth={entry.code === "BRL" ? 1 : 0} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex items-center gap-4 flex-wrap text-[9px] font-mono text-[#888]">
          <span className="flex items-center gap-2"><span className="w-3 h-3 bg-[#00FFFF]" />BRL (Brasil)</span>
          <span>{locale === "pt" ? `Ano completo: ${year}` : `Full year: ${year}`}</span>
          <span className="text-[#555]"><span data-term="derived">{term("derived", locale)}</span> · <span data-term="verified">{term("verified", locale)}</span></span>
        </div>
        <div className="mt-6 border border-[#1a1a1a] overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="px-4 py-2 border-b border-[#1a1a1a] bg-[#0a0a0a]"><span className="text-[10px] font-mono uppercase tracking-widest text-[#555]">{t("section3.tableTitle")}</span></div>
            <div className="grid grid-cols-12 gap-0 bg-[#111] border-b border-[#1a1a1a] text-[9px] font-mono uppercase tracking-widest text-[#555] py-2 px-3">
              <div className="col-span-2">{t("section3.currency")}</div><div className="col-span-3">{t("spreads.country")}</div><div className="col-span-2 text-right">{t("section3.fullYear")} {year}</div><div className="col-span-3 text-right">{t("section3.ytd")}</div><div className="col-span-2 text-right">{term("source", locale)}</div>
            </div>
            {detailsFiltered.map((v, i) => (
              <div key={v.code} data-fx-row={v.code} className={`grid grid-cols-12 gap-0 py-2 px-3 text-[11px] font-mono ${i < detailsFiltered.length - 1 ? "border-b border-[#111]" : ""} hover:bg-[#0e0e0e] transition-colors`}>
                <div className="col-span-2 font-bold text-[#aaa]">{v.code}</div>
                <div className="col-span-3 text-[#888]">{locale === "pt" ? v.countryPt : v.country}</div>
                <div className="col-span-2 text-right text-[#e0e0e0] font-bold">{year != null && v.annual[year] != null ? `${nf(v.annual[year])}%` : "—"}</div>
                <div className="col-span-3 text-right text-[#888]">{v.ytd ? `${nf(v.ytd.vol)}% · ${formatDay(v.ytd.to, locale)}` : "—"}</div>
                <div className="col-span-2 text-right text-[#555]">{v.sourceId === "banrep-trm" ? "BanRep TRM" : "Fed H.10"}</div>
              </div>
            ))}
          </div>
        </div>
        {gaps.length > 0 && (
          <div className="mt-4 border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2" data-gaps="volatility">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-1">{t("section3.gapsTitle")}</div>
            <ul className="space-y-0.5">
              {gaps.map((g) => (
                <li key={g.code ?? g.flag} className="text-[10px] font-mono text-[#777]"><span className="text-[#aaa]">{g.code} · {locale === "pt" ? g.countryPt : g.country}</span> — {locale === "pt" ? g.reasonPt : g.reasonEn}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-4 flex gap-4 flex-wrap">
          <button onClick={() => onSourceClick("fred-h10")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("section3.source")}: Federal Reserve H.10 (FRED) →</button>
          <button onClick={() => onSourceClick("banrep-trm")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">Banco de la República — TRM →</button>
        </div>
      </div>
    </section>
  );
}
