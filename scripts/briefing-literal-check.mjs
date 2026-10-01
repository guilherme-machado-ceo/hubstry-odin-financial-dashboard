// ODIN — verificação da regra do Briefing (seleção + condensação, sem inferência
// nova), compartilhada por test-briefing.mjs (M1 v1.0 publicado) e
// test-pipeline-v11.mjs (geração v1.1 simulada). Cada linha do Briefing tem de
// ser trecho literal de um campo da PRÓPRIA seção; nada vem de outra seção.
// Também confere a camada automática do teste dos 3 minutos: as 4 respostas
// (o que mudou, por que importa, o que acompanhar, de onde veio).

const stripLabel = (t) => { const r = String(t ?? "").replace(/^(Interpretação|Interpretation)\s*:\s*/, ""); return r === t ? r : r.charAt(0).toUpperCase() + r.slice(1); };

export function fieldsOf(e) {
  return {
    claimsPt: (e.claims ?? []).filter((c) => c.kind === "fact").map((c) => c.textPt ?? c.pt),
    claimsEn: (e.claims ?? []).filter((c) => c.kind === "fact").map((c) => c.textEn ?? c.en),
    thesisPt: stripLabel(e.thesis?.pt ?? ""), thesisEn: stripLabel(e.thesis?.en ?? ""),
    lens: (e.decisionLens?.implications ?? []).flatMap((i) => [i.textPt, i.textEn]),
    watch: (e.whatToWatch ?? []).flatMap((w) => [w.signal, w.whyItMatters, w.signalPt, w.signalEn, w.whyItMattersPt, w.whyItMattersEn].filter(Boolean)),
    sourceUrls: (e.provenance ?? []).map((p) => p.sourceUrl),
  };
}

/** Devolve a lista de violações (strings). */
export function checkBriefingItems(items, sections) {
  const errs = [];
  const fail = (c, m) => { if (!c) errs.push(m); };
  for (const it of items) {
    const e = sections[it.sectionId];
    const own = fieldsOf(e);
    const at = `[briefing:${it.sectionId}]`;
    fail(own.claimsPt.includes(it.happenedPt), `${at} "O que aconteceu" (PT) não é um claim de fato literal da seção`);
    fail(own.claimsEn.includes(it.happenedEn), `${at} "O que aconteceu" (EN) não é um claim de fato literal da seção`);
    if (it.whyFrom === "lens") {
      const first = e.decisionLens?.implications?.[0];
      fail(first && it.whyPt === first.textPt && it.whyEn === first.textEn, `${at} "Por que importa" deveria ser a 1ª implicação literal da lente`);
    } else {
      fail(it.whyPt === own.thesisPt && it.whyEn === own.thesisEn, `${at} "Por que importa" não é a tese literal (só sem rótulo e com maiúscula inicial)`);
    }
    for (const k of ["watchSignalPt", "watchSignalEn", "watchWhyPt", "watchWhyEn"]) fail(own.watch.includes(it[k]), `${at} ${k} não vem do What to Watch da seção`);
    if (e.intelligenceContractVersion === "1.1") fail(it.watchSignalEn !== it.watchSignalPt, `${at} v1.1 deve exibir What to Watch em inglês gerado pela IA`);
    fail(it.anchor === `#${it.sectionId}`, `${at} âncora errada`);
    fail(it.sourceUrl && own.sourceUrls.includes(it.sourceUrl), `${at} "De onde veio" sem fonte da própria provenance`);
    // 3 minutos (CI): as 4 respostas presentes.
    for (const k of ["happenedPt", "whyPt", "watchSignalPt", "sourceUrl"]) fail(typeof it[k] === "string" && it[k].trim(), `${at} resposta ausente: ${k}`);
    for (const other of items.filter((o) => o.sectionId !== it.sectionId)) {
      const o = fieldsOf(sections[other.sectionId]);
      const pool = [...o.claimsPt, ...o.claimsEn, o.thesisPt, o.thesisEn, ...o.lens, ...o.watch].join("\n");
      for (const line of [it.happenedPt, it.whyPt, it.watchSignalPt]) fail(!pool.includes(line), `${at} linha aparece em ${other.sectionId}: "${line.slice(0, 60)}"`);
    }
  }
  return errs;
}
