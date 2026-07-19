// ============================================================
// BLOCKCHAIN DATA — tipos e fallbacks do snapshot diário
// (scripts/fetch-data.mjs → public/data/*.json via DefiLlama).
// Fallbacks abaixo = snapshot real de 2026-07-19, exibidos com
// badge "est." quando o JSON não está disponível.
// ============================================================

export interface CryptoAsset {
  id: string;
  name: string;
  symbol: string;
  priceUsd: number;
}

export interface StableAsset {
  name: string;
  symbol: string;
  mcapUsd: number;
}

export interface StablecoinData {
  totalMcapUsd: number;
  assets: StableAsset[];
}

export interface RwaProtocol {
  name: string;
  tvlUsd: number;
  chains: string[];
  category: string;
}

export interface TokenizedCarbonProtocol {
  name: string;
  tvlUsd: number | null;
  category: string | null;
}

export interface RwaData {
  rwa: RwaProtocol[];
  tokenizedCarbon: TokenizedCarbonProtocol[];
}

// ── Fallbacks (snapshot real de 2026-07-19, DefiLlama) ─────────────
export const FALLBACK_CRYPTO: CryptoAsset[] = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", priceUsd: 64481.2 },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", priceUsd: 1871.91 },
  { id: "solana", name: "Solana", symbol: "SOL", priceUsd: 76.18 },
  { id: "binancecoin", name: "BNB", symbol: "BNB", priceUsd: 567.94 },
  { id: "tether", name: "Tether", symbol: "USDT", priceUsd: 1.0 },
  { id: "usd-coin", name: "USD Coin", symbol: "USDC", priceUsd: 1.0 },
];

export const FALLBACK_STABLECOINS: StablecoinData = {
  totalMcapUsd: 283.4e9,
  assets: [
    { name: "Tether", symbol: "USDT", mcapUsd: 184.1e9 },
    { name: "USD Coin", symbol: "USDC", mcapUsd: 73.4e9 },
    { name: "Sky Dollar", symbol: "USDS", mcapUsd: 6.7e9 },
    { name: "Dai", symbol: "DAI", mcapUsd: 4.9e9 },
    { name: "USD1", symbol: "USD1", mcapUsd: 4.3e9 },
    { name: "Ethena USDe", symbol: "USDe", mcapUsd: 4.0e9 },
    { name: "Global Dollar", symbol: "USDG", mcapUsd: 3.2e9 },
    { name: "Circle USYC", symbol: "USYC", mcapUsd: 3.0e9 },
  ],
};

export const FALLBACK_RWA: RwaData = {
  rwa: [
    { name: "BlackRock BUIDL", tvlUsd: 3.44e9, chains: ["Ethereum"], category: "RWA" },
    { name: "Circle USYC", tvlUsd: 2.96e9, chains: ["Ethereum"], category: "RWA" },
    { name: "Tether Gold", tvlUsd: 2.86e9, chains: ["Ethereum"], category: "RWA" },
  ],
  tokenizedCarbon: [
    { name: "Toucan Protocol", tvlUsd: 531187.52, category: "RWA" },
    { name: "KlimaDAO", tvlUsd: 12302.29, category: "RWA" },
  ],
};

// ── Tipos do live fetch (mempool.space, CORS livre, sem chave) ──────
export interface MempoolFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}
