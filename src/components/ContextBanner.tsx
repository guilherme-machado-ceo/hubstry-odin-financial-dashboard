import { useState } from "react";
import { contextBanner } from "@/data/goldOilData";
import { t, getLocale } from "@/i18n";
import { AlertTriangle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

export default function ContextBanner() {
  const [expanded, setExpanded] = useState(false);
  const locale = getLocale();
  const data = contextBanner;

  return (
    <section className="border-b border-[#FF8C00]/30 bg-gradient-to-r from-[#0a0a0a] via-[#111] to-[#0a0a0a] relative">
      <div className="h-px bg-gradient-to-r from-transparent via-[#FF8C00]/50 to-transparent" />
      <div className="max-w-[1440px] mx-auto px-4 py-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="flex items-center gap-1 text-[9px] font-mono uppercase tracking-[0.2em] text-[#FF8C00]">
            <AlertTriangle size={10} />
            {locale === "pt" ? data.tagPt : data.tag}
          </span>
          <span className="text-[8px] font-mono text-[#444]">{locale === "pt" ? "— marco histórico: junho/2025" : "— milestone: June 2025"}</span>
        </div>
        <h2 className="text-lg md:text-xl font-bold text-[#e0e0e0] tracking-tight leading-snug mb-2">
          {locale === "pt" ? data.headlinePt : data.headline}
        </h2>
        <div className={`overflow-hidden transition-all duration-300 ${expanded ? "max-h-96" : "max-h-0"}`}>
          <p className="text-[12px] text-[#aaa] leading-relaxed mb-3 border-l-2 border-[#FF8C00]/30 pl-3">
            {locale === "pt" ? data.summaryPt : data.summary}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[10px] font-mono text-[#FF8C00] hover:text-[#FFAA33] transition-colors">
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? (locale === "pt" ? "Recolher" : "Collapse") : t("context.readMore")}
          </button>
          <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[9px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors">
            {t("banner.source")}: {data.source} <ExternalLink size={8} />
          </a>
        </div>
      </div>
    </section>
  );
}
