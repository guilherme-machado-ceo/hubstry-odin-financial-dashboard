import { useEffect, useState, useMemo, useCallback } from "react";
import Navbar from "@/components/Navbar";
import ContextBanner from "@/components/ContextBanner";
import NewsTicker from "@/components/NewsTicker";
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
import ClimateVectorChart from "@/components/ClimateVectorChart";
import CarbonPricingSection from "@/components/CarbonPricingSection";
import BlockchainSection from "@/components/BlockchainSection";
import Footer from "@/components/Footer";
import SourceOverlay from "@/components/SourceOverlay";
import EmbedOverlay from "@/components/EmbedOverlay";
import { subscribe } from "@/i18n";

function RevealSection({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.05 }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref]);

  return (
    <div ref={setRef} className={`transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`}>
      {children}
    </div>
  );
}

function App() {
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [activeEmbed, setActiveEmbed] = useState<string | null>(null);
  const [activeRegions, setActiveRegions] = useState<Set<string>>(new Set());
  const [, forceUpdate] = useState(0);

  useEffect(() => subscribe(() => forceUpdate((n) => n + 1)), []);

  const handleSourceClick = useCallback((id: string) => setActiveSource(id), []);
  const handleEmbedClick = useCallback((id: string) => setActiveEmbed(id), []);

  const toggleRegion = useCallback((region: string) => {
    setActiveRegions((prev) => {
      const next = new Set(prev);
      if (next.has(region)) next.delete(region); else next.add(region);
      return next;
    });
  }, []);

  const regionProps = useMemo(
    () => ({ activeRegions, toggleRegion }),
    [activeRegions, toggleRegion]
  );

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] antialiased">
      {/* ── 1. NAVBAR ── */}
      <Navbar />

      {/* ── 2. CONTEXT BANNER ── */}
      <ContextBanner />

      {/* ── 3. NEWS TICKER ── */}
      <NewsTicker />

      {/* ── 4. HERO + KPIs (region filter state) ── */}
      <RevealSection><HeroSection {...regionProps} /></RevealSection>

      {/* ── 5. BRAZIL SPOTLIGHT ── */}
      <RevealSection><BrazilSpotlight onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 6. MARKET SIZE CHART (LC Bonds $27.4T) ── */}
      <RevealSection><MarketSizeChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 7. SPREADS TABLE ── */}
      <RevealSection><SpreadsTable onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 8. VOLATILITY CHART ── */}
      <RevealSection><VolatilityChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 9. TCX CHART ── */}
      <RevealSection><TCXChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 10. DEBT COMPOSITION ── */}
      <RevealSection><DebtComposition onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 11. STABILITY SCATTER ── */}
      <RevealSection><StabilityScatter onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 12. GOLD RESERVES ── */}
      <RevealSection><GoldReservesChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 13. OIL VECTOR ── */}
      <RevealSection><OilVectorChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 14. CLIMATE VECTOR ── */}
      <RevealSection><ClimateVectorChart onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 15. CARBON PRICING & CBAM: EU ETS, CBAM certificates, embedded CO2 ── */}
      <RevealSection><CarbonPricingSection onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 16. BLOCKCHAIN & DIGITAL ASSETS: Market + On-chain + RWA + Tokenized Carbon ── */}
      <RevealSection><BlockchainSection onSourceClick={handleSourceClick} onEmbedClick={handleEmbedClick} /></RevealSection>

      {/* ── 17. FOOTER ── */}
      <Footer onSourceClick={handleSourceClick} />

      {/* ── OVERLAYS ── */}
      <SourceOverlay activeSource={activeSource} onClose={() => setActiveSource(null)} />
      <EmbedOverlay activeEmbed={activeEmbed} onClose={() => setActiveEmbed(null)} />
    </div>
  );
}

export default App;
