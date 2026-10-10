// ============================================================
// ODIN — Data & Intelligence Contract v1.1 (regras determinísticas, sem LLM)
// Documento normativo: docs/odin-intelligence-contract-v1.1.md
//
// Cadeia:  SOURCE → DATA → (EVENT, opcional) → CLAIM → CONTEXT →
//          INTERPRETATION → DECISION LENS
//
// Aplica-se a entradas com intelligenceContractVersion "1.1". Entradas "1.0"
// (conteúdo M1 já publicado) continuam válidas pelas regras da v1.0.
//
// Regras desta versão:
//  1. DATA: toda provenance declara verification (verified | unverified) e
//     derivation (direct | transformed | derived | estimated).
//  2. EVENT opcional: claims citam DATA (evidenceRefs) e, se houver, eventos
//     (eventRefs). Evento exige data presente no material — nada de evento
//     artificial em snapshot.
//  3. What to Watch bilíngue gerado pela IA: signalPt, signalEn,
//     whyItMattersPt, whyItMattersEn, sourceId, expectedDate (ISO ou null).
//  4. DECISION LENS (Founder/CEO) consome CLAIM/CONTEXT/INTERPRETATION e
//     produz implicação contextual: sem número, data, fonte ou causalidade que
//     não existam na evidência/claims citados.
//  5. Linguagem de recomendação bloqueada por padrões (deôntico + ação,
//     ato de fala de recomendação, imperativo inicial, oferta de oportunidade),
//     não por lista de palavras soltas — testado com fixtures de aprovação e
//     bloqueio (contracts/contract-v1.1/recommendation-fixtures.json).
//  6. Correção editorial pós-revisão classificada como wording | structural;
//     o critério de aceite do M3 é zero mudanças structural.
// ============================================================
import { norm, hasTerm, SOURCE_REGISTRY, watchView, checkTemporalShape } from "./editorial-contract.mjs";
export { watchView };
import { extractDates, extractNumbers } from "./evidence-consistency.mjs";
import { checkLayerCompleteness, validateClaim, LEVELS } from "./insights-schema.mjs";

export const CONTRACT_V11 = "1.1";
export const VERIFICATION = new Set(["verified", "unverified"]);
export const DERIVATION = new Set(["direct", "transformed", "derived", "estimated"]);
export const LENSES = new Set(["founder_ceo"]);
export const LENS_MIN = 1;
export const LENS_MAX = 3;

const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const isIsoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? "");
const err = (rule, path, detail) => ({ rule, path, detail });
const splitSentences = (text) => String(text ?? "").split(/(?<=[.;!?])\s+/).map((s) => s.trim()).filter(Boolean);
const tokens = (text) => norm(text).match(/[\p{L}\p{N}]+(?:-[\p{L}]+)?/gu) ?? [];

// ── 1. DATA: procedência em dois eixos ──────────────────────────────────────
export function checkProvenanceAxes(entry) {
  const errors = [];
  for (const [i, p] of (entry.provenance ?? []).entries()) {
    if (!VERIFICATION.has(p?.verification)) errors.push(err("data_verification", `provenance[${i}]`, `verification inválido: ${p?.verification}`));
    if (!DERIVATION.has(p?.derivation)) errors.push(err("data_derivation", `provenance[${i}]`, `derivation inválido: ${p?.derivation}`));
  }
  return errors;
}

