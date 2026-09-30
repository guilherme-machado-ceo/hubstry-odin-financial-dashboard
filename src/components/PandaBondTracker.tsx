import { PANDA_BOND_EVENTS, PANDA_MARKET_STATS, type PandaStatus } from "@/data/pandaBondsData";
import { useEffect, useState } from "react";
import { t, getLocale, subscribe } from "@/i18n";
import { ExternalLink, CheckCircle2, CalendarClock, Radar, type LucideIcon } from "lucide-react";

const STATUS_META: Record<PandaStatus, { color: string; labelKey: string; Icon: LucideIcon }> = {
  issued: { color: "#00FF88", labelKey: "panda.statusIssued", Icon: CheckCircle2 },
  planned: { color: "#00FFFF", labelKey: "panda.statusPlanned", Icon: CalendarClock },
  watch: { color: "#FF8C00", labelKey: "panda.statusWatch", Icon: Radar },
};

function fmtDate(iso: string, locale: string): string {
  try {
    return new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PandaBondTracker() {
  const [, forceUpdate] = useState(0);
  const locale = getLocale();

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((v) => v + 1));
    return () => { unsub(); };
  }, []);
  const sorted = [...PANDA_BOND_EVENTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="mt-6 border border-[#1a1a1a] bg-[#0a0a0a]">
      {/* Header */}
      <div className="p-4 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 bg-[#FF8C00]" />
          <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-[#FF8C00]">
            {t("panda.title")}
          </span>
        </div>
        <p className="text-[10px] font-mono text-[#555]">{t("panda.subtitle")}</p>
      </div>

      {/* Market context strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#1a1a1a] border-b border-[#1a1a1a]">
        {PANDA_MARKET_STATS.map((s) => (
          <a
            key={s.value + s.source}
            href={s.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#111] p-3 group hover:bg-[#161616] transition-colors"
          >
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-1">{t("panda.marketTitle")}</div>
            <div className="text-[16px] font-mono font-bold text-[#e0e0e0]">{s.value}</div>
            <div className="text-[9px] font-mono text-[#888] leading-snug mt-1 group-hover:text-[#aaa] transition-colors">
              {locale === "pt" ? s.labelPt : s.labelEn}
            </div>
            <div className="text-[8px] font-mono text-[#444] mt-1.5 flex items-center gap-1 group-hover:text-[#00FFFF] transition-colors">
              {s.source} <ExternalLink size={7} />
            </div>
          </a>
        ))}
      </div>

      {/* Timeline */}
      <div>
        {sorted.map((ev, i) => {
          const meta = STATUS_META[ev.status];
          const { Icon } = meta;
          return (
            <div
              key={ev.id}
              className={`flex flex-col md:flex-row md:items-start gap-2 md:gap-4 p-4 hover:bg-[#111] transition-colors ${i < sorted.length - 1 ? "border-b border-[#161616]" : ""}`}
            >
              {/* Date + status */}
              <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-1 md:w-28 shrink-0">
                <span className="text-[10px] font-mono text-[#888]">{fmtDate(ev.date, locale)}</span>
                <span
                  className="flex items-center gap-1 text-[8px] font-mono uppercase tracking-widest px-1.5 py-0.5 border"
                  style={{ color: meta.color, borderColor: `${meta.color}44` }}
                >
                  <Icon size={9} />
                  {t(meta.labelKey)}
                </span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-mono text-[#e0e0e0] leading-snug">
                  {locale === "pt" ? ev.titlePt : ev.titleEn}
                </div>
                <div className="text-[10px] font-mono text-[#888] leading-relaxed mt-1.5">
                  {locale === "pt" ? ev.detailPt : ev.detailEn}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="text-[8px] font-mono text-[#555] uppercase tracking-wider">{ev.issuer}</span>
                  <a
                    href={ev.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[8px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors"
                  >
                    {ev.source} <ExternalLink size={7} />
                  </a>
                  <span className="text-[8px] font-mono text-[#333]">
                    {t("panda.verified")} {fmtDate(ev.verifiedAt, locale)}
                  </span>
                </div>
              </div>

              {/* Amount */}
              <div className="md:w-24 shrink-0 md:text-right">
                <span className="text-[15px] font-mono font-bold" style={{ color: meta.color }}>
                  {ev.amountCnyBn !== null ? `¥${ev.amountCnyBn.toLocaleString(locale === "pt" ? "pt-BR" : "en-US")} bi` : "—"}
                </span>
                {ev.amountCnyBn === null && (
                  <div className="text-[7px] font-mono text-[#444] uppercase tracking-wider">{t("panda.amountTbd")}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
