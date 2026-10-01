// ============================================================
// ODIN — Camadas estruturais por seção (M2) · sem IA
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

const L = (locale: string, pt: string, en: string) => (locale === "pt" ? pt : en);

function formatAsOf(asOf: string, locale: string): string {
  if (asOf === "live") return L(locale, "ao vivo", "live");
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
  return <span className="text-[8px] font-mono uppercase tracking-wider border px-1.5 py-[1px] text-[#00CC88] border-[#00CC88]/30">{L(locale, "ao vivo", "live")}</span>;
}

/** "2024–2026" a partir das datas das fontes curadas (fontes ao vivo não entram). */
function referenceRange(sources: LayerSource[]): string | null {
  const years = sources.filter((s) => s.asOf !== "live").map((s) => Number(s.asOf.slice(0, 4))).filter(Number.isFinite);
  if (!years.length) return null;
  const min = Math.min(...years), max = Math.max(...years);
  return min === max ? String(min) : `${min}–${max}`;
}

function Heading({ icon: Icon, children }: { icon: typeof Layers; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <Icon size={11} className="text-[#00FFFF]" />
      <span className="text-[9px] font-mono uppercase tracking-widest text-[#777]">{children}</span>
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
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#00FFFF]">
                {L(locale, "Camadas ODIN", "ODIN Layers")}
              </span>
              <span className="text-[8px] font-mono text-[#444]">
                · {L(locale, "estruturais · sem IA", "structural · no AI")}
              </span>
              {range && (
                <span className="text-[8px] font-mono text-[#666]">
                  · {L(locale, "referência dos dados", "data reference")}: {range}{hasLive ? L(locale, " + ao vivo", " + live") : ""}
                </span>
              )}
              {scoped && (
                <span className="text-[8px] font-mono uppercase tracking-wider border px-1.5 py-[1px] text-[#00FFFF] border-[#00FFFF]/30" data-layers-scope={spec.scope}>
                  {L(locale, "região", "region")}: {spec.scope}
                </span>
              )}
            </div>
            <ChevronDown size={13} className="text-[#555] shrink-0 transition-transform group-open:rotate-180" />
          </summary>

          <div className="border-t border-[#00FFFF]/10 px-4 pb-4 grid gap-5 md:grid-cols-2">
            <div className="pt-4">
              <Heading icon={Database}>{L(locale, "Fontes e data de referência", "Sources and reference date")}</Heading>
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
              <Heading icon={BarChart3}>{L(locale, "Indicadores-chave", "Key indicators")}</Heading>
              <ul className="space-y-1.5">
                {spec.indicators.map((ind, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3 text-[10px] font-mono">
                    <span className="text-[#888]">
                      {L(locale, ind.labelPt, ind.labelEn)}
                      {ind.estimated && <span className="ml-1 text-[#FF8C00]">({L(locale, "est.", "est.")})</span>}
                    </span>
                    <span className="text-[#ddd] font-bold whitespace-nowrap" title={sourceName(ind.sourceId)}>
                      {L(locale, ind.valuePt, ind.valueEn)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Heading icon={CalendarClock}>{L(locale, "Eventos e marcos", "Events and milestones")}</Heading>
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
              <Heading icon={Radar}>What to Watch</Heading>
              <p className="text-[10px] font-mono font-bold text-[#bbb]">{L(locale, spec.watch.signalPt, spec.watch.signalEn)}</p>
              <p className="text-[9px] font-mono text-[#888] leading-relaxed mt-1">{L(locale, spec.watch.whyPt, spec.watch.whyEn)}</p>
              <p className="text-[8px] font-mono text-[#555] mt-1">{L(locale, "fonte", "source")}: {sourceName(spec.watch.sourceId)}</p>
            </div>

            <div className="md:col-span-2">
              <Heading icon={Scale}>{L(locale, "Lente de Direito Econômico", "Economic Law Lens")}</Heading>
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
