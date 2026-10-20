// ============================================================
// SEÇÃO 16 — BLOCKCHAIN & ATIVOS DIGITAIS
// Mercado (snapshot DefiLlama Coins), stablecoins e protocolos RWA
// (snapshot DefiLlama), on-chain live via mempool.space (sem chave)
// e a ponte temática: carbono tokenizado (Toucan/KlimaDAO).
// ============================================================
import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { t, getLocale } from "@/i18n";
import ExportButton from "./ExportButton";
import EstBadge from "./EstBadge";
import { Share2, Radio, Bitcoin, Coins, Layers, Leaf } from "lucide-react";
import { fetchSnapshot, fetchJson, formatUpdatedAt } from "@/lib/api";
import { FALLBACK_CRYPTO, FALLBACK_STABLECOINS, FALLBACK_RWA } from "@/data/blockchainData";
import type { CryptoAsset, StablecoinData, RwaData, MempoolFees } from "@/data/blockchainData";

interface Props { onSourceClick: (id: string) => void; onEmbedClick: (id: string) => void; }

const STABLE_COLORS = ["#00FFFF", "#4488FF", "#00FF88", "#FF8C00", "#FF4444", "#AA66FF", "#888888", "#555555"];

function fmtB(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

export default function BlockchainSection({ onSourceClick, onEmbedClick }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const [crypto, setCrypto] = useState<CryptoAsset[]>(FALLBACK_CRYPTO);
  const [stables, setStables] = useState<StablecoinData>(FALLBACK_STABLECOINS);
  const [rwaData, setRwaData] = useState<RwaData>(FALLBACK_RWA);
  const [fees, setFees] = useState<MempoolFees | null>(null);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const locale = getLocale();

  useEffect(() => {
    // Snapshots diários (DefiLlama via GitHub Actions)
    fetchSnapshot<{ assets: CryptoAsset[] }>("crypto-market.json", { assets: FALLBACK_CRYPTO })
      .then((res) => { setCrypto(res.data.assets); if (res.isLive) { setIsLive(true); setUpdatedAt(res.updatedAt); } });
    fetchSnapshot<StablecoinData>("stablecoins.json", FALLBACK_STABLECOINS)
      .then((res) => setStables(res.data));
    fetchSnapshot<RwaData>("rwa-protocols.json", FALLBACK_RWA)
      .then((res) => setRwaData(res.data));
    // Live on-chain (mempool.space — CORS livre, sem chave)
    fetchJson<MempoolFees>("https://mempool.space/api/v1/fees/recommended")
      .then((f) => { setFees(f); setIsLive(true); })
      .catch(() => {});
    fetchJson<number>("https://mempool.space/api/blocks/tip/height")
      .then((h) => setBlockHeight(h))
      .catch(() => {});
  }, []);

  const btc = crypto.find((a) => a.symbol === "BTC");
  const eth = crypto.find((a) => a.symbol === "ETH");
  const stablesChart = [...stables.assets].sort((a, b) => b.mcapUsd - a.mcapUsd).slice(0, 8);
  const jsonData = { crypto, stablecoins: stables, rwa: rwaData };

  return (
    <section id="blockchain" className="border-b border-[#1a1a1a] bg-[#050505]">
      <div className="max-w-[1440px] mx-auto px-4 py-8" ref={chartRef}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isLive ? (
                <span className="inline-flex items-center gap-1.5 text-[9px] font-mono text-[#00FF88] border border-[#00FF88]/30 px-1.5 py-0.5">
                  <Radio size={10} className="animate-pulse" />
                  {locale === "pt" ? "DADOS AO VIVO" : "LIVE DATA"}
                  {updatedAt && <span className="text-[#00FF88]/60">— {formatUpdatedAt(updatedAt, locale)}</span>}
                </span>
              ) : (
                <EstBadge />
              )}
            </div>
            <h2 className="text-xl font-bold text-[#e0e0e0] tracking-tight">{t("blockchain.title")}</h2>
            <p className="text-[11px] font-mono text-[#555] mt-1 max-w-2xl leading-relaxed">{t("blockchain.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <ExportButton chartRef={chartRef} filename="blockchain-digital-assets" jsonData={jsonData} />
            <button onClick={() => onEmbedClick("blockchain")} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#555] hover:text-[#00FFFF] transition-colors border border-[#222] hover:border-[#00FFFF]/40"><Share2 size={12} /></button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#1a1a1a] border border-[#1a1a1a] mb-6">
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Bitcoin size={14} className="text-[#FF8C00]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">BTC/USD</div>
              <div className="text-lg font-mono font-bold text-[#FF8C00]">{btc ? `$${btc.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}</div>
              <div className="text-[8px] font-mono text-[#444]">{blockHeight ? `block ${blockHeight.toLocaleString("en-US")}` : "mempool.space"}</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Layers size={14} className="text-[#4488FF]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">ETH/USD</div>
              <div className="text-lg font-mono font-bold text-[#4488FF]">{eth ? `$${eth.priceUsd.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—"}</div>
              <div className="text-[8px] font-mono text-[#444]">DefiLlama Coins</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Coins size={14} className="text-[#00FFFF]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("blockchain.kpiStables")}</div>
              <div className="text-lg font-mono font-bold text-[#00FFFF]">{fmtB(stables.totalMcapUsd)}</div>
              <div className="text-[8px] font-mono text-[#444]">DefiLlama Stablecoins</div>
            </div>
          </div>
          <div className="bg-[#0a0a0a] p-3 flex items-center gap-3">
            <Radio size={14} className="text-[#00FF88]" />
            <div>
              <div className="text-[9px] font-mono text-[#555] uppercase tracking-widest">{t("blockchain.kpiFee")}</div>
              <div className="text-lg font-mono font-bold text-[#00FF88]">{fees ? `${fees.fastestFee} sat/vB` : "—"}</div>
              <div className="text-[8px] font-mono text-[#444]">mempool.space {fees ? "· live" : ""}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Stablecoins */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("blockchain.stablesTitle")}</div>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stablesChart} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#555", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} tickFormatter={(v: number) => fmtB(v)} />
                  <YAxis type="category" dataKey="symbol" tick={{ fontSize: 9, fill: "#888", fontFamily: "JetBrains Mono" }} axisLine={{ stroke: "#222" }} tickLine={false} width={50} />
                  <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #222", borderRadius: 0, fontSize: 10, fontFamily: "JetBrains Mono", color: "#e0e0e0" }} formatter={(v: number) => [fmtB(v), t("blockchain.mcap")]} />
                  <Bar dataKey="mcapUsd" barSize={12} radius={[0, 2, 2, 0]}>
                    {stablesChart.map((_, i) => <Cell key={i} fill={STABLE_COLORS[i % STABLE_COLORS.length]} fillOpacity={0.8} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="text-[8px] font-mono text-[#444] mt-1">{t("blockchain.stablesNote")}</div>
          </div>

          {/* RWA protocols */}
          <div>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#555] mb-3">{t("blockchain.rwaTitle")}</div>
            <div className="space-y-2">
              {rwaData.rwa.slice(0, 8).map((p, i) => {
                const max = rwaData.rwa[0]?.tvlUsd ?? 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#999] w-40 truncate shrink-0">{p.name}</span>
                    <div className="flex-1 h-3 bg-[#111] relative">
                      <div className="absolute inset-y-0 left-0 bg-[#00FFFF]/70" style={{ width: `${Math.max((p.tvlUsd / max) * 100, 2)}%` }} />
                    </div>
                    <span className="text-[10px] font-mono text-[#00FFFF] w-16 text-right shrink-0">{fmtB(p.tvlUsd)}</span>
                  </div>
                );
              })}
            </div>
            <div className="text-[8px] font-mono text-[#444] mt-2">{t("blockchain.rwaNote")}</div>

            {/* Carbono tokenizado — ponte com a seção de carbono */}
            <div className="border border-[#00FF88]/20 bg-[#00FF88]/5 p-4 mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Leaf size={12} className="text-[#00FF88]" />
                <div className="text-[10px] font-mono font-bold text-[#00FF88] uppercase tracking-widest">{t("blockchain.tokenTitle")}</div>
              </div>
              <div className="flex flex-wrap gap-4 mb-2">
                {rwaData.tokenizedCarbon.filter((p) => p.tvlUsd).map((p, i) => (
                  <div key={i}>
                    <div className="text-[9px] font-mono text-[#555]">{p.name}</div>
                    <div className="text-sm font-mono font-bold text-[#00FF88]">{p.tvlUsd ? fmtB(p.tvlUsd) : "—"}</div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] font-mono text-[#999] leading-relaxed">{t("blockchain.tokenText")}</p>
            </div>
          </div>
        </div>

        {/* Tese de enquadramento */}
        <div className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 mb-4">
          <p className="text-[11px] font-mono text-[#888] leading-relaxed">{t("blockchain.thesis")}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button onClick={() => onSourceClick("defillama")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">{t("blockchain.source")}: DefiLlama →</button>
          <button onClick={() => onSourceClick("mempool-space")} className="text-[9px] font-mono text-[#444] hover:text-[#00FFFF] transition-colors">mempool.space →</button>
        </div>
      </div>
    </section>
  );
}
