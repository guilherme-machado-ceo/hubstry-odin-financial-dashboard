// ============================================================
// ODIN — Fontes e sinais por seção (M2; antes "Camadas estruturais") · sem IA
// Bloco recolhível (fechado por padrão) com fontes, data de referência e
// frescor, indicadores, eventos, What to Watch e status da lente de Direito
// Econômico. Conteúdo vem de src/data/sectionLayers.ts, que extrai os valores
// dos mesmos módulos de dados exibidos pela seção.
// ============================================================
import { useEffect, useState } from "react";
import { Layers, ChevronDown, Database, BarChart3, CalendarClock, Radar, Scale, ExternalLink } from "lucide-react";
import { getLocale, subscribe } from "@/i18n";
import { getSectionLayers, type LayerSource } from "@/data/sectionLayers";
import type { Region } from "@/data/regions";
import { term, termDef, type TermKey } from "@/data/glossary";

const L = (locale: string, pt: string, en: string) => (locale === "pt" ? pt : en);

function formatAsOf(asOf: string, locale: string): string {
  if (asOf === "live") return term("live", locale);
  const d = new Date(`${asOf.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return asOf;
  return d.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { month: "short", year: "numeric" });
}

/**
 * Apresentação da data (decisão de UX, 01/10/2026): a interface mostra o FATO —
 * a data de referência de cada fonte — e só sinaliza "ao vivo". Não exibe
 * julgamento editorial ("desatualizado"); o frescor continua calculado no
 * modelo (`sourceFreshness`) para governança e CI.
 */
function LiveBadge({ source, locale }: { source: LayerSource; locale: string }) {
  if (source.asOf !== "live") return null;
  return <span className="text-[8px] font-mono uppercase tracking-wider border px-1.5 py-[1px] text-[#00CC88] border-[#00CC88]/30" data-term="live">{term("live", locale)}</span>;
}

/** "2024–2026" a partir das datas das fontes curadas (fontes ao vivo não entram). */
function referenceRange(sources: LayerSource[]): string | null {
  const years = sources.filter((s) => s.asOf !== "live").map((s) => Number(s.asOf.slice(0, 4))).filter(Number.isFinite);
  if (!years.length) return null;
  const min = Math.min(...years), max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

function Heading({ icon: Icon, k, locale }: { icon: typeof Layers; k: TermKey; locale: string }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={11} className="text-[#00FFFF]" />
      <span className="text-[9px] font-mono uppercase tracking-widest text-[#777]" data-term={k}>{term(k, locale)}</span>
    </div>
  );
}

export default function SectionLayers({ id, region = "all" }: { id: string; region?: Region }) {
  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((v) => v + 1));
    return () => { unsub(); };
  }, []);
  const spec = getSectionLayers(id, region);
  if (!spec) return null;
  const locale = getLocale();
  const range = referenceRange(spec.sources);
  const hasLive = spec.sources.some((s) => s.asOf === "live");
  const scoped = spec.scope !== "global";
  const sourceName = (sid: string) => spec.sources.find((s) => s.id === sid)?.name ?? sid;

  return (
    <div id={`layers-${spec.id}`} className="bg-[#050505] border-b border-[#1a1a1a] scroll-mt-20">
      <div className="max-w-[1440px] mx-auto px-4 pb-6">
        <details className="group border border-[#00FFFF]/15 bg-[#00FFFF]/[0.03]" data-section-layers={spec.id}>
          <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#00FFFF]/5 transition-colors">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <Layers size={12} className="text-[#00FFFF] shrink-0" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#00FFFF]" data-term="sourcesAndSignals">
                {term("sourcesAndSignals", locale)}
              </span>
              <span className="text-[8px] font-mono text-[#444]">
                · <span data-term="noAI">{term("noAI", locale)}</span>
              </span>
              {range && (
                <span className="text-[8px] font-mono text-[#666]">
                  · <span data-term="referenceDate">{term("referenceDate", locale)}</span>: {range}{hasLive ? <> + <span data-term="live">{term("live", locale)}</span></> : ""}
                </span>
              )}
              {scoped && (
                <span className="text-[8px] font-mono uppercase tracking-wider border px-1.5 py-[1px] text-[#00FFFF] border-[#00FFFF]/30" data-layers-scope={spec.scope}>
                  <span data-term="region">{term("region", locale)}</span>: {spec.scope}
                </span>
              )}
            </div>
            <ChevronDown size={13} className="text-[#555] shrink-0 transition-transform group-open:rotate-180" />
          </summary>

          <div className="border-t border-[#00FFFF]/10 px-4 pb-4 grid gap-5 md:grid-cols-2">
            <div className="pt-4">
              <Heading icon={Database} k="sourcesAndReferenceDate" locale={locale} />
              <ul className="space-y-1.5">
                {spec.sources.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 flex-wrap text-[10px] font-mono text-[#999]">
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-[#00FFFF] inline-flex items-center gap-1">
                      {s.name} <ExternalLink size={9} />
                    </a>
                    <span className="text-[#555]">· {formatAsOf(s.asOf, locale)}</span>
                    <LiveBadge source={s} locale={locale} />
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4">
              <Heading icon={BarChart3} k="keyIndicators" locale={locale} />
              <ul className="space-y-1.5">
                {spec.indicators.map((ind, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-[10px] font-mono">
                    <span className="text-[#888]">
                      {L(locale, ind.labelPt, ind.labelEn)}
                      {ind.estimated && <span className="ml-1 text-[#FF8C00]">({L(locale, "est.", "est.")})</span>}
                      {ind.unverified && <span className="ml-1 text-[#777]" data-unverified title={termDef("unverified", locale)}>(<span data-term="unverified">{term("unverified", locale)}</span>)</span>}
                    </span>
                    <span className="text-[#ddd] font-bold whitespace-nowrap" title={sourceName(ind.sourceId)}>
                      {L(locale, ind.valuePt, ind.valueEn)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Heading icon={CalendarClock} k="eventsAndMilestones" locale={locale} />
              {spec.events.length ? (
                <ul className="space-y-1.5">
                  {spec.events.map((e, i) => (
                    <li key={i} className="text-[10px] font-mono text-[#999] leading-relaxed">
                      <span className="text-[#00FFFF]">{e.date}</span> · {L(locale, e.labelPt, e.labelEn)}
                      {e.estimated && <span className="ml-1 text-[#FF8C00]">({L(locale, "est.", "est.")})</span>}
                      <span className="text-[#555]"> — {e.sourceLabel}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10px] font-mono text-[#555]">{L(locale, "Sem eventos registrados para esta seção.", "No events recorded for this section.")}</p>
              )}
            </div>

            <div>
              <Heading icon={Radar} k="whatToWatch" locale={locale} />
              <p className="text-[10px] font-mono font-bold text-[#bbb]">{L(locale, spec.watch.signalPt, spec.watch.signalEn)}</p>
              <p className="text-[9px] font-mono text-[#888] leading-relaxed mt-1">{L(locale, spec.watch.whyPt, spec.watch.whyEn)}</p>
              <p className="text-[8px] font-mono text-[#555] mt-1"><span data-term="source">{term("source", locale)}</span>: {sourceName(spec.watch.sourceId)}</p>
            </div>

            <div className="md:col-span-2">
              <Heading icon={Scale} k="economicLawLens" locale={locale} />
              <p className="text-[10px] font-mono text-[#888]">{L(locale, spec.legal.notePt, spec.legal.noteEn)}</p>
            </div>

            <p className="md:col-span-2 text-[8px] font-mono text-[#444] leading-relaxed">
              {L(
                locale,
                `Valores extraídos dos mesmos dados exibidos nesta seção, sem geração por IA. Cada fonte mostra sua data de referência.${scoped ? ` Indicadores recalculados para a região selecionada (${spec.scope}).` : ""}`,
                `Values extracted from the same data shown in this section, with no AI generation. Each source shows its reference date.${scoped ? ` Indicators recalculated for the selected region (${spec.scope}).` : ""}`,
              )}
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
