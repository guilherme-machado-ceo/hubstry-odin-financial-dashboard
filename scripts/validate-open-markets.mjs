// ============================================================
// ODIN — Gate do snapshot Open Markets (dados abertos)
// Valida o JSON gerado por scripts/fetch-open-markets.mjs ANTES de qualquer
// gravação na main. Só usa a biblioteca padrão do Node.
//
// Uso:
//   node scripts/validate-open-markets.mjs <novo.json> [--previous <atual.json>]
//
// Confere:
//  1. Estrutura: versões, data de coleta, catálogo de séries e os três blocos
//     (diferencial de juros, volatilidade cambial, petróleo) com procedência
//     (verification/derivation), unidade e método em PT e EN.
//  2. Números: todo valor numérico é finito e com o tipo esperado.
//  3. Coerência: cada série citada nos blocos existe no catálogo; pb e
//     tendência batem com a regra do método.
//     Cobertura mínima: catálogo não vazio e ao menos um país, uma moeda e um
//     petróleo com dados (vale para a coleta nova e para o snapshot anterior).
//  4. Não regressão (com --previous): a coleta nova não pode cobrir MENOS
//     países, moedas ou petróleos do que o snapshot atual. Se cobrir, o gate
//     bloqueia e o snapshot anterior é preservado (decisão de 18/10/2026,
//     opção A: mesmo padrão do AIFS e do ENSO).
//     Com --previous, o arquivo anterior é OBRIGATÓRIO e precisa ser ele
//     mesmo um snapshot válido (itens 1 a 3): ausente, ilegível ou inválido
//     (ex.: {} ou null) também bloqueia. Sem --previous, só os itens 1 a 3.
//
// Saída: 0 = aprovado; 1 = bloqueado (nada deve ser gravado).
// ============================================================
import { readFileSync, existsSync } from "node:fs";

const VERIFICATION = new Set(["verified", "unverified"]);
const DERIVATION = new Set(["direct", "transformed", "derived", "estimated"]);
const TRENDS = new Set(["stable", "widening", "narrowing"]);
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH = /^\d{4}-\d{2}$/;

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isInt = (v) => Number.isInteger(v);
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

