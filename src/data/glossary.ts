// ============================================================
// ODIN — Glossário de produto (PR 2b) · vocabulário controlado PT/EN
// Fonte única dos termos usados em rótulos, títulos, selos e mensagens de
// estado. NÃO se aplica a texto editorial (M1): o conteúdo revisado das
// camadas de inteligência continua com redação livre.
//
// Componentes que usam o glossário marcam o elemento com data-term="<chave>";
// scripts/test-vocabulary.mjs confere que o texto exibido é exatamente o termo
// do glossário no idioma. As camadas do Contrato de Inteligência (M1) usam os
// mesmos nomes em InsightBox.tsx, conferidos pelo mesmo teste.
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
  // ── Briefing ODIN ──
  briefing: { pt: "Briefing ODIN", en: "ODIN Briefing", defPt: "Resumo no topo do painel, montado só com seleção e condensação do conteúdo M1 já revisado por humano; não cria inferência nova entre seções.", defEn: "Summary at the top of the dashboard, built only by selecting and condensing human-reviewed M1 content; it creates no new cross-section inference." },
  whatHappened: { pt: "O que aconteceu", en: "What happened", defPt: "Primeiro fato (claim do tipo fato) da seção, com evidência.", defEn: "First fact (fact-type claim) of the section, with evidence." },
  whyItMatters: { pt: "Por que importa", en: "Why it matters", defPt: "A Tese ODIN revisada da seção.", defEn: "The section's reviewed ODIN Thesis." },
  whatToObserve: { pt: "O que observar", en: "What to watch", defPt: "Pergunta do Briefing respondida pela camada What to Watch da seção.", defEn: "Briefing question answered by the section's What to Watch layer." },
  seeEvidence: { pt: "Ver evidências", en: "See evidence", defPt: "Atalho para a seção, onde ficam o gráfico, as fontes e a camada de evidências.", defEn: "Link to the section, where the chart, sources and evidence layer are." },
  humanReviewed: { pt: "revisado por humano", en: "human-reviewed", defPt: "Conteúdo gerado por IA e promovido manualmente após revisão.", defEn: "AI-generated content manually promoted after review." },

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
  estimated: { pt: "estimado", en: "estimated", defPt: "Valor sem observação direta.", defEn: "Value without direct observation." },
  derived: { pt: "derivado", en: "derived", defPt: "Valor calculado a partir de dados de fonte (ex.: diferença entre duas taxas).", defEn: "Value computed from source data (e.g. the difference between two rates)." },
  unverified: { pt: "não verificado", en: "unverified", defPt: "Valor exibido por continuidade; conferência com fonte oficial pendente.", defEn: "Value shown for continuity; check against an official source pending." },

  // ── Camadas do Contrato de Inteligência (M1) ──
  strategicContext: { pt: "Contexto Estratégico", en: "Strategic Context", defPt: "Camada 1: o que os dados mostram.", defEn: "Layer 1: what the data show." },
  odinThesis: { pt: "Tese ODIN", en: "ODIN Thesis", defPt: "Camada 2: interpretação limitada pela evidência.", defEn: "Layer 2: interpretation bounded by evidence." },
  economicLawLens: { pt: "Lente de Direito Econômico", en: "Economic Law Lens", defPt: "Camada 3: incidência jurídica, com relevância graduada.", defEn: "Layer 3: legal incidence, with graded relevance." },
  stakeholderImplications: { pt: "Implicações para Stakeholders", en: "Stakeholder Implications", defPt: "Camada 4: consequências por público.", defEn: "Layer 4: consequences by audience." },
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