// ── 2. EVENT opcional ───────────────────────────────────────────────────────
export function checkEvents(entry, evidence) {
  const errors = [];
  const events = entry.events ?? [];
  if (!Array.isArray(events)) return [err("event_shape", "events", "events deve ser array")];
  const sourceIds = new Set((entry.provenance ?? []).map((p) => p.sourceId));
  const materialDates = new Set(extractDates(evidence?.material ?? "").dates);
  for (const k of evidence?.keyDates ?? []) materialDates.add(k.date);
  const ids = new Set();
  for (const [i, e] of events.entries()) {
    const at = `events[${i}]`;
    if (!nonEmpty(e?.id)) errors.push(err("event_shape", at, "id ausente"));
    ids.add(e?.id);
    if (!isIsoDate(e?.date)) errors.push(err("event_shape", at, `date deve ser YYYY-MM-DD: ${e?.date}`));
    else if (!materialDates.has(e.date)) errors.push(err("event_date_not_in_source", at, `data ${e.date} não está no material`));
    if (!nonEmpty(e?.labelPt) || !nonEmpty(e?.labelEn)) errors.push(err("event_shape", at, "labelPt/labelEn ausente"));
    if (!Array.isArray(e?.dataRefs) || !e.dataRefs.length) errors.push(err("event_without_data", at, "evento sem dataRefs"));
    for (const r of e?.dataRefs ?? []) if (!sourceIds.has(r)) errors.push(err("event_data_ref", at, `dataRef ${r} fora da provenance`));
  }
  for (const c of entry.claims ?? []) {
    for (const r of c.eventRefs ?? []) if (!ids.has(r)) errors.push(err("claim_event_ref", `claims[${c.id}]`, `eventRef ${r} inexistente`));
  }
  return errors;
}

// ── 3. What to Watch bilíngue ───────────────────────────────────────────────
export function checkWatchV11(entry) {
  const errors = [];
  const sourceIds = new Set((entry.provenance ?? []).map((p) => p.sourceId));
  for (const [i, w] of (entry.whatToWatch ?? []).entries()) {
    const at = `whatToWatch[${i}]`;
    for (const f of ["signalPt", "signalEn", "whyItMattersPt", "whyItMattersEn", "sourceId"]) if (!nonEmpty(w?.[f])) errors.push(err("watch_v11_field", at, `${f} ausente`));
    if (!("expectedDate" in (w ?? {}))) errors.push(err("watch_v11_field", at, "expectedDate ausente (use null quando não houver)"));
    else if (w.expectedDate !== null && !isIsoDate(w.expectedDate)) errors.push(err("watch_v11_field", at, `expectedDate inválido: ${w.expectedDate}`));
    if (nonEmpty(w?.sourceId) && sourceIds.size && !sourceIds.has(w.sourceId)) errors.push(err("watch_v11_source", at, `sourceId ${w.sourceId} fora da provenance`));
    if (nonEmpty(w?.signalPt) && nonEmpty(w?.signalEn) && norm(w.signalPt) === norm(w.signalEn)) errors.push(err("watch_v11_language", at, "signalEn idêntico a signalPt"));
  }
  return errors;
}