/** Valida a estrutura e a coerência de um snapshot. Retorna lista de erros. */
export function validateSnapshot(d, { now = new Date() } = {}) {
  const errs = [];
  const e = (m) => errs.push(m);
  if (!isObj(d)) return ["snapshot não é um objeto JSON"];

  if (d.schemaVersion !== "1.0") e(`schemaVersion inesperada: ${JSON.stringify(d.schemaVersion)}`);
  if (!isStr(d.methodVersion)) e("methodVersion ausente");
  const t = Date.parse(d.retrievedAt);
  if (!isStr(d.retrievedAt) || Number.isNaN(t)) e("retrievedAt ausente ou inválida");
  else if (t > now.getTime() + 5 * 60 * 1000) e(`retrievedAt no futuro: ${d.retrievedAt}`);

  const series = isObj(d.series) ? d.series : (e("catálogo 'series' ausente"), {});
  for (const [id, s] of Object.entries(series)) {
    if (!isObj(s)) { e(`series.${id} não é objeto`); continue; }
    if (!isStr(s.sourceId)) e(`series.${id}.sourceId ausente`);
    if (!isStr(s.title)) e(`series.${id}.title ausente`);
    if (!isStr(s.url) || !s.url.startsWith("https://")) e(`series.${id}.url ausente ou não https`);
    if (!DATE.test(s.firstDate ?? "") || !DATE.test(s.lastDate ?? "")) e(`series.${id}: datas inválidas`);
    if (!isInt(s.n) || s.n <= 0) e(`series.${id}.n inválido`);
  }
  const known = (id) => Object.prototype.hasOwnProperty.call(series, id);

  const block = (name, unit) => {
    const b = d[name];
    if (!isObj(b)) { e(`bloco '${name}' ausente`); return null; }
    if (!VERIFICATION.has(b.verification)) e(`${name}.verification inválida: ${JSON.stringify(b.verification)}`);
    if (!DERIVATION.has(b.derivation)) e(`${name}.derivation inválida: ${JSON.stringify(b.derivation)}`);
    if (b.unit !== unit) e(`${name}.unit deveria ser '${unit}'`);
    if (!isStr(b.methodPt) || !isStr(b.methodEn)) e(`${name}: método PT/EN ausente`);
    return b;
  };
  const gaps = (name, b) => {
    if (!Array.isArray(b.gaps)) { e(`${name}.gaps ausente`); return; }
    b.gaps.forEach((g, i) => { if (!isStr(g?.reasonPt) || !isStr(g?.reasonEn)) e(`${name}.gaps[${i}]: motivo PT/EN ausente`); });
  };
  const annualNums = (where, a, { int = false, positive = false } = {}) => {
    if (!isObj(a)) { e(`${where}.annual ausente`); return; }
    for (const [y, v] of Object.entries(a)) {
      if (!/^\d{4}$/.test(y)) e(`${where}.annual: ano inválido '${y}'`);
      if (!isNum(v) || (int && !isInt(v)) || (positive && v <= 0)) e(`${where}.annual[${y}] inválido: ${JSON.stringify(v)}`);
    }
  };

  // 1. Diferencial de juros
  const yd = block("yieldDifferential", "bps");
  if (yd) {
    if (!Array.isArray(yd.countries)) e("yieldDifferential.countries ausente");
    else {
      if (yd.countries.length && !known(yd.benchmark)) e(`yieldDifferential.benchmark '${yd.benchmark}' fora do catálogo`);
      yd.countries.forEach((c, i) => {
        const w = `yieldDifferential.countries[${i}] (${c?.flag ?? "?"})`;
        if (!isStr(c?.flag) || !isStr(c?.country) || !isStr(c?.countryPt)) e(`${w}: identificação ausente`);
        if (!known(c?.seriesId)) e(`${w}: série '${c?.seriesId}' fora do catálogo`);
        const l = c?.latest;
        if (!isObj(l) || !MONTH.test(l.month ?? "") || !isNum(l.localPct) || !isNum(l.usPct) || !isInt(l.bps)) e(`${w}: latest inválido`);
        else if (Math.abs(l.bps - (l.localPct - l.usPct) * 100) > 1.5) e(`${w}: bps ${l.bps} não bate com ${l.localPct} − ${l.usPct}`);
        const dlt = c?.delta12mBps;
        if (dlt !== null && !isInt(dlt)) e(`${w}: delta12mBps inválido`);
        if (dlt === null ? c?.trend !== null : !TRENDS.has(c?.trend)) e(`${w}: trend inválida`);
        else if (dlt !== null) {
          const exp = Math.abs(dlt) < 25 ? "stable" : dlt > 0 ? "widening" : "narrowing";
          if (c.trend !== exp) e(`${w}: trend '${c.trend}' contradiz Δ12m ${dlt} (esperado '${exp}')`);
        }
        annualNums(w, c?.annual, { int: true });
      });
    }
    gaps("yieldDifferential", yd);
  }

  // 2. Volatilidade cambial
  const fx = block("fxVolatility", "pct");
  if (fx) {
    if (!Array.isArray(fx.currencies)) e("fxVolatility.currencies ausente");
    else fx.currencies.forEach((c, i) => {
      const w = `fxVolatility.currencies[${i}] (${c?.code ?? "?"})`;
      if (!isStr(c?.code) || !isStr(c?.country) || !isStr(c?.countryPt)) e(`${w}: identificação ausente`);
      if (!known(c?.seriesId)) e(`${w}: série '${c?.seriesId}' fora do catálogo`);
      else if (c.sourceId !== series[c.seriesId].sourceId) e(`${w}: sourceId diverge do catálogo`);
      annualNums(w, c?.annual, { positive: true });
      const y = c?.ytd;
      if (y !== null && (!isObj(y) || !DATE.test(y.from ?? "") || !DATE.test(y.to ?? "") || !isInt(y.n) || y.n < 60 || !isNum(y.vol) || y.vol <= 0)) e(`${w}: ytd inválido`);
      if (!DATE.test(c?.lastDate ?? "")) e(`${w}: lastDate inválida`);
    });
    gaps("fxVolatility", fx);
  }

  // 3. Petróleo
  const oil = block("oil", "usd_bbl");
  if (oil) {
    for (const k of ["brent", "wti"]) {
      if (!(k in oil)) { e(`oil.${k} ausente`); continue; }
      const o = oil[k];
      if (o === null) continue; // falha de coleta registrada; tratada pela não regressão
      if (!known(o?.seriesId)) e(`oil.${k}: série '${o?.seriesId}' fora do catálogo`);
      annualNums(`oil.${k}`, o?.annual, { positive: true });
      if (!isObj(o?.latest) || !DATE.test(o.latest.date ?? "") || !isNum(o.latest.value) || o.latest.value <= 0) e(`oil.${k}.latest inválido`);
    }
  }

  if (!Array.isArray(d.errors)) e("lista 'errors' ausente");

  // Cobertura mínima: estrutura completa sem dados não é snapshot válido
  // (como referência, liberaria qualquer coleta; como coleta, apagaria o painel).
  if (!Object.keys(series).length) e("cobertura mínima: catálogo 'series' vazio");
  for (const [k, s] of Object.entries(coverage(d))) {
    if (!s.size) e(`cobertura mínima: nenhum item em ${k}`);
  }
  return errs;
}

