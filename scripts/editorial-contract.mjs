// ODIN — contrato editorial determinístico (MVP Readiness Gate, gate v1.4).
// Origem: revisão humana do run odin-20260930-155006-8ab9, que passou nos gates
// estruturais mas continha afirmações não rastreáveis. Cada regra aqui verifica
// RASTREABILIDADE À EVIDÊNCIA, não presença de texto:
//   - What to Watch: datas e números devem estar no material; o sinal deve ser
//     algo que a fonte citada publica (registry de fontes), sem fora-de-escopo,
//     e a cadência citada deve ser a da métrica;
//   - Economic Law: toda norma/instituição listada deve corresponder a uma
//     referência jurídica registrada na evidência da seção; `high` exige
//     norma + instituição + sourceRef; pt e en devem citar as MESMAS
//     referências (equivalência referencial, não igualdade textual);
//   - forma temporal: fonte `snapshot` não sustenta linguagem de tendência;
//   - vazamento de instrução do prompt no texto publicado.
import { readFileSync } from "node:fs";
import path from "node:path";
import { extractDates, extractNumbers, sectionTexts } from "./evidence-consistency.mjs";

const REGISTRY = JSON.parse(readFileSync(path.join(process.cwd(), "contracts/sources/registry.json"), "utf8"));
export const SOURCE_REGISTRY = REGISTRY.sources ?? {};

/** Minúsculas, sem acento. */
export const norm = (s) => String(s ?? "").normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Termo casado como palavra/expressão inteira; com * final, por prefixo de palavra. */
export function hasTerm(text, term) {
  const t = norm(term);
  const prefix = t.endsWith("*");
  const body = escapeRe(prefix ? t.slice(0, -1) : t);
  const re = new RegExp(`(^|[^\\p{L}\\p{N}])${body}${prefix ? "" : "(?![\\p{L}\\p{N}])"}`, "u");
  return re.test(norm(text));
}
const anyTerm = (text, terms = []) => terms.find((t) => hasTerm(text, t));

/** What to Watch nas duas formas do contrato (v1.0: signal/whyItMatters/source; v1.1: bilíngue/sourceId). */
export function watchView(w) {
  return {
    signalPt: w?.signalPt ?? w?.signal ?? "",
    signalEn: w?.signalEn ?? "",
    whyPt: w?.whyItMattersPt ?? w?.whyItMatters ?? "",
    whyEn: w?.whyItMattersEn ?? "",
    sourceId: w?.sourceId ?? w?.source ?? "",
    expectedDate: w?.expectedDate ?? null,
  };
}

const CADENCE_WORDS = {
  daily: ["diari*", "daily"],
  weekly: ["semana*", "weekly"],
  monthly: ["mensal*", "monthly"],
  quarterly: ["trimestra*", "quarterly"],
  annual: ["anual*", "annual*", "yearly"],
};

function materialFacts(evidence) {
  const material = evidence?.material ?? "";
  const dates = new Set(extractDates(material).dates);
  for (const k of evidence?.keyDates ?? []) dates.add(k.date);
  const nums = new Set(extractNumbers(material).flatMap((x) => x.candidates));
  return { dates, nums };
}