// ── 5. Linguagem de recomendação (padrões, não palavras soltas) ─────────────
// Verbos de acompanhamento/análise: implicação contextual, não ação operacional.
const MONITOR = ["acompanh", "monitor", "observ", "avali", "verific", "mape", "rastre", "track", "watch", "follow", "observ", "assess", "review", "map", "check", "keep track"];
const isMonitor = (tok) => MONITOR.some((m) => tok.startsWith(m));
// Deônticos (obrigação/necessidade dirigida ao leitor).
const DEONTIC = [
  ["deve"], ["devem"], ["deveria"], ["deveriam"], ["precisa"], ["precisam"], ["precisar"], ["precisariam"], ["precisaria"],
  ["tem", "que"], ["tem", "de"], ["e", "preciso"], ["e", "necessario"], ["e", "recomendavel"], ["e", "aconselhavel"], ["convem"],
  ["should"], ["must"], ["need", "to"], ["needs", "to"], ["ought", "to"], ["have", "to"], ["has", "to"],
];
// Necessidade hipotética ("podem precisar", "may need to"): contextual só com verbo de acompanhamento.
const HEDGE = new Set(["pode", "podem", "poderia", "poderiam", "may", "might", "could"]);
const SKIP_AFTER_DEONTIC = new Set(["tambem", "ainda", "urgentemente", "rapidamente", "imediatamente", "agora", "nao", "se", "also", "still", "urgently", "immediately", "quickly", "now", "not", "then", "entao", "logo", "possivelmente", "eventualmente"]);
const COPULA = new Set(["ser", "estar", "be", "being", "get"]);
// Marcadores de obrigação jurídica descrita (não é recomendação do ODIN).
const LEGAL_DESCRIPTION = ["declarac*", "declaration*", "importador* autorizad*", "authorized importer*", "authorised importer*", "regulament*", "regulation*", "lei", "law", "diretiva*", "directive*", "obrigatori*", "obrigad*", "required", "require*", "exige*", "exigid*", "obrigac*", "obligation*", "norma*", "ato* de execucao", "implementing act*", "segundo o regime", "under the regime", "pelo regime"];
const SPEECH_ACT = ["recomend*", "sugerimos", "sugere-se", "aconselh*", "orienta-se", "recommend*", "we suggest", "it is advisable", "is advisable", "we advise", "advise*"];
const PT_IMPERATIVE = ["invista", "compre", "venda", "reduza", "aumente", "corte", "entre", "saia", "evite", "priorize", "contrate", "diversifique", "proteja", "explore", "aproveite", "antecipe", "adie", "renegocie", "negocie", "considere", "busque", "foque", "mude", "adote", "lance", "expanda", "acelere", "trave", "garanta", "aloque", "migre", "desinvista"];
const EN_ACTION = ["invest", "buy", "sell", "reduce", "increase", "cut", "enter", "exit", "avoid", "prioritize", "prioritise", "hire", "diversify", "hedge", "expand", "explore", "seize", "leverage", "shift", "move", "adopt", "launch", "build", "raise", "lock", "allocate", "accelerate", "delay", "stop", "start", "switch", "focus", "consider", "negotiate", "renegotiate", "secure", "protect", "capitalize", "capitalise", "exploit", "tap", "pursue", "divest"];
const PT_NOT_VERB = new Set(["poder", "lugar", "par", "mar", "bar", "dever", "olhar", "jantar", "prazer", "mulher", "ser", "ar", "lar", "nivel", "valor", "exterior", "interior", "setor", "maior", "menor", "melhor", "pior", "anterior", "posterior", "superior", "inferior", "importador", "exportador", "investidor", "produtor", "consumidor", "particular", "regular", "similar", "popular", "solar", "nuclear", "familiar", "militar", "titular", "dolar", "celular", "modular", "circular", "lunar", "polar", "escolar", "bilionar"]);
const OPPORTUNITY_MODAL = new Set(["pode", "podem", "poderia", "poderiam", "may", "might", "could", "can"]);
const OPPORTUNITY_VERB = ["invest", "compr", "vend", "aloc", "aproveit", "explor", "captur", "expand", "buy", "sell", "allocat", "seiz", "exploit", "captur", "tap", "capitaliz", "entrar", "enter"];

function deonticAt(toks, i) {
  for (const d of DEONTIC) if (d.every((w, k) => toks[i + k] === w)) return d.length;
  return 0;
}

/**
 * Classifica uma frase em três categorias (contrato v1.1, seção 7):
 *   DESCRIÇÃO DE OBRIGAÇÃO LEGAL → permitida só quando ancorada em norma/
 *     evidência jurídica da seção (ctx.legalAnchors não vazio) e a frase traz
 *     marcador jurídico;
 *   IMPLICAÇÃO CONTEXTUAL → permitida;
 *   RECOMENDAÇÃO DE AÇÃO → bloqueada.
 * Devolve null (permitida) ou { rule, match }.
 * R1 deôntico dirigido a um ator: bloqueia com QUALQUER verbo ("governos devem
 *    avaliar" é recomendação de política), salvo necessidade hipotética
 *    ("podem precisar acompanhar", "may need to track") com verbo de
 *    acompanhamento; R2 ato de fala de recomendação; R3 frase iniciada por
 *    imperativo/infinitivo de ação; R4 modal de possibilidade + verbo de
 *    oportunidade/transação ("podem investir", "could tap").
 */
