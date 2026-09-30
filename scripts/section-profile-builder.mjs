// ODIN — construção determinística das camadas de Section Profile (ADR-0003).
// As camadas NÃO são pedidas ao LLM: derivam da proveniência, das datas-chave e
// comparações do contexto (evidence) e dos claims já validados. Assim o
// profile governa a produção sem ampliar o que o modelo precisa inventar.
import { PROFILE_ID as CARBON_ID, PROFILE_VERSION as CARBON_VERSION } from "../contracts/sections/carbon/rules.mjs";

function buildCarbon(entry, evidence = {}) {
  const provenance = entry.provenance ?? [];
  const sourceIds = provenance.map((p) => p.sourceId);
  return {
    sectionProfile: CARBON_ID,
    profileVersion: CARBON_VERSION,
    layers: {
      sources: provenance.map((p) => ({ id: p.sourceId, sourceUrl: p.sourceUrl, asOf: p.asOf, hash: p.hash })),
      events: (evidence.keyDates ?? []).map((k) => ({ id: k.id, type: "regulatory_milestone", date: k.date, sourceRefs: sourceIds })),
      indicators: [
        ...provenance.map((p) => ({ id: `indicator-${p.metricId}`, metricId: p.metricId, sourceRefs: [p.sourceId] })),
        ...(evidence.comparisons ?? []).map((c) => ({ id: `indicator-${c.id}`, metricId: c.id, value: c.observed, reference: c.reference, unit: c.unit, direction: c.direction, sourceRefs: sourceIds })),
      ],
      intelligence: (entry.claims ?? []).map((c) => ({ id: c.id, kind: c.kind, evidenceRefs: c.evidenceRefs ?? [] })),
    },
  };
}

const BUILDERS = new Map([[CARBON_ID, buildCarbon]]);

/** Devolve os campos de profile para a seção, ou {} se ela não tem builder. */
export function buildSectionProfile(sectionId, entry, evidence) {
  const builder = BUILDERS.get(sectionId);
  return builder ? builder(entry, evidence) : {};
}
