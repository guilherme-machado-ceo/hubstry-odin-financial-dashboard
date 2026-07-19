// ============================================================
// CARBON DATA — Precificação de carbono e CBAM
// Conteúdo curado de fontes primárias (ver sourceRefs):
//   - Comissão Europeia (TAXUD): preços oficiais trimestrais do
//     certificado CBAM e marcos regulatórios (verificado em 2026-07)
//   - World Bank Carbon Pricing Dashboard: instrumentos globais
//     (valores aproximados — verificar fonte antes de publicar)
// Dados dinâmicos (CO2 por consumo) chegam via snapshot OWID em
// public/data/owid-co2.json com fallback para FALLBACK_OWID.
// ============================================================

export interface CbamCertPrice {
  quarter: string;
  published: string | null; // data de publicação pela Comissão Europeia
  priceEur: number | null;  // null = a publicar
}

// Preços oficiais dos certificados CBAM (média trimestral dos leilões
// do EU ETS em 2026; semanal a partir de 2027). Fonte: Comissão Europeia.
export const CBAM_CERT_PRICES: CbamCertPrice[] = [
  { quarter: "Q1 2026", published: "2026-04-07", priceEur: 75.36 },
  { quarter: "Q2 2026", published: "2026-07-06", priceEur: 75.28 },
  { quarter: "Q3 2026", published: "2026-10-05", priceEur: null },
  { quarter: "Q4 2026", published: "2027-01-04", priceEur: null },
];

export interface CbamMilestone {
  date: string;
  labelPt: string;
  labelEn: string;
  status: "done" | "next" | "future";
}

// Linha do tempo regulatória — Regulamento (UE) 2023/956, alterado pelo
// Regulamento (UE) 2025/2083 (simplificação) e pacote de 22/12/2025.
export const CBAM_TIMELINE: CbamMilestone[] = [
  { date: "2023-10", labelPt: "Fase de transição: apenas reporte trimestral de emissões, sem pagamento", labelEn: "Transitional phase: quarterly emissions reporting only, no payment", status: "done" },
  { date: "2025-10", labelPt: "Regulamento (UE) 2025/2083 — simplificação: limiar único de isenção de 50 t/ano", labelEn: "Regulation (EU) 2025/2083 — simplification: single 50 t/year de minimis threshold", status: "done" },
  { date: "2025-12", labelPt: "Pacote de atos de implementação do regime definitivo + expansão downstream (~180 categorias aço/alumínio, a partir de 2028)", labelEn: "Implementing acts package for the definitive regime + downstream expansion (~180 steel/aluminium categories, from 2028)", status: "done" },
  { date: "2026-01", labelPt: "REGIME DEFINITIVO: custos passam a incidir sobre importações nos 6 setores", labelEn: "DEFINITIVE REGIME: costs start applying to imports in the 6 covered sectors", status: "done" },
  { date: "2026-04", labelPt: "1º preço trimestral do certificado publicado (Q1 2026: €75,36/tCO₂e)", labelEn: "First quarterly certificate price published (Q1 2026: €75.36/tCO₂e)", status: "done" },
  { date: "2026-07", labelPt: "Preço Q2 2026 publicado (€75,28/tCO₂e)", labelEn: "Q2 2026 price published (€75.28/tCO₂e)", status: "done" },
  { date: "2026-10", labelPt: "Publicação do preço Q3 2026", labelEn: "Q3 2026 price publication", status: "next" },
  { date: "2027-01", labelPt: "Preço Q4 2026; a partir de 2027 o preço passa a ser semanal", labelEn: "Q4 2026 price; from 2027 onwards pricing becomes weekly", status: "future" },
  { date: "2027-02", labelPt: "Início das vendas de certificados na plataforma central comum", labelEn: "Certificate sales start on the common central platform", status: "future" },
  { date: "2027-09", labelPt: "1ª declaração anual + entrega (surrender) dos certificados referentes a 2026", labelEn: "First annual declaration + certificate surrender for 2026 imports", status: "future" },
  { date: "2027+", labelPt: "Obrigação trimestral de manter certificados ≥ 50% das emissões embutidas acumuladas", labelEn: "Quarterly obligation to hold certificates ≥ 50% of accumulated embedded emissions", status: "future" },
];

export interface CbamSector { namePt: string; nameEn: string; }
export const CBAM_SECTORS: CbamSector[] = [
  { namePt: "Cimento", nameEn: "Cement" },
  { namePt: "Ferro e aço", nameEn: "Iron & steel" },
  { namePt: "Alumínio", nameEn: "Aluminium" },
  { namePt: "Fertilizantes", nameEn: "Fertilisers" },
  { namePt: "Eletricidade", nameEn: "Electricity" },
  { namePt: "Hidrogênio", nameEn: "Hydrogen" },
];

export interface CarbonInstrument {
  name: string;
  valueUsd: number; // USD/tCO2e aproximado — snapshot Q2 2026, verificar fonte
}

// Instrumentos de precificação de carbono (ETS e taxas) — valores aproximados.
// Fonte: World Bank Carbon Pricing Dashboard. Brasil (SBCE) entra no recorte
// textual da seção, ainda sem preço definido.
export const CARBON_INSTRUMENTS: CarbonInstrument[] = [
  { name: "EU ETS", valueUsd: 80 },
  { name: "Canadá (taxa federal)", valueUsd: 60 },
  { name: "UK ETS", valueUsd: 50 },
  { name: "Califórnia (CaT)", valueUsd: 30 },
  { name: "Nova Zelândia ETS", valueUsd: 30 },
  { name: "RGGI (EUA nordeste)", valueUsd: 20 },
  { name: "China ETS nacional", valueUsd: 12 },
  { name: "Coreia do Sul ETS", valueUsd: 7 },
];

export interface OwidSeries {
  code: string;
  country: string;
  points: [number, number][]; // [ano, tCO2 per capita]
}

// Fallback do snapshot OWID (últimos valores reais, Global Carbon Project).
export const FALLBACK_OWID: OwidSeries[] = [
  { code: "BRA", country: "Brasil", points: [[2021, 2.17], [2022, 2.24], [2023, 2.23]] },
  { code: "CHN", country: "China", points: [[2021, 7.8], [2022, 7.68], [2023, 7.63]] },
  { code: "IND", country: "Índia", points: [[2021, 1.72], [2022, 1.78], [2023, 1.77]] },
  { code: "USA", country: "Estados Unidos", points: [[2021, 15.36], [2022, 15.74], [2023, 15.81]] },
  { code: "OWID_EU27", country: "União Europeia (27)", points: [[2021, 7.1], [2022, 7.22], [2023, 7.33]] },
];