export function classifyRecommendation(sentence, ctx = {}) {
  const t = tokens(sentence);
  if (!t.length) return null;
  const anchored = (ctx.legalAnchors ?? []).filter(Boolean).length > 0;
  const legal = anchored && LEGAL_DESCRIPTION.some((m) => hasTerm(sentence, m));
  // R2
  const act = SPEECH_ACT.find((m) => hasTerm(sentence, m));
  if (act) return { rule: "R2_speech_act", match: act.replace("*", "") };
  // R3 — primeira palavra da frase
  const first = t[0];
  if (PT_IMPERATIVE.includes(first)) return { rule: "R3_imperative", match: first };
  if (EN_ACTION.includes(first)) return { rule: "R3_imperative", match: first };
  if (/^[a-z]{3,}(ar|er|ir)$/.test(first) && !PT_NOT_VERB.has(first) && !isMonitor(first)) return { rule: "R3_infinitive", match: first };
  // R1
  if (!legal) {
    for (let i = 0; i < t.length; i++) {
      const n = deonticAt(t, i);
      if (!n) continue;
      let j = i + n;
      while (j < t.length && SKIP_AFTER_DEONTIC.has(t[j])) j++;
      if (t[j] === "a" || t[j] === "de") j++;
      if (COPULA.has(t[j])) j++;
      const verb = t[j];
      if (!verb) continue;
      if (verb === "precisar" || verb === "need") continue; // o deôntico seguinte decide
      const hedged = HEDGE.has(t[i - 1]) || (t[i - 1] === "to" && HEDGE.has(t[i - 3]));
      const necessity = ["precisar", "precisam", "precisa", "need", "needs"].includes(t[i]);
      if (hedged && necessity && isMonitor(verb)) continue;
      return { rule: "R1_deontic", match: `${t.slice(i, i + n).join(" ")} ${verb}` };
    }
  }
  // R4
  for (let i = 0; i < t.length - 1; i++) {
    if (!OPPORTUNITY_MODAL.has(t[i])) continue;
    const v = t[i + 1];
    if (!OPPORTUNITY_VERB.some((p) => v.startsWith(p))) continue;
    if ((v === "entrar" && t[i + 2] === "em" && t[i + 3] === "vigor") || (v === "enter" && t[i + 2] === "into" && t[i + 3] === "force")) continue;
    return { rule: "R4_opportunity", match: `${t[i]} ${v}` };
  }
  return null;
}

export function checkRecommendationLanguage(path, text, ctx = {}) {
  const errors = [];
  for (const s of splitSentences(text)) {
    const hit = classifyRecommendation(s, ctx);
    if (hit) errors.push(err("recommendation_language", path, `${hit.rule} ("${hit.match}") — "${s.slice(0, 160)}"`));
  }
  return errors;
}

/** Âncoras jurídicas da seção: normas citadas (relevância material) e referências jurídicas da evidência. */
export function legalContext(entry, evidence) {
  const material = ["high", "medium"].includes(entry?.economicLaw?.relevance);
  const norms = material ? (entry.economicLaw.norms ?? []) : [];
  const refs = (evidence?.legalRefs ?? []).flatMap((r) => r.labels ?? [r.id]).filter(Boolean);
  return { legalAnchors: [...norms, ...refs] };
}

// ── 4. DECISION LENS ────────────────────────────────────────────────────────
const CAUSAL = ["porque", "devido a", "devido ao", "devido a", "por causa", "causa*", "causou", "provoc*", "leva a", "levou a", "levara", "resulta* em", "resultou", "impulsion*", "decorre*", "em razao de", "gracas a", "por conta de", "because", "due to", "caus*", "leads to", "led to", "lead to", "results in", "resulted in", "drives", "driven by", "owing to", "thanks to", "as a result"];
const hasCausal = (text) => CAUSAL.find((c) => hasTerm(text, c));

