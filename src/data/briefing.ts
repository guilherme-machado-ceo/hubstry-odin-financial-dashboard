// ============================================================
// ODIN — Briefing (PR 2b) · seleção + condensação do M1 revisado
// Regra (aprovada em 01/10/2026): o Briefing pode SELECIONAR e REORDENAR o
// conteúdo M1 já revisado, mas não cria texto nem inferência nova — em
// especial, nenhuma tese que cruze seções. Cada linha é um trecho literal de
// um campo da própria seção:
//   O que aconteceu  ← primeiro claim do tipo "fact"
//   Por que importa  ← thesis (sem o rótulo "Interpretação:")
//   O que observar   ← whatToWatch[0].signal + whyItMatters
// Só entram seções com reviewStatus "approved" e reviewedBy. A ordem segue a
// ordem das seções na página (sem ranking). Testado em
// scripts/test-briefing.mjs, que confere que cada linha é substring do M1.
// Imports relativos (sem alias "@/") para o teste poder empacotar o módulo.
// ============================================================

export interface M1Claim { kind?: string; textPt?: string; textEn?: string; pt?: string; en?: string }
export interface M1Watch { signal?: string; whyItMatters?: string; source?: string }
export interface M1Entry {
  sectionId?: string;
  reviewStatus?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  validAsOf?: string;
  thesis?: { pt?: string; en?: string };
  whatToWatch?: M1Watch[];
  claims?: M1Claim[];
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
  watchSignal: string;
  watchWhy: string;
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
    if (!happenedPt || !e.thesis?.pt || !watch?.signal || !watch.whyItMatters) continue;
    items.push({
      sectionId: s.id,
      titlePt: s.titlePt,
      titleEn: s.titleEn,
      anchor: `#${s.id}`,
      validAsOf: e.validAsOf,
      reviewedAt: e.reviewedAt,
      happenedPt,
      happenedEn: happenedEn!,
      whyPt: stripInterpretationLabel(e.thesis.pt),
      whyEn: stripInterpretationLabel(e.thesis.en ?? e.thesis.pt),
      // What to Watch do M1 é publicado só em PT; reaproveitado literalmente.
      watchSignal: watch.signal,
      watchWhy: watch.whyItMatters,
    });
  }
  return items;
}
