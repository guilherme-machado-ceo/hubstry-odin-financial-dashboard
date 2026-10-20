// ODIN — consistência claim ↔ evidência (determinística).
// MVP Readiness Gate: `evidenceRef` existente não prova que a evidência sustenta
// o claim. Este módulo verifica, sem LLM:
//   1. números e datas de claims `fact` presentes no material de fonte
//      (após normalização de formatos pt/en);
//   2. datas-chave com papel semântico (ex.: início do regime definitivo do
//      CBAM ≠ prazo da primeira declaração anual);
//   3. comparações recalculadas em código (acima/abaixo da referência).
//
// 4. contrato editorial (What to Watch, Economic Law, forma temporal, vazamento
//    de prompt) — ver editorial-contract.mjs.
//
// Limitações conhecidas (documentadas, não silenciadas):
//   - inteiros de 0 a 10 não são verificados (contagens textuais geram falso
//     bloqueio); números colados a letras (CO2, Q2) são ignorados;
//   - comparações SEM rótulos de período (referência fixa, como o clima, ou
//     artefatos antigos) são avaliadas por frase: se a frase contém as duas
//     direções ("acima … e abaixo …"), ela passa — sem atribuição por oração;
//   - comparações COM observedLabel/referenceLabel (ex.: CBAM, "Q3 2026" vs
//     "Q2 2026") têm atribuição determinística: o objeto da comparação é a
//     primeira âncora (valor ou rótulo do período) depois da palavra de direção;
//     o sujeito é o outro lado, e a direção esperada se inverte quando o sujeito
//     é a referência. Cada palavra de direção é avaliada separadamente. Sem
//     objeto identificável, a atribuição é ambígua e bloqueia (conservador).
//     A referência também é reconhecida por referenceAliases ("trimestre
//     anterior", "previous quarter"…). Vínculo período↔valor: um valor ao lado
//     de um rótulo do outro lado ("Q2 2026 … 82,32" com 82,32 de Q3) bloqueia
//     com "valor associado ao período errado", mesmo sem palavra de direção.
//     Limites: sem análise sintática (âncora mais próxima); rótulos fora do
//     padrão (ex.: "T2") só valem pelo valor; uma enumeração de rótulos antes
//     dos valores ("Entre Q2 2026 e Q3 2026, passou de 75,28 para 82,32") é
//     bloqueada pelo vínculo (falso positivo conservador).

import { checkEditorialContract } from "./editorial-contract.mjs";

const MONTHS = {
  janeiro: 1, fevereiro: 2, "março": 3, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7,
  august: 8, september: 9, october: 10, november: 11, december: 12,
};
const MONTH_RE = Object.keys(MONTHS).join("|");
const pad = (n) => String(n).padStart(2, "0");
const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;