/** What to Watch: data, número, escopo da fonte e cadência. */
export function checkWatch(entry, evidence) {
  const errors = [];
  const { dates, nums } = materialFacts(evidence);
  for (const [i, raw] of (entry.whatToWatch ?? []).entries()) {
    const at = `whatToWatch[${i}]`;
    const v = watchView(raw);
    const w = { signal: [v.signalPt, v.signalEn].filter(Boolean).join(" / "), whyItMatters: [v.whyPt, v.whyEn].filter(Boolean).join(" "), source: v.sourceId, expectedDate: v.expectedDate };
    const text = `${w.signal ?? ""}. ${w.whyItMatters ?? ""}`;
    if (w.expectedDate && !dates.has(w.expectedDate)) errors.push({ rule: "watch_date_not_in_source", path: at, detail: `expectedDate ${w.expectedDate} não está no material da seção` });
    for (const d of extractDates(text).dates) if (!dates.has(d)) errors.push({ rule: "watch_date_not_in_source", path: at, detail: `data ${d} no texto não está no material` });
    for (const { token, candidates } of extractNumbers(text)) {
      if (candidates.every((n) => Number.isInteger(n) && n >= 0 && n <= 10)) continue;
      if (!candidates.some((n) => nums.has(n))) errors.push({ rule: "watch_number_not_in_source", path: at, detail: `número ${token} não está no material` });
    }
    const src = SOURCE_REGISTRY[w.source];
    if (!src) { errors.push({ rule: "watch_source_unregistered", path: at, detail: `fonte ${w.source} sem capacidades registradas` }); continue; }
    const signal = w.signal ?? "";
    const oos = anyTerm(signal, src.outOfScope);
    if (oos) errors.push({ rule: "watch_signal_out_of_scope", path: at, detail: `${w.source} não publica "${oos}" — "${signal}"` });
    else if (!anyTerm(signal, src.supports)) errors.push({ rule: "watch_signal_unsupported", path: at, detail: `${w.source} publica ${src.publishes}; o sinal não corresponde — "${signal}"` });
    for (const m of src.metrics ?? []) {
      if (!anyTerm(signal, m.terms)) continue;
      for (const [cadence, words] of Object.entries(CADENCE_WORDS)) {
        if (cadence !== m.cadence && anyTerm(signal, words)) errors.push({ rule: "watch_cadence_mismatch", path: at, detail: `métrica publicada com cadência ${m.cadence}, sinal fala em ${cadence} — "${signal}"` });
      }
    }
  }
  return errors;
}

const NORM_PATTERN = /(regulamento|regulation|diretiva|directive|lei|law|act|decreto|decree|resolu[cç][aã]o|resolution)\s*(\((ue|eu)\)\s*)?(n[º°o.]*\s*)?\d{1,5}[/.]\d{2,4}/giu;
const KNOWN_LEGAL_ACRONYMS = ["mica", "genius act", "howey", "sec", "cftc", "cvm", "esma", "eba", "fatf", "gafi"];

function refsMentioned(text, legalRefs) {
  return new Set(legalRefs.filter((r) => r.labels.some((l) => norm(text).includes(norm(l)))).map((r) => r.id));
}

/** Economic Law: rastreabilidade por relevância e equivalência referencial pt/en. */
export function checkEconomicLaw(entry, evidence) {
  const errors = [];
  const law = entry.economicLaw;
  if (!law) return errors;
  const legalRefs = evidence?.legalRefs ?? [];
  const provIds = new Set((entry.provenance ?? []).map((p) => p.sourceId));
  const at = "economicLaw";
  for (const kind of ["norms", "institutions"]) {
    const refKind = kind === "norms" ? "norm" : "institution";
    for (const item of law[kind] ?? []) {
      const match = legalRefs.some((r) => r.kind === refKind && r.labels.some((l) => norm(item).includes(norm(l))));
      if (!match) errors.push({ rule: "law_ref_untraceable", path: `${at}.${kind}`, detail: `"${item}" não corresponde a referência jurídica registrada na evidência da seção` });
    }
  }
  for (const ref of law.sourceRefs ?? []) if (!provIds.has(ref)) errors.push({ rule: "law_sourceref_unknown", path: `${at}.sourceRefs`, detail: `${ref} não está na provenance da seção` });
  if (law.relevance === "high") {
    for (const f of ["norms", "institutions", "sourceRefs"]) if (!(law[f] ?? []).length) errors.push({ rule: "law_high_incomplete", path: `${at}.${f}`, detail: "relevância high exige norma, instituição e sourceRef rastreáveis" });
  }
  // Equivalência referencial pt ↔ en.
  const pt = refsMentioned(law.pt, legalRefs), en = refsMentioned(law.en, legalRefs);
  const onlyPt = [...pt].filter((x) => !en.has(x)), onlyEn = [...en].filter((x) => !pt.has(x));
  if (onlyPt.length || onlyEn.length) errors.push({ rule: "law_pt_en_mismatch", path: at, detail: `referências só em pt: [${onlyPt}] · só em en: [${onlyEn}]` });
  // Menções jurídicas no texto que não correspondem a referência registrada.
  for (const [lang, text] of [["pt", law.pt], ["en", law.en]]) {
    for (const m of String(text ?? "").matchAll(NORM_PATTERN)) {
      if (!legalRefs.some((r) => r.labels.some((l) => norm(m[0]).includes(norm(l))))) errors.push({ rule: "law_ref_untraceable", path: `${at}.${lang}`, detail: `menção "${m[0]}" sem referência registrada` });
    }
    for (const acr of KNOWN_LEGAL_ACRONYMS) {
      if (hasTerm(text, acr) && !legalRefs.some((r) => r.labels.some((l) => hasTerm(l, acr)))) errors.push({ rule: "law_ref_untraceable", path: `${at}.${lang}`, detail: `menção a "${acr}" sem referência registrada` });
    }
  }
  return errors;
}

