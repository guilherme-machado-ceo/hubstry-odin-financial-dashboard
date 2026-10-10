import { useEffect, useState } from "react";
import { kpis, inflectionPoints } from "@/data/lcBondsData";
import { t, getLocale, subscribe } from "@/i18n";
import { Shield, Layers, Radio } from "lucide-react";
import EstBadge from "./EstBadge";
import PtaxLive from "./PtaxLive";
import { REGION_FILTERED_SECTIONS, type Region } from "@/data/regions";
import { DATA_AUDIT_VERIFIED_AT } from "@/data/dataAudit";
import { term, termDef } from "@/data/glossary";

interface Props {
  regionFilter: Region;
  onRegionChange: (r: Region) => void;
}

export default function HeroSection({ regionFilter, onRegionChange }: Props) {
  const [, forceUpdate] = useState(0);
  const locale = getLocale();

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((v) => v + 1));
    return () => { unsub(); };
  }, []);

  return (
    <section className="border-b border-[#1a1a1a] bg-[#050505] relative overflow-hidden">
      {/* Giant watermark */}
      <div className="absolute inset-0 flex items-start justify-start overflow-hidden pointer-events-none select-none">
        <span
          className="text-[120px] md:text-[180px] font-bold font-mono tracking-tighter leading-none mt-4 ml-2"
          style={{
            WebkitTextStroke: "1px rgba(255,255,255,0.04)",
            color: "transparent",
          }}
        >
          G20
        </span>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 py-8 relative">
        {/* Main headline */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#e0e0e0]">
            {t("hero.headline")}
          </h1>
          <p className="text-[11px] font-mono text-[#444] mt-1">
            G20 LC BOND MARKET &middot; BRICS + LATAM &middot; 2015-2026
          </p>
        </div>

        {/* Region Filter */}
        <div className="flex items-center gap-0 border border-[#222] w-fit max-w-full flex-wrap">
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#555] px-3 py-1.5 border-r border-[#222]">
            {t("nav.region")}
          </span>
          {([
            { key: "all" as const, label: t("nav.all") },
            { key: "BRICS" as const, label: t("nav.brics") },
            { key: "LATAM" as const, label: t("nav.latam") },
          ]).map((item) => (
            <button
              key={item.key}
              onClick={() => onRegionChange(item.key)}
              className={`px-3 py-1.5 text-[10px] font-mono transition-colors ${
                regionFilter === item.key
                  ? "bg-[#1a1a1a] text-[#00FFFF] border-b border-[#00FFFF]"
                  : "text-[#555] hover:text-[#aaa]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        {/* Onde o filtro age: só aparece com BRICS/LATAM selecionado (os KPIs abaixo são globais). */}
        <div className="mb-4 mt-1.5 min-h-[16px] text-[9px] font-mono text-[#777]" aria-live="polite" data-region-applied={regionFilter}>
          {regionFilter !== "all" && (
            <>
              <span className="uppercase tracking-widest text-[#00FFFF]">{locale === "pt" ? "Filtro aplicado" : "Filter applied"}:</span>{" "}
              {REGION_FILTERED_SECTIONS.map((sec, i) => (
                <span key={sec.id}>
                  {i > 0 && " · "}
                  <a href={`#layers-${sec.id}`} className="hover:text-[#00FFFF] underline-offset-2 hover:underline">
                    {locale === "pt" ? sec.labelPt : sec.labelEn}
                  </a>
                </span>
              ))}
              <span className="text-[#555]"> ↓</span>
            </>
          )}
        </div>

        {/* KPIs Grid — exibe apenas KPIs com fonte verificada */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
          {/* LIVE BRL/USD */}
          <div className="bg-[#0a0a0a] p-3 flex flex-col">
            <PtaxLive />
          </div>

          {/* TCX */}
          <div className="bg-[#0a0a0a] p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={10} className="text-[#333]" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#555]">
                {t("hero.kpiTCX")}
              </span>
            </div>
            <span className="text-lg font-mono font-bold text-[#e0e0e0]">
              {kpis.tcxHedgedCumulative}
            </span>
          </div>

          {/* TCX Currencies */}
          <div className="bg-[#0a0a0a] p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Layers size={10} className="text-[#333]" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#555]">
                {t("hero.kpiCurrencies")}
              </span>
            </div>
            <span className="text-lg font-mono font-bold text-[#e0e0e0]">
              {kpis.tcxCurrencies}
            </span>
          </div>

          {/* Divida Bruta BR */}
          <div className="bg-[#0a0a0a] p-3 flex flex-col">
            <div className="flex items-center gap-2 mb-1">
              <Radio size={10} className="text-[#00FF88]" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#555]">
                {t("hero.dividaBruta")}
              </span>
            </div>
            <span className="text-lg font-mono font-bold text-[#00FF88]">
              {kpis.dividaBrutaBR}%
            </span>
            <span className="text-[7px] font-mono text-[#444]">
              {kpis.dividaBrutaBRDate}
            </span>
          </div>
        </div>

        {/* Legenda única do estado "não verificado" (PR 2b). */}
        <p className="mt-2 text-[8px] font-mono text-[#666]" data-unverified-legend>
          <span className="uppercase tracking-wider text-[#777]" data-term="unverified">{term("unverified", locale)}</span>
          {" — "}{termDef("unverified", locale)}{" "}
          {locale === "pt" ? `Auditoria de fontes de ${DATA_AUDIT_VERIFIED_AT.split("-").reverse().join("/")}.` : `Source audit of ${DATA_AUDIT_VERIFIED_AT}.`}
        </p>

        {/* Inflection Points Strip */}
        <div className="mt-4 border border-[#1a1a1a] bg-[#0a0a0a]">
          <div className="px-4 py-2 border-b border-[#1a1a1a] flex items-center gap-2">
            <span className="w-2 h-2 bg-[#00FFFF] animate-pulse" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#00FFFF]">
              2025-2026 INFLECTION POINTS
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-[#1a1a1a]">
            {inflectionPoints.map((point) => (
              <div key={point.event} className="bg-[#0a0a0a] p-3 relative">
                {point.isEstimated && (
                  <div className="absolute top-1 right-1">
                    <EstBadge />
                  </div>
                )}
                <div className="text-[9px] font-mono text-[#00FFFF] mb-1">
                  {point.year}
                </div>
                <div className="text-[10px] font-mono text-[#aaa] mb-1">
                  {locale === "pt" ? point.eventPt : point.event}
                </div>
                <div className="text-[12px] font-mono font-bold text-[#e0e0e0]">
                  {point.value}
                </div>
                <div className="text-[8px] font-mono text-[#444] mt-1">
                  {point.source}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
