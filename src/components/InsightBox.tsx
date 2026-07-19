// ============================================================
// ODIN INSIGHT BOX v2.2 — análise editorial gerada por IA (MaaS)
// Renderiza SOMENTE se public/data/insights.json existir e tiver
// conteúdo para a seção — caso contrário, não exibe nada.
// v2: dataAsOf por seção, confiança estruturada (dados vs interpretação),
// aviso de dados potencialmente desatualizados e selo "não revisado".
// v2.2: proveniência por seção — "Gerado em" usa o generatedAt DA SEÇÃO
// (não o updatedAt global da execução) e textos preservados de rodadas
// anteriores (falha na última geração) são sinalizados.
// Compatível com v1/v2.0 (campos novos são opcionais).
// ============================================================
import { useEffect, useState } from "react";
import { Sparkles, AlertTriangle, History } from "lucide-react";
import { t, getLocale } from "@/i18n";
import { fetchSnapshot, formatUpdatedAt } from "@/lib/api";

interface InsightConfidence { data?: string; interpretation?: string; }
interface InsightEntry {
  pt: string; en: string;
  dataAsOf?: string; freshness?: string;
  confidence?: InsightConfidence;
  promptVersion?: string; generatedAt?: string; generationStatus?: string;
}
interface InsightsData { sections: Record<string, InsightEntry>; }
interface Props { section: string; }

function formatDataOf(iso: string, locale: string): string {
  try {
    const hasTime = iso.includes("T");
    return new Date(iso).toLocaleString(locale === "pt" ? "pt-BR" : "en-US",
      hasTime
        ? { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }
        : { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function InsightBox({ section }: Props) {
  const [entry, setEntry] = useState<InsightEntry | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const locale = getLocale();

  useEffect(() => {
    fetchSnapshot<InsightsData>("insights.json", { sections: {} })
      .then((res) => {
        const e = res.data.sections?.[section];
        if (e && (e.pt || e.en)) {
          setEntry(e);
          setUpdatedAt(res.updatedAt);
        }
      })
      .catch(() => { /* sem insights — seção permanece sem o box */ });
  }, [section]);

  if (!entry) return null;
  const text = locale === "pt" ? entry.pt : entry.en;
  if (!text) return null;

  const levelKey = (v?: string) => (v === "high" ? "insight.levelHigh" : v === "low" ? "insight.levelLow" : "insight.levelMedium");
  const conf = entry.confidence;
  // Proveniência: o carimbo exibido é o da GERAÇÃO DA SEÇÃO; o updatedAt
  // global (instante da última execução do script) é apenas fallback.
  const generatedAt = entry.generatedAt ?? updatedAt;
  const preserved = entry.generationStatus?.startsWith("preserved") ?? false;

  return (
    <div className="mb-6 border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-4">
      <div className="flex items-center flex-wrap gap-2 mb-2">
        <Sparkles size={12} className="text-[#00FFFF]" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#00FFFF]">ODIN Insight</span>
        <span className="text-[8px] font-mono text-[#444]">· {t("insight.badge")}</span>
      </div>
      <p className="text-[11px] font-mono text-[#999] leading-relaxed">{text}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        {entry.dataAsOf && (
          <span className="text-[8px] font-mono text-[#555]">{t("insight.dataOf")} {formatDataOf(entry.dataAsOf, locale)}</span>
        )}
        {generatedAt && (
          <span className="text-[8px] font-mono text-[#555]">{t("insight.generatedAt")} {formatUpdatedAt(generatedAt, locale)}</span>
        )}
        {conf && (conf.data || conf.interpretation) && (
          <span className="text-[8px] font-mono text-[#555]">
            {t("insight.confidence")}: {t("insight.data")} {t(levelKey(conf.data))} · {t("insight.interpretation")} {t(levelKey(conf.interpretation))}
          </span>
        )}
      </div>
      {entry.freshness === "stale" && (
        <div className="mt-2 flex items-center gap-1.5 text-[8px] font-mono text-[#FF8C00]">
          <AlertTriangle size={10} />
          {t("insight.stale")}
        </div>
      )}
      {preserved && (
        <div className="mt-2 flex items-center gap-1.5 text-[8px] font-mono text-[#777]">
          <History size={10} />
          {t("insight.preserved")}
        </div>
      )}
    </div>
  );
}