const TREND_WORDS = ["crescimento", "cresceu", "crescente*", "growth", "grew", "growing", "aumento*", "aumentou", "increase*", "expansao", "expansion", "declinio", "decline*", "tendencia*", "trend*", "acelera*", "desacelera*",
  // Evolução/trajetória e movimento (run odin-20261010-122912-5356: "evolução do TVL" passou).
  // "alta"/"queda" só em expressão de movimento: "alta capitalização" não é tendência.
  "evolu*", "evolv*", "trajetoria*", "trajector*", "variacao", "variacoes", "subiu", "caiu", "em alta", "em queda", "rising", "falling", "rose", "fell", "change over"];

const NEGATION = ["nao", "sem", "nenhum*", "nenhuma", "impossivel", "no", "not", "cannot", "without", "unable"];
const splitSentencesLocal = (text) => String(text ?? "").split(/(?<=[.;!?])\s+/).filter(Boolean);

/**
 * Fonte de um único instante não sustenta linguagem de tendência.
 * Excluídos: What to Watch (é o que observar) e `limitations` (declarar que
 * NÃO há tendência inferível é a afirmação epistêmica correta). Frases com
 * negação explícita ("não é possível inferir tendência") também passam.
 */
export function checkTemporalShape(entry, evidence) {
  if (evidence?.temporalShape !== "snapshot") return [];
  const errors = [];
  for (const { path: at, text } of sectionTexts(entry)) {
    if (at.startsWith("whatToWatch") || at === "limitations") continue;
    for (const sentence of splitSentencesLocal(text)) {
      const w = anyTerm(sentence, TREND_WORDS);
      if (!w || anyTerm(sentence, NEGATION)) continue;
      errors.push({ rule: "snapshot_trend", path: at, detail: `fonte é snapshot; "${w.replace("*", "")}" pressupõe série temporal — "${sentence.slice(0, 160)}"` });
    }
  }
  return errors;
}

const LEAKAGE = ["sem que esses valores sejam somados", "sem somar", "nao devem ser somados", "nao some", "nao totalize", "without summing", "not be summed", "do not sum", "conforme instruido", "de acordo com as instrucoes", "as instructed", "per the instructions"];

/** Instrução do prompt reproduzida no texto publicado. */
export function checkPromptLeakage(entry) {
  const errors = [];
  for (const { path: at, text } of sectionTexts(entry)) {
    const hit = LEAKAGE.find((p) => norm(text).includes(p));
    if (hit) errors.push({ rule: "prompt_leakage", path: at, detail: `instrução do prompt no texto: "${hit}"` });
  }
  return errors;
}

export function checkEditorialContract(entry, evidence) {
  return [
    ...checkWatch(entry, evidence),
    ...checkEconomicLaw(entry, evidence),
    ...checkTemporalShape(entry, evidence),
    ...checkPromptLeakage(entry),
  ];
}
