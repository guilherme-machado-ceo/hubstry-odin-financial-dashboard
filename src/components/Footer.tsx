import { sourceRefs } from "@/data/lcBondsData";
import { t } from "@/i18n";
import { ExternalLink } from "lucide-react";

interface Props { onSourceClick: (id: string) => void; }

export default function Footer({ onSourceClick }: Props) {
  return (
    <footer className="bg-[#050505] border-t border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#e0e0e0] mb-2">ODIN</div>
            <p className="text-[10px] font-mono text-[#555] leading-relaxed max-w-xs">{t("footer.compiledBy")} <span className="text-[#00FFFF]">{t("footer.hubstry")}</span> · {t("footer.overall")}</p>
            <p className="text-[9px] font-mono text-[#444] mt-2">{t("footer.snapshot")}</p>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("footer.sources")}</div>
            <div className="space-y-2">
              {sourceRefs.slice(0, 6).map((source) => (
                <button key={source.id} onClick={() => onSourceClick(source.id)} className="flex items-center gap-1 text-[10px] font-mono text-[#666] hover:text-[#00FFFF] transition-colors w-full text-left"><ExternalLink size={8} />{source.name}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">DISCLAIMER</div>
            <p className="text-[9px] font-mono text-[#444] leading-relaxed">{t("footer.disclaimer")}</p>
            <div className="mt-4 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-[#00FF88] rounded-full" /><span className="text-[8px] font-mono text-[#444]">All systems operational</span></div>
          </div>
        </div>
        <div className="border-t border-[#1a1a1a] pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="text-[8px] font-mono text-[#333]">BIS / IMF WEO / CEPAL / BCB / NDB / CIPS / TCX / Bloomberg / Open-Meteo / Google News</span>
          <span className="text-[8px] font-mono text-[#333]">&copy; 2026 Hubstry Deep Tech. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}
