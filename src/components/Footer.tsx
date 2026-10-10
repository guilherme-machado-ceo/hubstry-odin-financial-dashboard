import { sourceRefs } from "@/data/lcBondsData";
import { t } from "@/i18n";
import { ExternalLink } from "lucide-react";

const DEMO_HREF = "mailto:guilhermemachado.ceo@hubstry.dev?subject=ODIN%20%E2%80%94%20demonstra%C3%A7%C3%A3o%2Fpiloto";

interface Props {
  onSourceClick: (id: string) => void;
}

export default function Footer({ onSourceClick }: Props) {
  return (
    <footer className="bg-[#050505] border-t border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        {/* Top row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#e0e0e0] mb-2">
              ODIN
            </div>
            <p className="text-[10px] font-mono text-[#555] leading-relaxed max-w-xs">
              {t("footer.compiledBy")}{" "}
              <span className="text-[#00FFFF]">{t("footer.hubstry")}</span> &middot;{" "}
              {t("footer.overall")}
            </p>
            <p className="text-[9px] font-mono text-[#444] mt-2">
              {t("footer.snapshot")}
            </p>
            <a
              href="https://hubstry.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-white rounded px-2 py-1 mt-3 hover:opacity-90 transition-opacity"
            >
              <img src={`${import.meta.env.BASE_URL}brand/hubstry-logo.png`} alt="Hubstry Deep Tech" className="h-3 w-auto" />
            </a>
            <a
              href={DEMO_HREF}
              className="text-[9px] font-mono text-[#00FFFF]/60 hover:text-[#00FFFF] transition-colors mt-3 inline-block"
            >
              {t("footer.demoLink")}
            </a>
          </div>

          {/* Sources */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">
              {t("footer.sources")}
            </div>
            <div className="space-y-2">
              {sourceRefs.map((source) => (
                <button
                  key={source.id}
                  onClick={() => onSourceClick(source.id)}
                  className="flex items-center gap-1 text-[10px] font-mono text-[#666] hover:text-[#00FFFF] transition-colors w-full text-left"
                >
                  <ExternalLink size={8} />
                  {source.name}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">
              DISCLAIMER
            </div>
            <p className="text-[9px] font-mono text-[#444] leading-relaxed">
              {t("footer.disclaimer")}
            </p>
            <div className="mt-4">
              <a href="https://hubstry.dev" target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">
                hubstry.dev
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#1a1a1a] pt-4 flex flex-col md:flex-row items-center justify-between gap-2">
          <span className="text-[8px] font-mono text-[#333]">
            BIS / IMF WEO / CEPAL / BCB / NDB / CIPS / TCX
          </span>
          <span className="text-[8px] font-mono text-[#333]">
            &copy; 2026 Hubstry Deep Tech. AGPL-3.0
          </span>
        </div>
      </div>
    </footer>
  );
}
