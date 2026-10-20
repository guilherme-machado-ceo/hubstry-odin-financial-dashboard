// ============================================================
// ODIN — Glossário de produto (PR 2b) · vocabulário controlado PT/EN
// Fonte única dos termos usados em rótulos, títulos, selos e mensagens de
// estado da interface determinística.
//
// Componentes que usam o glossário marcam o elemento com data-term="<chave>";
// scripts/test-vocabulary.mjs confere o texto exibido em português e inglês.
// Imports relativos (sem alias "@/") para o teste poder empacotar o módulo.
// ============================================================

export type Locale = "pt" | "en";

export interface GlossaryTerm {
  pt: string;
  en: string;
  defPt: string;
  defEn: string;
}

export const GLOSSARY = {

  // ── Fontes e sinais (camadas estruturais por seção) ──
  sourcesAndSignals: { pt: "Fontes e sinais", en: "Sources and signals", defPt: "Bloco por seção com fontes, data de referência, indicadores, eventos e o sinal a acompanhar.", defEn: "Per-section block with sources, reference date, indicators, events and the signal to watch." },
  noAI: { pt: "sem IA", en: "no AI", defPt: "Valores extraídos dos dados da seção, sem geração por IA.", defEn: "Values extracted from the section's data, with no AI generation." },
  sourcesAndReferenceDate: { pt: "Fontes e data de referência", en: "Sources and reference date", defPt: "Lista de fontes com a data a que cada dado se refere.", defEn: "List of sources with the date each figure refers to." },
  referenceDate: { pt: "data de referência", en: "reference date", defPt: "Data a que o dado se refere (fato, não julgamento de atualidade).", defEn: "Date the figure refers to (a fact, not a freshness judgment)." },
  keyIndicators: { pt: "Indicadores-chave", en: "Key indicators", defPt: "Indicadores extraídos dos mesmos dados exibidos na seção.", defEn: "Indicators extracted from the same data shown in the section." },
  eventsAndMilestones: { pt: "Eventos e marcos", en: "Events and milestones", defPt: "Fatos datados relevantes para a seção.", defEn: "Dated facts relevant to the section." },
  signal: { pt: "Sinal", en: "Signal", defPt: "Algo monitorável, com fonte, cuja próxima atualização pode mudar a leitura.", defEn: "Something monitorable, with a source, whose next update may change the reading." },
  source: { pt: "fonte", en: "source", defPt: "Publicação ou série de onde o dado vem.", defEn: "Publication or series the figure comes from." },
  region: { pt: "região", en: "region", defPt: "Subconjunto de países do filtro regional; indicadores são recalculados.", defEn: "Country subset from the regional filter; indicators are recalculated." },
  live: { pt: "ao vivo", en: "live", defPt: "Consultado no navegador a cada visita.", defEn: "Fetched in the browser on each visit." },

  // ── Estados do dado (procedência) ──
  verified: { pt: "verificado", en: "verified", defPt: "Valor que confere com a fonte citada (coletado por código ou conferido na auditoria).", defEn: "Value that matches the cited source (collected by code or checked in the audit)." },
  direct: { pt: "direto", en: "direct", defPt: "Valor como publicado pela fonte.", defEn: "Value as published by the source." },
  transformed: { pt: "transformado", en: "transformed", defPt: "Valor da fonte com troca de unidade, moeda ou escala.", defEn: "Source value with a change of unit, currency or scale." },
  estimated: { pt: "estimado", en: "estimated", defPt: "Valor sem observação direta.", defEn: "Value without direct observation." },
  derived: { pt: "derivado", en: "derived", defPt: "Valor calculado a partir de dados de fonte (ex.: diferença entre duas taxas).", defEn: "Value computed from source data (e.g. the difference between two rates)." },
  unverified: { pt: "não verificado", en: "unverified", defPt: "Valor exibido por continuidade; conferência com fonte oficial pendente.", defEn: "Value shown for continuity; check against an official source pending." },

  economicLawLens: { pt: "Lente de Direito Econômico", en: "Economic Law Lens", defPt: "Camada 3: incidência jurídica, com relevância graduada.", defEn: "Layer 3: legal incidence, with graded relevance." },
  whatToWatch: { pt: "What to Watch", en: "What to Watch", defPt: "Camada 5: sinal monitorável com fonte (nome do contrato, igual nos dois idiomas).", defEn: "Layer 5: monitorable signal with a source (contract name, same in both languages)." },
} as const satisfies Record<string, GlossaryTerm>;

export type TermKey = keyof typeof GLOSSARY;

export function term(key: TermKey, locale: string): string {
  return GLOSSARY[key][locale === "pt" ? "pt" : "en"];
}

export function termDef(key: TermKey, locale: string): string {
  const t = GLOSSARY[key];
  return locale === "pt" ? t.defPt : t.defEn;
}
