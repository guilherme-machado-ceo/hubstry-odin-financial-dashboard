// ============================================================
// ODIN — Briefing no topo do painel (PR 2b)
// Mostra, por seção com M1 revisado: O que aconteceu → Por que importa →
// O que observar → Ver evidências. Conteúdo vem de src/data/briefing.ts,
// que só seleciona trechos literais do M1 (nenhuma inferência nova, nenhuma
// tese entre seções). Rótulos vêm do glossário (src/data/glossary.ts).
// ============================================================
import { useEffect, useState } from "react";
import { Compass, ArrowDown } from "lucide-react";
import { getLocale, subscribe } from "@/i18n";
import { fetchSnapshot } from "@/lib/api";
import { buildBriefing, type BriefingItem, type M1Entry } from "@/data/briefing";
import { term } from "@/data/glossary";

function formatDate(iso: string | undefined, locale: string): string | null {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00Z` : iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(locale === "pt" ? "pt-BR" : "en-US", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function Question({ k, locale }: { k: "whatHappened" | "whyItMatters" | "whatToObserve"; locale: string }) {
  return (
    <div className="text-[8px] font-mono uppercase tracking-widest text-[#00FFFF]/80 mb-1" data-term={k}>
      {term(k, locale)}
    </div>
  );
}

/** Apresentação pura (testável sem rede). */
export function BriefingView({ items, locale, updatedAt }: { items: BriefingItem[]; locale: string; updatedAt?: string | null }) {
  if (!items.length) return null;
  const pt = locale === "pt";
  const updated = formatDate(updatedAt ?? undefined, locale);
  return (
    <section id="briefing" className="border-b border-[#1a1a1a] bg-[#050505]" data-briefing>
      <div className="max-w-[1440px] mx-auto px-4 py-6">
        <div className="flex items-center gap-2 flex-wrap mb-4">
          <Compass size={13} className="text-[#00FFFF]" />
          <h2 className="text-[11px] font-mono uppercase tracking-widest text-[#00FFFF]" data-term="briefing">
            {term("briefing", locale)}
          </h2>
          <span className="text-[8px] font-mono text-[#555]">
            · <span data-term="humanReviewed">{term("humanReviewed", locale)}</span>
            {updated && <> · {pt ? "atualizado em" : "updated"} {updated}</>}
          </span>
        </div>
        <div className="grid gap-px bg-[#1a1a1a] border border-[#1a1a1a] md:grid-cols-3">
          {items.map((it) => {
            const asOf = formatDate(it.validAsOf, locale);
            return (
              <article key={it.sectionId} className="bg-[#0a0a0a] p-4 flex flex-col gap-3" data-briefing-item={it.sectionId}>
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-[12px] font-bold text-[#e0e0e0]">{pt ? it.titlePt : it.titleEn}</h3>
                  {asOf && <span className="text-[8px] font-mono text-[#555] whitespace-nowrap"><span data-term="referenceDate">{term("referenceDate", locale)}</span>: {asOf}</span>}
                </div>
                <div>
                  <Question k="whatHappened" locale={locale} />
                  <p className="text-[11px] font-mono text-[#bbb] leading-relaxed">{pt ? it.happenedPt : it.happenedEn}</p>
                </div>
                <div>
                  <Question k="whyItMatters" locale={locale} />
                  <p className="text-[11px] font-mono text-[#999] leading-relaxed">{pt ? it.whyPt : it.whyEn}</p>
                </div>
                <div>
                  <Question k="whatToObserve" locale={locale} />
                  <p className="text-[11px] font-mono font-bold text-[#bbb] leading-relaxed">{it.watchSignal}</p>
                  <p className="text-[10px] font-mono text-[#888] leading-relaxed mt-0.5">{it.watchWhy}</p>
                </div>
                <a href={it.anchor} className="mt-auto inline-flex items-center gap-1 text-[9px] font-mono uppercase tracking-widest text-[#777] hover:text-[#00FFFF]">
                  <span data-term="seeEvidence">{term("seeEvidence", locale)}</span> <ArrowDown size={10} />
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

interface V2Envelope { sections: Record<string, M1Entry> }

export default function BriefingODIN() {
  const [, forceUpdate] = useState(0);
  const [items, setItems] = useState<BriefingItem[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribe(() => forceUpdate((v) => v + 1));
    let cancelled = false;
    fetchSnapshot<V2Envelope>("insights.v2.json", { sections: {} })
      .then((res) => {
        if (cancelled) return;
        setItems(buildBriefing(res.data?.sections ?? {}));
        setUpdatedAt(res.updatedAt);
      })
      .catch(() => { /* sem M1 publicado: o Briefing não aparece */ });
    return () => { cancelled = true; unsub(); };
  }, []);

  return <BriefingView items={items} locale={getLocale()} updatedAt={updatedAt} />;
}