const DATE_PATTERNS = [
  // 2026-01-01
  { re: /\b(\d{4})-(\d{2})-(\d{2})(?=[^0-9]|$)/g, to: (m) => iso(m[1], +m[2], +m[3]) },
  // 25 de setembro de 2025 / 1º de janeiro de 2026
  { re: new RegExp(`\\b(\\d{1,2})º?\\s+de\\s+(${MONTH_RE})\\s+de\\s+(\\d{4})\\b`, "gi"), to: (m) => iso(m[3], MONTHS[m[2].toLowerCase()], +m[1]) },
  // September 25, 2025
  { re: new RegExp(`\\b(${MONTH_RE})\\s+(\\d{1,2}),?\\s+(\\d{4})\\b`, "gi"), to: (m) => iso(m[3], MONTHS[m[1].toLowerCase()], +m[2]) },
  // 25 September 2025
  { re: new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_RE})\\s+(\\d{4})\\b`, "gi"), to: (m) => iso(m[3], MONTHS[m[2].toLowerCase()], +m[1]) },
  // 30/09/2027
  { re: /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g, to: (m) => iso(m[3], +m[2], +m[1]) },
];

/** Extrai datas (ISO) e devolve o texto sem elas, para não virarem números soltos. */
export function extractDates(text) {
  let rest = String(text ?? "");
  const dates = new Set();
  for (const { re, to } of DATE_PATTERNS) {
    rest = rest.replace(re, (...args) => {
      const m = args.slice(0, -2);
      const value = to(m);
      if (/^\d{4}-\d{2}-\d{2}$/.test(value) && !value.includes("undefined")) dates.add(value);
      return " ";
    });
  }
  return { dates, rest };
}

const NUM_RE = /(?<![\p{L}\d])\d{1,3}(?:[.,]\d{3})+(?:[.,]\d+)?(?![\p{L}\d])|(?<![\p{L}\d])\d+(?:[.,]\d+)?(?!\p{L}|\d)/gu;

/** Interpretações possíveis de um token numérico (pt: 1.321,5 · en: 1,321.5). */
export function numberCandidates(token) {
  const t = token;
  const dots = (t.match(/\./g) || []).length;
  const commas = (t.match(/,/g) || []).length;
  const asNum = (s) => Number(s);
  const out = new Set();
  if (dots && commas) {
    const lastSep = t.lastIndexOf(".") > t.lastIndexOf(",") ? "." : ",";
    const group = lastSep === "." ? "," : ".";
    out.add(asNum(t.split(group).join("").replace(lastSep, ".")));
  } else if (dots + commas === 0) {
    out.add(asNum(t));
  } else {
    const sep = dots ? "." : ",";
    const parts = t.split(sep);
    if (parts.length > 2) {
      out.add(asNum(parts.join("")));
    } else {
      out.add(asNum(parts.join("."))); // separador decimal
      if (parts[1].length === 3 && parts[0].length <= 3) out.add(asNum(parts.join(""))); // separador de milhar
    }
  }
  return [...out].filter(Number.isFinite);
}

/** Conjunto de números (canônicos) presentes no texto, excluindo datas. */
export function extractNumbers(text) {
  const { rest } = extractDates(text);
  const tokens = rest.match(NUM_RE) ?? [];
  return tokens.map((token) => ({ token, candidates: numberCandidates(token) }));
}

function materialNumbers(material) {
  const set = new Set();
  for (const { candidates } of extractNumbers(material)) for (const n of candidates) set.add(n);
  return set;
}

const splitSentences = (text) => String(text ?? "")
  .split(/(?<=[.;!?])\s+/)
  .map((s) => s.trim())
  .filter(Boolean);

const includesAny = (text, terms) => {
  const low = text.toLowerCase();
  return terms.some((term) => low.includes(term.toLowerCase()));
};

const ABOVE = ["acima", "excede", "excedem", "exceder", "superior", "superou", "superaram", "above", "exceed", "exceeds", "exceeded", "higher than"];
const BELOW = ["abaixo", "inferior", "aquém", "below", "under the", "lower than", "short of"];

/** Todos os textos analíticos de uma seção, com o caminho de origem. */
export function sectionTexts(entry) {
  const out = [];
  const push = (path, text) => { if (typeof text === "string" && text.trim()) out.push({ path, text }); };
  push("pt", entry.pt); push("en", entry.en);
  push("thesis.pt", entry.thesis?.pt); push("thesis.en", entry.thesis?.en);
  push("economicLaw.pt", entry.economicLaw?.pt); push("economicLaw.en", entry.economicLaw?.en);
  push("limitations", entry.limitations);
  for (const c of entry.claims ?? []) { push(`claims[${c.id}].pt`, c.textPt); push(`claims[${c.id}].en`, c.textEn); }
  for (const [i, s] of (entry.stakeholderImplications ?? []).entries()) { push(`stakeholderImplications[${i}].pt`, s.textPt); push(`stakeholderImplications[${i}].en`, s.textEn); }
  for (const [i, w] of (entry.whatToWatch ?? []).entries()) {
    const date = w.expectedDate ? ` (${w.expectedDate})` : "";
    push(`whatToWatch[${i}]`, `${w.signal ?? w.signalPt ?? ""}${date}.`);
    push(`whatToWatch[${i}].whyItMatters`, w.whyItMatters ?? w.whyItMattersPt);
    if (w.signalEn) push(`whatToWatch[${i}].en`, `${w.signalEn}${date}.`);
    if (w.whyItMattersEn) push(`whatToWatch[${i}].whyItMatters.en`, w.whyItMattersEn);
  }
  for (const [i, imp] of (entry.decisionLens?.implications ?? []).entries()) {
    push(`decisionLens.implications[${i}].pt`, imp.textPt);
    push(`decisionLens.implications[${i}].en`, imp.textEn);
  }
  return out;
}

/** 1. Números e datas de claims `fact` devem existir no material de fonte. */
export function checkFactClaims(entry, material) {
  const errors = [];
  const nums = materialNumbers(material);
  const { dates: srcDates } = extractDates(material);
  for (const claim of entry.claims ?? []) {
    if (claim.kind !== "fact") continue;
    for (const [lang, text] of [["pt", claim.textPt], ["en", claim.textEn]]) {
      const { dates } = extractDates(text);
      for (const d of dates) if (!srcDates.has(d)) errors.push({ rule: "fact_date_not_in_source", path: `claims[${claim.id}].${lang}`, detail: d });
      for (const { token, candidates } of extractNumbers(text)) {
        if (candidates.every((n) => Number.isInteger(n) && n >= 0 && n <= 10)) continue;
        if (!candidates.some((n) => nums.has(n))) errors.push({ rule: "fact_number_not_in_source", path: `claims[${claim.id}].${lang}`, detail: token });
      }
    }
  }
  return errors;
}

/** 2. Data associada a um evento-chave deve ser a data registrada desse evento. */
export function checkKeyDates(entry, keyDates = []) {
  const errors = [];
  for (const { path, text } of sectionTexts(entry)) {
    for (const sentence of splitSentences(text)) {
      const { dates } = extractDates(sentence);
      if (dates.size === 0) continue;
      for (const ev of keyDates) {
        if (!includesAny(sentence, ev.subjectTerms) || !includesAny(sentence, ev.eventTerms)) continue;
        if (!dates.has(ev.date)) {
          errors.push({ rule: "key_date_mismatch", path, detail: `${ev.id}: esperado ${ev.date}, encontrado ${[...dates].join(", ")} — "${sentence}"` });
        }
      }
    }
  }
  return errors;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const DIRECTION_RE = new RegExp([...ABOVE.map((t) => ["above", t]), ...BELOW.map((t) => ["below", t])]
  .sort((a, b) => b[1].length - a[1].length).map(([, t]) => escapeRe(t)).join("|"), "gi");
const kindOf = (term) => (ABOVE.some((t) => t.toLowerCase() === term.toLowerCase()) ? "above" : "below");

/** Regex de um rótulo de período ("Q2 2026" casa "Q2 2026", "Q2 de 2026" e "2026-Q2"). */
function labelRegex(label) {
  const m = /^(Q[1-4])\s+(\d{4})$/i.exec(String(label).trim());
  if (m) return new RegExp(`(?<![\\p{L}\\d])(?:${m[1]}(?:\\s+de)?\\s+${m[2]}|${m[2]}-${m[1]})(?![\\p{L}\\d])`, "giu");
  return new RegExp(escapeRe(String(label).trim()), "gi");
}

/**
 * Âncoras de cada lado da comparação na frase, ordenadas por posição:
 * kind "value" (número) ou "label" (rótulo do período ou alias da referência,
 * ex.: "trimestre anterior", sem diferenciar maiúsculas de minúsculas).
 */
function comparisonAnchors(sentence, cmp) {
  const anchors = [];
  for (const m of sentence.matchAll(new RegExp(NUM_RE.source, "gu"))) {
    const cands = numberCandidates(m[0]);
    if (cands.includes(cmp.observed)) anchors.push({ side: "observed", kind: "value", pos: m.index });
    if (cands.includes(cmp.reference)) anchors.push({ side: "reference", kind: "value", pos: m.index });
  }
  for (const [side, label] of [["observed", cmp.observedLabel], ["reference", cmp.referenceLabel]]) {
    for (const m of sentence.matchAll(labelRegex(label))) anchors.push({ side, kind: "label", pos: m.index });
  }
  for (const alias of cmp.referenceAliases ?? []) {
    if (typeof alias !== "string" || !alias.trim()) continue;
    for (const m of sentence.matchAll(new RegExp(`(?<![\\p{L}\\d])${escapeRe(alias.trim())}(?![\\p{L}\\d])`, "giu"))) anchors.push({ side: "reference", kind: "label", pos: m.index });
  }
  return anchors.sort((a, b) => a.pos - b.pos);
}

const hasPeriodLabels = (cmp) => typeof cmp.observedLabel === "string" && cmp.observedLabel.trim() !== ""
  && typeof cmp.referenceLabel === "string" && cmp.referenceLabel.trim() !== "";

/** Atribuição determinística para comparações com rótulos de período. */
function checkLabeledComparison(cmp, sentence, path) {
  const anchors = comparisonAnchors(sentence, cmp);
  if (!anchors.length) return [];
  const head = `${cmp.id}: ${cmp.observedLabel} ${cmp.observed} ${cmp.unit} está ${cmp.direction === "above" ? "ACIMA" : "ABAIXO"} de ${cmp.referenceLabel} ${cmp.reference} ${cmp.unit}`;
  const fail = (why) => [{ rule: "comparison_direction", path, detail: `${head} — ${why} — "${sentence}"` }];
  // Vínculo período ↔ valor (vale para qualquer frase, com ou sem palavra de direção):
  // um valor cujo vizinho imediato na lista de âncoras (anterior ou seguinte) é um rótulo
  // precisa ter pelo menos um desses rótulos do seu próprio lado. Valores sem rótulo vizinho
  // não são restringidos.
  for (const [i, a] of anchors.entries()) {
    if (a.kind !== "value") continue;
    const near = [anchors[i - 1], anchors[i + 1]].filter((n) => n?.kind === "label");
    if (near.length && !near.some((n) => n.side === a.side)) return fail("valor associado ao período errado");
  }
  const occurrences = [...sentence.matchAll(DIRECTION_RE)].map((m) => ({ kind: kindOf(m[0]), term: m[0], start: m.index, end: m.index + m[0].length }));
  if (!occurrences.length || cmp.direction === "equal") return [];
  const refValue = anchors.some((a) => a.side === "reference" && a.kind === "value");
  const refLabel = anchors.some((a) => a.side === "reference" && a.kind === "label");
  if (!(refValue || (refLabel && anchors.some((a) => a.side === "observed")))) return [];
  const inverse = { above: "below", below: "above" };
  for (const o of occurrences) {
    const before = anchors.filter((a) => a.pos < o.start);
    const after = anchors.filter((a) => a.pos >= o.end);
    // Sujeito provável: o último rótulo antes da palavra. Um valor depois dela que só repete o
    // lado do sujeito ("o Q3 2026 ficou acima, em 82,32") não é o objeto da comparação.
    const subject = [...before].reverse().find((a) => a.kind === "label")?.side ?? null;
    let object = after.find((a) => !(a.kind === "value" && a.side === subject))?.side ?? null;
    if (object === null && subject !== null) {
      const other = subject === "observed" ? "reference" : "observed";
      if (before.some((a) => a.side === other)) object = other; // "Em comparação com o Q2 2026 (75,28), o Q3 2026 ficou acima"
    }
    if (object === null) return fail("atribuição ambígua");
    // objeto = referência → sujeito = observado (direção como calculada); objeto = observado → sujeito = referência (inverte).
    const expected = object === "reference" ? cmp.direction : inverse[cmp.direction];
    if (o.kind !== expected) return fail(`"${o.term}" contradiz a direção esperada (${expected})`);
  }
  return [];
}

/** 3. Comparações com valor de referência devem seguir a direção recalculada. */
export function checkComparisons(entry, comparisons = []) {
  const errors = [];
  for (const { path, text } of sectionTexts(entry)) {
    for (const sentence of splitSentences(text)) {
      const nums = new Set(extractNumbers(sentence).flatMap((x) => x.candidates));
      const hasAbove = includesAny(sentence, ABOVE);
      const hasBelow = includesAny(sentence, BELOW);
      for (const cmp of comparisons) {
        // Com rótulos de período, o vínculo período↔valor vale mesmo sem palavra de direção.
        if (hasPeriodLabels(cmp)) { errors.push(...checkLabeledComparison(cmp, sentence, path)); continue; }
        if (!hasAbove && !hasBelow) continue;
        if (!nums.has(cmp.reference)) continue;
        const ok = cmp.direction === "above" ? hasAbove : cmp.direction === "below" ? hasBelow : true;
        if (!ok) errors.push({ rule: "comparison_direction", path, detail: `${cmp.id}: ${cmp.observed} ${cmp.unit} está ${cmp.direction === "above" ? "ACIMA" : "ABAIXO"} de ${cmp.reference} ${cmp.unit} — "${sentence}"` });
      }
    }
  }
  return errors;
}

/** Direção de uma comparação, calculada em código. */
export function compareDirection(observed, reference) {
  if (observed > reference) return "above";
  if (observed < reference) return "below";
  return "equal";
}

/** Executa as três verificações. `evidence` = { material, keyDates, comparisons }. */
export function checkEvidenceConsistency(entry, evidence) {
  if (!evidence || typeof evidence.material !== "string" || !evidence.material.trim()) {
    return [{ rule: "evidence_material_missing", path: entry?.sectionId ?? "?", detail: "material de fonte ausente" }];
  }
  return [
    ...checkFactClaims(entry, evidence.material),
    ...checkKeyDates(entry, evidence.keyDates ?? []),
    ...checkComparisons(entry, evidence.comparisons ?? []),
    ...checkEditorialContract(entry, evidence),
  ];
}

export const formatConsistencyError = (e) => `[${e.rule}] ${e.path}: ${e.detail}`;
