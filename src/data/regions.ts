// ============================================================
// ODIN — filtro regional: fonte única de pertencimento por país (bandeira ISO).
// Usado pelas seções filtráveis E pelas Camadas ODIN, para que nenhum número
// apareça como "da região" sem ter sido recalculado com o mesmo subconjunto.
// O Brasil pertence às duas regiões.
// ============================================================
export type Region = "all" | "BRICS" | "LATAM";

export const REGION_FLAGS: Record<Exclude<Region, "all">, readonly string[]> = {
  BRICS: ["BR", "CN", "IN", "RU", "ZA"],
  LATAM: ["BR", "MX", "AR", "CO", "CL"],
};

export function inRegion(flag: string, region: Region): boolean {
  return region === "all" || REGION_FLAGS[region].includes(flag);
}

/** Seções cujo conteúdo responde ao filtro regional (ordem de exibição). */
export const REGION_FILTERED_SECTIONS: { id: string; labelPt: string; labelEn: string }[] = [
  { id: "spreads", labelPt: "Spreads", labelEn: "Spreads" },
  { id: "volatility", labelPt: "Volatilidade", labelEn: "Volatility" },
  { id: "debt", labelPt: "Dívida", labelEn: "Debt" },
  { id: "stability", labelPt: "Estabilidade", labelEn: "Stability" },
];