/** O que o snapshot cobre: países, moedas e petróleos com dados. */
export function coverage(d) {
  return {
    "países (diferencial de juros)": new Set((d?.yieldDifferential?.countries ?? []).map((c) => c.flag)),
    "moedas (volatilidade)": new Set((d?.fxVolatility?.currencies ?? []).map((c) => c.code)),
    "petróleo": new Set(["brent", "wti"].filter((k) => d?.oil?.[k])),
  };
}

/** Itens cobertos pelo snapshot anterior e perdidos no novo. */
export function regressions(next, prev) {
  const out = [];
  const a = coverage(prev), b = coverage(next);
  for (const k of Object.keys(a)) {
    const lost = [...a[k]].filter((x) => !b[k].has(x));
    if (lost.length) out.push(`${k}: perdeu ${lost.join(", ")}`);
  }
  return out;
}

function main(argv) {
  const gh = (lvl, m) => console.log(process.env.GITHUB_ACTIONS ? `::${lvl}::${m}` : `[${lvl}] ${m}`);
  const file = argv[0];
  const pi = argv.indexOf("--previous");
  const prevFile = pi >= 0 ? argv[pi + 1] : null;
  if (!file) { gh("error", "uso: validate-open-markets.mjs <novo.json> [--previous <atual.json>]"); return 1; }

  let next;
  try { next = JSON.parse(readFileSync(file, "utf8")); }
  catch (err) { gh("error", `GATE BLOQUEOU — ${file} ilegível ou JSON inválido (${err.message})`); return 1; }

  const errs = validateSnapshot(next);
  if (pi >= 0) {
    // Com --previous, a referência é obrigatória: sem ela a não regressão
    // não pode ser verificada, e o gate BLOQUEIA (não há modo silencioso).
    if (!prevFile || !existsSync(prevFile)) {
      errs.push(`snapshot anterior ${prevFile ?? "(não informado)"} não encontrado; não regressão não verificável`);
    } else {
      let prev = null;
      let prevOk = false;
      try { prev = JSON.parse(readFileSync(prevFile, "utf8")); prevOk = true; }
      catch (err) { errs.push(`snapshot anterior ${prevFile} ilegível (${err.message}); não regressão não verificável`); }
      // JSON válido não basta ({} ou null dariam cobertura vazia e liberariam
      // qualquer coleta): o anterior precisa ser um snapshot estruturalmente válido.
      if (prevOk) {
        const prevErrs = validateSnapshot(prev);
        if (prevErrs.length) {
          errs.push(`snapshot anterior ${prevFile} inválido (${prevErrs.length} problema(s), ex.: ${prevErrs[0]}); não regressão não verificável`);
        } else {
          errs.push(...regressions(next, prev).map((m) => `coleta parcial — ${m} em relação ao snapshot atual`));
        }
      }
    }
  }

  if (errs.length) {
    gh("error", `GATE BLOQUEOU — ${errs.length} problema(s); nada deve ser gravado`);
    for (const m of errs.slice(0, 40)) gh("error", m);
    return 1;
  }
  const c = coverage(next);
  gh("notice", `gate PASS — ${c["países (diferencial de juros)"].size} diferenciais, ${c["moedas (volatilidade)"].size} moedas, petróleo ${[...c["petróleo"]].join("/") || "—"}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exit(main(process.argv.slice(2)));
