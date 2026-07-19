import { useState, useCallback, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import ContextBanner from "@/components/ContextBanner";
import HeroSection from "@/components/HeroSection";
import BrazilSpotlight from "@/components/BrazilSpotlight";
import MarketSizeChart from "@/components/MarketSizeChart";
import SpreadsTable from "@/components/SpreadsTable";
import VolatilityChart from "@/components/VolatilityChart";
import TCXChart from "@/components/TCXChart";
import DebtComposition from "@/components/DebtComposition";
import StabilityScatter from "@/components/StabilityScatter";
import GoldReservesChart from "@/components/GoldReservesChart";
import OilVectorChart from "@/components/OilVectorChart";
import NewsTicker from "@/components/NewsTicker";
import ClimateVectorChart from "@/components/ClimateVectorChart";
import CarbonPricingSection from "@/components/CarbonPricingSection";
import BlockchainSection from "@/components/BlockchainSection";
import Footer from "@/components/Footer";
import SourceOverlay from "@/components/SourceOverlay";
import EmbedOverlay from "@/components/EmbedOverlay";

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return { ref, visible };
}

function RevealSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useScrollReveal();
  return (
    <div ref={ref} className={`transition-all duration-500 ease-out ${className} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}>
      {children}
    </div>
  );
}

export default function App() {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [activeEmbed, setActiveEmbed] = useState<string | null>(null);
  const [regionFilter, setRegionFilter] = useState<"all" | "BRICS" | "LATAM">("all");

  const handleSourceClick = useCallback((id: string) => setActiveSource(id), []);
  const handleEmbedClick = useCallback((id: string) => setActiveEmbed(id), []);
  const handleCloseSource = useCallback(() => setActiveSource(null), []);
  const handleCloseEmbed = useCallback(() => setActiveEmbed(null), []);

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans overflow-x-auto">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        body { font-family: 'Inter', sans-serif; background-color: #050505; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #222; }
        ::-webkit-scrollbar-thumb:hover { background: #333; }
        ::selection { background-color: rgba(0, 255, 255, 0.2); color: #e0e0e0; }
      `}</style>

      {/* ── 1. NAVBAR ── */}
      <Navbar />

      {/* ── 2. CONTEXT BANNER: Geopolitical Economy ── */}
      <RevealSection><ContextBanner /></RevealSection>

      {/* ── 3. NEWS TICKER: Live Financial Intelligence ── */}
      <RevealSection><NewsTicker /></RevealSection>

      {/* ── 4. HERO: KPIs + Region Filter + Inflection Points ── */}
      <RevealSection><HeroSection regionFilter={regionFilter} onRegionChange={setRegionFilter} /></RevealSection>

      {/* ── 5. BRAZIL SPOTLIGHT: Panda Bond + NDB Progress + Flowchart ── */}
      <RevealSection><BrazilSpotlight onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 6. MARKET SIZE: BRICS + LATAM LC Bonds ── */}
      <RevealSection><MarketSizeChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 7. SPREADS × VOLATILITY: Rate spreads vs FX vol ── */}
      <RevealSection><SpreadsTable onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} regionFilter={regionFilter} /></RevealSection>

      {/* ── 8. VOLATILITY RANKING: G20 currencies ── */}
      <RevealSection><VolatilityChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} regionFilter={regionFilter} /></RevealSection>

      {/* ── 9. TCX HEDGING: Local currency protection ── */}
      <RevealSection><TCXChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 10. DEBT COMPOSITION: LC vs FX ── */}
      <RevealSection><DebtComposition onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} regionFilter={regionFilter} /></RevealSection>

      {/* ── 11. STABILITY SCATTER: Economic stability vs LC share ── */}
      <RevealSection><StabilityScatter onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} regionFilter={regionFilter} /></RevealSection>

      {/* ── 12. GOLD RESERVES: Anti-dollar anchor ── */}
      <RevealSection><GoldReservesChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 13. OIL VECTOR: Price + Production + Petroyuan ── */}
      <RevealSection><OilVectorChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 14. CLIMATE VECTOR: Temperature Anomalies + Risk Scores ── */}
      <RevealSection><ClimateVectorChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 15. CARBON PRICING & CBAM: EU ETS, CBAM certificates, embedded CO2 ── */}
      <RevealSection><CarbonPricingSection onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 16. BLOCKCHAIN & DIGITAL ASSETS: Market + On-chain + RWA + Tokenized Carbon ── */}
      <RevealSection><BlockchainSection onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 17. FOOTER ── */}
      <Footer onSourceClick={handleSourceClick} />

      {/* ── OVERLAYS ── */}
      <SourceOverlay sourceId={activeSource} onClose={handleCloseSource} />
      <EmbedOverlay sectionId={activeEmbed} onClose={handleCloseEmbed} />
    </div>
  );
}
