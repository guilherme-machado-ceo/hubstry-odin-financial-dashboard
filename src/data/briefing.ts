// ============================================================
// ODIN — Briefing (PR 2b) · seleção + condensação do M1 revisado
// Regra (aprovada em 01/10/2026): o Briefing pode SELECIONAR e REORDENAR o
// conteúdo M1 já revisado, mas não cria texto nem inferência nova — em
// especial, nenhuma tese que cruze seções. Cada linha é um trecho literal de
// um campo da própria seção:
//   O que aconteceu  ← primeiro claim do tipo "fact"
//   Por que importa  ← contrato v1.1: 1ª implicação da lente Founder/CEO;
//                      v1.0: thesis (sem o rótulo "Interpretação:")
//   O que observar   ← whatToWatch[0] (v1.1: PT e EN gerados pela IA; v1.0: só PT)
//   De onde veio     ← fonte (provenance) citada pelo fato, com link
// Só entram seções com reviewStatus "approved" e reviewedBy. A ordem segue a
// ordem das seções na página (sem ranking). Testado em
// scripts/test-briefing.mjs, que confere que cada linha é substring do M1.
// Imports relativos (sem alias "@/") para o teste poder empacotar o módulo.
// ============================================================

export interface M1Claim { kind?: string; textPt?: string; textEn?: string; pt?: string; en?: string; evidenceRefs?: string[] }
export interface M1Watch { signal?: string; whyItMatters?: string; source?: string; signalPt?: string; signalEn?: string; whyItMattersPt?: string; whyItMattersEn?: string; sourceId?: string }
export interface M1Entry {
  sectionId?: string;
  reviewStatus?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  validAsOf?: string;
  thesis?: { pt?: string; en?: string };
  whatToWatch?: M1Watch[];
  claims?: M1Claim[];
  intelligenceContractVersion?: string;
  decisionLens?: { lens?: string; implications?: Array<{ textPt?: string; textEn?: string; claimRefs?: string[] }> };
  provenance?: Array<{ sourceId?: string; sourceUrl?: string }>;
}

export interface BriefingItem {
  sectionId: string;
  titlePt: string;
  titleEn: string;
  anchor: string;
  validAsOf?: string;
  reviewedAt?: string;
  happenedPt: string;
  happenedEn: string;
  whyPt: string;
  whyEn: string;
  /** "lens" (v1.1) ou "thesis" (v1.0): de onde vem o "Por que importa". */
  whyFrom: "lens" | "thesis";
  watchSignalPt: string;
  watchSignalEn: string;
  watchWhyPt: string;
  watchWhyEn: string;
  sourceId?: string;
  sourceUrl?: string;
}

/** Seções com M1, na ordem em que aparecem na página. */
export const BRIEFING_SECTIONS: Array<{ id: string; titlePt: string; titleEn: string }> = [
  { id: "climate", titlePt: "Clima", titleEn: "Climate" },
  { id: "carbon", titlePt: "Carbono e CBAM", titleEn: "Carbon and CBAM" },
  { id: "blockchain", titlePt: "Blockchain e ativos digitais", titleEn: "Blockchain and digital assets" },
];

const INTERPRETATION_LABEL = /^(Interpretação|Interpretation)\s*:\s*/;

/** Remove só o rótulo de abertura (o título "Por que importa" já cumpre esse
 * papel) e, nesse caso, põe em maiúscula a primeira letra. Nada mais muda. */
export function stripInterpretationLabel(text: string): string {
  if (!INTERPRETATION_LABEL.test(text)) return text;
  const rest = text.replace(INTERPRETATION_LABEL, "");
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

export function buildBriefing(sections: Record<string, M1Entry | undefined>): BriefingItem[] {
  const items: BriefingItem[] = [];
  for (const s of BRIEFING_SECTIONS) {
    const e = sections[s.id];
    if (!e || e.reviewStatus !== "approved" || !e.reviewedBy) continue;
    const fact = (e.claims ?? []).find((c) => c.kind === "fact");
    const watch = (e.whatToWatch ?? [])[0];
    const happenedPt = fact?.textPt ?? fact?.pt;
    const happenedEn = fact?.textEn ?? fact?.en ?? happenedPt;
    const signalPt = watch?.signalPt ?? watch?.signal;
    const whyWatchPt = watch?.whyItMattersPt ?? watch?.whyItMatters;
    const lens = e.decisionLens?.implications?.[0];
    const useLens = !!(lens?.textPt && lens?.textEn);
    if (!happenedPt || (!useLens && !e.thesis?.pt) || !signalPt || !whyWatchPt) continue;
    const src = (e.provenance ?? []).find((p) => (fact?.evidenceRefs ?? []).includes(p.sourceId ?? ""));
    items.push({
      sectionId: s.id,
      titlePt: s.titlePt,
      titleEn: s.titleEn,
      anchor: `#${s.id}`,
      validAsOf: e.validAsOf,
      reviewedAt: e.reviewedAt,
      happenedPt,
      happenedEn: happenedEn!,
      whyPt: useLens ? lens!.textPt! : stripInterpretationLabel(e.thesis!.pt!),
      whyEn: useLens ? lens!.textEn! : stripInterpretationLabel(e.thesis!.en ?? e.thesis!.pt!),
      whyFrom: useLens ? "lens" : "thesis",
      // v1.0: What to Watch publicado só em PT, reaproveitado literalmente nos dois idiomas.
      watchSignalPt: signalPt,
      watchSignalEn: watch!.signalEn ?? signalPt,
      watchWhyPt: whyWatchPt,
      watchWhyEn: watch!.whyItMattersEn ?? whyWatchPt,
      sourceId: src?.sourceId,
      sourceUrl: src?.sourceUrl,
    });
  }
  return items;
}
