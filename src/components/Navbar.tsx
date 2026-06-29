import { useEffect, useState } from "react";
import { getLocale, toggleLocale, t, subscribe } from "@/i18n";

export default function Navbar() {
  const [, forceUpdate] = useState(0);
  const locale = getLocale();

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((v) => v + 1));
    return () => { unsub(); };
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-[#050505]/90 backdrop-blur-md border-b border-[#1a1a1a]">
      <div className="max-w-[1440px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[11px] font-mono font-bold tracking-[0.2em] text-[#e0e0e0]">{t("nav.title")}</span>
            <span className="text-[9px] font-mono tracking-[0.15em] text-[#555]">{t("nav.subtitle")}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-0 border border-[#222]">
            {[{ key: "12M", label: t("nav.months12") }, { key: "3Y", label: t("nav.years3") }, { key: "5Y", label: t("nav.years5") }, { key: "10Y", label: t("nav.years10") }].map((item, i) => (
              <button key={item.key} className={`px-3 py-1 text-[10px] font-mono transition-colors ${i === 3 ? "bg-[#1a1a1a] text-[#00FFFF] border-b border-[#00FFFF]" : "text-[#555] hover:text-[#aaa]"}`}>{item.label}</button>
            ))}
          </div>
          <button onClick={toggleLocale} className="px-3 py-1 text-[10px] font-mono border border-[#222] text-[#aaa] hover:text-[#00FFFF] hover:border-[#00FFFF]/40 transition-colors">{locale === "pt" ? "PT" : "EN"}</button>
          <span className="text-[10px] font-mono text-[#444] hidden md:inline">2026.06</span>
        </div>
      </div>
    </nav>
  );
}