// Métricas de domínio que só podem aparecer numa implicação da lente se um
// claim CITADO as sustentar. Não é comparação de palavras: cada grupo reúne
// sinônimos PT/EN de uma mesma métrica, e só vale quando algum claim da seção
// a contém (casos reais: shadow #34 blockchain/clima, #32 carbono). Entidades
// que descrevem público (importador, stablecoins, BTC) ficam de fora: "founders
// com clientes importadores" descreve a quem se aplica, não usa um dado.
export const METRIC_TERMS = {
  "TVL": ["tvl", "total value locked", "valor total bloqueado"],
  "capitalização de mercado": ["market cap", "market capitalization", "capitalizacao de mercado", "capitalizacao"],
  "temperatura": ["temperatura*", "temperature*"],
  "precipitação": ["precipitac*", "precipitation*", "chuva*", "rainfall"],
  "emissões": ["emisso*", "emissao", "emission*"],
  "preço": ["preco*", "price*"],
  "declaração anual": ["declarac*", "declaration*"],
  "regime definitivo": ["regime definitivo", "periodo definitivo", "definitive regime", "definitive period"],
};
const groupsIn = (text) => Object.entries(METRIC_TERMS).filter(([, terms]) => terms.some((t) => hasTerm(text, t))).map(([g]) => g);

