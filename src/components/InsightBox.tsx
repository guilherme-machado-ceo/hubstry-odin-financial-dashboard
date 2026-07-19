// ============================================================
// ODIN INSIGHT BOX — análise editorial gerada por IA (MaaS)
// Renderiza SOMENTE se public/data/insights.json existir e tiver
// conteúdo para a seção — caso contrário, não exibe nada.
// ============================================================
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { t, getLocale } from "@/i18n";
import { fetchSnapshot, formatUpdatedAt } from "@/lib/api";

interface InsightEntry { pt: string; en: string; }
interface InsightsData { sections: Record<string, InsightEntry>; }
interface Props { section: string; }

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

  return (
    <div className="mb-6 border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-4">
      <div className="flex items-center flex-wrap gap-2 mb-2">
        <Sparkles size={12} className="text-[#00FFFF]" />
        <span className="text-[9px] font-mono uppercase tracking-widest text-[#00FFFF]">ODIN Insight</span>
        {updatedAt && <span className="text-[8px] font-mono text-[#555]">· {formatUpdatedAt(updatedAt, locale)}</span>}
        <span className="text-[8px] font-mono text-[#444]">· {t("insight.badge")}</span>
      </div>
      <p className="text-[11px] font-mono text-[#999] leading-relaxed">{text}</p>
    </div>
  );
}