export function checkDecisionLens(entry, evidence) {
  const errors = [];
  const lens = entry.decisionLens;
  if (!lens || typeof lens !== "object") return [err("lens_missing", "decisionLens", "decisionLens ausente")];
  if (!LENSES.has(lens.lens)) errors.push(err("lens_type", "decisionLens.lens", `lente inválida: ${lens.lens}`));
  const imps = lens.implications;
  if (!Array.isArray(imps) || imps.length < LENS_MIN || imps.length > LENS_MAX) {
    errors.push(err("lens_count", "decisionLens.implications", `entre ${LENS_MIN} e ${LENS_MAX} implicações (recebido ${Array.isArray(imps) ? imps.length : 0})`));
    if (!Array.isArray(imps)) return errors;
  }
  const claims = new Map((entry.claims ?? []).map((c) => [c.id, c]));
  const materialText = evidence?.material ?? "";
  const matNums = new Set(extractNumbers(materialText).flatMap((x) => x.candidates));
  const matDates = new Set(extractDates(materialText).dates);
  for (const k of evidence?.keyDates ?? []) matDates.add(k.date);
  const registryNames = Object.entries(SOURCE_REGISTRY).map(([id, s]) => ({ id, publisher: s.publisher }));
  const provIds = new Set((entry.provenance ?? []).map((p) => p.sourceId));
  for (const [i, imp] of imps.entries()) {
    const at = `decisionLens.implications[${i}]`;
    if (!nonEmpty(imp?.textPt) || !nonEmpty(imp?.textEn)) { errors.push(err("lens_shape", at, "textPt/textEn ausente")); continue; }
    const refs = imp.claimRefs ?? [];
    if (!Array.isArray(refs) || !refs.length) errors.push(err("lens_without_claims", at, "claimRefs vazio: a lente precisa consumir claims"));
    for (const r of refs) if (!claims.has(r)) errors.push(err("lens_claim_ref", at, `claimRef ${r} inexistente`));
    const cited = refs.map((r) => claims.get(r)).filter(Boolean);
    const citedText = cited.map((c) => `${c.textPt ?? ""} ${c.textEn ?? ""}`).join(" ");
    // lens_claim_coverage: cada métrica usada pela implicação precisa de um claim citado que a contenha.
    const citedGroups = new Set(groupsIn(citedText));
    for (const g of groupsIn(`${imp.textPt} ${imp.textEn}`)) {
      if (citedGroups.has(g)) continue;
      const carriers = [...claims.values()].filter((c) => groupsIn(`${c.textPt ?? ""} ${c.textEn ?? ""}`).includes(g)).map((c) => c.id);
      if (carriers.length) errors.push(err("lens_claim_coverage", at, `usa ${g}, que está em ${carriers.join(", ")}, mas claimRefs cita só ${refs.join(", ") || "nada"}: inclua o claim que sustenta esse dado`));
    }
    const okNums = new Set([...matNums, ...extractNumbers(citedText).flatMap((x) => x.candidates)]);
    const okDates = new Set([...matDates, ...extractDates(citedText).dates]);
    for (const [lang, text] of [["pt", imp.textPt], ["en", imp.textEn]]) {
      const p = `${at}.${lang}`;
      for (const { token, candidates } of extractNumbers(text)) {
        if (candidates.every((n) => Number.isInteger(n) && n >= 0 && n <= 10)) continue;
        if (!candidates.some((n) => okNums.has(n))) errors.push(err("lens_new_number", p, `número ${token} não está na evidência nem nos claims citados`));
      }
      for (const d of extractDates(text).dates) if (!okDates.has(d)) errors.push(err("lens_new_date", p, `data ${d} não está na evidência nem nos claims citados`));
      if (/https?:\/\/|www\./i.test(text)) errors.push(err("lens_new_source", p, "URL na lente: fontes pertencem à camada DATA"));
      for (const r of registryNames) {
        const short = r.publisher.split(/[—(]/)[0].trim();
        if (short.length > 4 && hasTerm(text, short) && !provIds.has(r.id)) errors.push(err("lens_new_source", p, `cita ${short}, fora da provenance da seção`));
      }
      const causal = hasCausal(text);
      if (causal && !cited.some((c) => hasCausal(`${c.textPt ?? ""} ${c.textEn ?? ""}`))) errors.push(err("lens_new_causality", p, `"${causal.replace("*", "")}" sem relação causal nos claims citados`));
      errors.push(...checkRecommendationLanguage(p, text, legalContext(entry, evidence)));
    }
  }
  return errors;
}

// ── 6. Correção editorial pós-revisão ───────────────────────────────────────
export const STRUCTURAL_FIELDS = ["claims", "provenance", "events", "evidenceRefs", "eventRefs", "claimRefs", "whatToWatch.sourceId", "whatToWatch.expectedDate", "economicLaw.relevance", "economicLaw.norms", "economicLaw.institutions", "economicLaw.sourceRefs", "confidence", "validAsOf", "decisionLens.lens", "decisionLens.implications.claimRefs", "layers"];

/** v1.1: editorialCorrection.changes[] = { field, kind: "wording" | "structural", reason }. */
export function checkEditorialCorrection(entry) {
  const errors = [];
  const ec = entry.editorialCorrection;
  if (!ec) return errors;
  const changes = ec.changes;
  if (!Array.isArray(changes)) return [err("correction_shape", "editorialCorrection", "v1.1 exige changes[] com field, kind e reason")];
  for (const [i, c] of changes.entries()) {
    const at = `editorialCorrection.changes[${i}]`;
    if (!nonEmpty(c?.field) || !nonEmpty(c?.reason) || !["wording", "structural"].includes(c?.kind)) { errors.push(err("correction_shape", at, "field/kind/reason inválidos")); continue; }
    const structuralField = STRUCTURAL_FIELDS.some((f) => c.field === f || c.field.startsWith(`${f}[`) || c.field.startsWith(`${f}.`));
    if (structuralField && c.kind === "wording") errors.push(err("correction_misclassified", at, `${c.field} é campo contratual; mudança não pode ser classificada como wording`));
  }
  return errors;
}

/** Métrica de aceite do M3: nº de mudanças estruturais pós-revisão. */
export function structuralCorrectionCount(entry) {
  const changes = entry.editorialCorrection?.changes ?? [];
  return changes.filter((c) => c.kind === "structural" || STRUCTURAL_FIELDS.some((f) => c.field === f || c.field?.startsWith(`${f}[`) || c.field?.startsWith(`${f}.`))).length;
}

/** Todas as regras v1.1 de uma seção (estrutura + semântica determinística). */
export function checkContractV11(entry, evidence) {
  const ctx = legalContext(entry, evidence);
  const stakeholderErrors = (entry.stakeholderImplications ?? []).flatMap((s, i) => [
    ...checkRecommendationLanguage(`stakeholderImplications[${i}].pt`, s.textPt, ctx),
    ...checkRecommendationLanguage(`stakeholderImplications[${i}].en`, s.textEn, ctx),
  ]);
  return [
    ...checkProvenanceAxes(entry),
    ...checkEvents(entry, evidence),
    ...checkWatchV11(entry),
    ...checkDecisionLens(entry, evidence),
    ...stakeholderErrors,
    ...checkEditorialCorrection(entry),
  ];
}

export const formatContractError = (e) => `[${e.rule}] ${e.path}: ${e.detail}`;

/**
 * Contrato da saída crua do modelo (v1.1), usado no retry de contrato do
 * gerador: estrutura das 5 camadas + What to Watch bilíngue + lente
 * Founder/CEO + regras semânticas determinísticas da lente e da linguagem
 * não recomendativa. `ctx` traz a provenance, os eventos e a evidência da
 * seção (montados pelo código, não pelo modelo).
 */
export function validateModelOutputV11(parsed, sectionId, ctx = {}) {
  if (!parsed || typeof parsed !== "object") return ["saída não é objeto JSON"];
  const provenance = ctx.provenance ?? [];
  const allowed = new Set(provenance.map((p) => p.sourceId));
  const errors = [...checkLayerCompleteness(parsed, sectionId)];
  for (const [i, c] of (parsed.claims ?? []).entries()) {
    errors.push(...validateClaim(c, `claims[${i}]`));
    for (const ref of c?.evidenceRefs ?? []) if (allowed.size && !allowed.has(ref)) errors.push(`claims[${i}].evidenceRefs: ${ref} fora da provenance permitida`);
  }
  for (const [i, s] of (parsed.stakeholderImplications ?? []).entries()) {
    if (!["government", "corporate", "investors", "startups"].includes(s?.audience)) errors.push(`stakeholderImplications[${i}].audience inválido`);
    if (!nonEmpty(s?.textPt) || !nonEmpty(s?.textEn)) errors.push(`stakeholderImplications[${i}] textPt/textEn ausente`);
  }
  if (!LEVELS.has(parsed.confidence?.data) || !LEVELS.has(parsed.confidence?.interpretation)) errors.push("confidence inválida");
  if (!nonEmpty(parsed.limitations)) errors.push("limitations ausente");
  const entry = { ...parsed, provenance, events: ctx.events ?? [] };
  const semantic = [
    ...checkWatchV11(entry),
    ...checkEvents(entry, ctx.evidence),
    ...checkDecisionLens(entry, ctx.evidence),
    ...(entry.stakeholderImplications ?? []).flatMap((s, i) => [
      ...checkRecommendationLanguage(`stakeholderImplications[${i}].pt`, s?.textPt, legalContext(entry, ctx.evidence)),
      ...checkRecommendationLanguage(`stakeholderImplications[${i}].en`, s?.textEn, legalContext(entry, ctx.evidence)),
    ]),
    // Mesma função do gate final (checkEditorialContract): a nova tentativa da
    // seção recebe o erro de tendência em snapshot e pode corrigi-lo.
    ...checkTemporalShape(entry, ctx.evidence),
  ];
  return [...errors, ...semantic.map(formatContractError)];
}
