// ============================================================
// ODIN INSIGHT BOX v3 — apresentação do Intelligence Contract v1
// Fonte preferencial: public/data/insights.v2.json
// Fallback controlado: public/data/insights.json (legado)
// O componente não gera nem interpreta fatos; apenas apresenta
// conteúdo já validado pelo pipeline de inteligência.
// ============================================================
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ChevronDown,
  Eye,
  FileText,
  History,
  Scale,
  Sparkles,
  Users,
} from "lucide-react";
import { t, getLocale } from "@/i18n";
import { fetchSnapshot, formatUpdatedAt } from "@/lib/api";
import { term } from "@/data/glossary";
import { reviewState, nextCheckDelay, shouldSchedule } from "@/data/insightReview";

type Audience = "government" | "corporate" | "investors" | "startups";
type ClaimKind = "fact" | "interpretation" | "hypothesis";

interface InsightConfidence {
  data?: string;
  interpretation?: string;
}

interface StakeholderImplication {
  audience: Audience;
  pt?: string;
  en?: string;
  textPt?: string;
  textEn?: string;
}

interface WhatToWatch {
  /** v1.0 */
  signal?: string;
  source?: string;
  whyItMatters?: string;
  /** v1.1 (bilíngue, gerado pela IA) */
  signalPt?: string;
  signalEn?: string;
  whyItMattersPt?: string;
  whyItMattersEn?: string;
  sourceId?: string;
  expectedDate?: string | null;
  ownerLens?: string;
  relatedSection?: string;
  nextReviewAt?: string;
}

interface EconomicLaw {
  relevance?: "low" | "medium" | "high" | "not_material";
  pt?: string;
  en?: string;
  norms?: string[];
  institutions?: string[];
  sourceRefs?: string[];
}

interface Claim {
  kind: ClaimKind;
  pt?: string;
  en?: string;
  textPt?: string;
  textEn?: string;
  evidenceRefs?: string[];
}

interface V2InsightEntry {
  sectionId?: string;
  status?: string;
  pt: string;
  en: string;
  thesis?: { pt: string; en: string };
  economicLaw?: EconomicLaw;
  stakeholderImplications?: StakeholderImplication[];
  whatToWatch?: WhatToWatch[];
  /** Contrato v1.1: lente Founder/CEO (implicação contextual que cita claims). */
  decisionLens?: { lens: string; implications: Array<{ textPt: string; textEn: string; claimRefs: string[] }> };
  claims?: Claim[];
  confidence?: InsightConfidence;
  generatedAt?: string;
  validAsOf?: string;
  nextReviewAt?: string;
  promptVersion?: string;
  provider?: string;
  model?: string;
  limitations?: string;
  provenance?: Array<{
    sourceId?: string;
    sourceUrl?: string;
    asOf?: string;
  }>;
  generationStatus?: string;
  freshness?: string;
  dataAsOf?: string;
  reviewStatus?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

interface LegacyInsightEntry {
  pt: string;
  en: string;
  dataAsOf?: string;
  freshness?: string;
  confidence?: InsightConfidence;
  promptVersion?: string;
  generatedAt?: string;
  generationStatus?: string;
}

interface V2Data {
  sections: Record<string, V2InsightEntry>;
}

interface LegacyData {
  sections: Record<string, LegacyInsightEntry>;
}

interface Props {
  section: string;
}

export interface PresentationProps {
  entry: V2InsightEntry | null;
  legacy: LegacyInsightEntry | null;
  updatedAt: string | null;
  nowMs: number;
}

const audienceLabels: Record<Audience, { pt: string; en: string }> = {
  government: { pt: "Governo / políticas públicas", en: "Government / policy" },
  corporate: { pt: "Corporativo / estratégia", en: "Corporate / strategy" },
  investors: { pt: "Investidores", en: "Investors" },
  startups: { pt: "Startups / inovação", en: "Startups / innovation" },
};

const claimLabels: Record<ClaimKind, { pt: string; en: string }> = {
  fact: { pt: "Fato", en: "Fact" },
  interpretation: { pt: "Interpretação", en: "Interpretation" },
  hypothesis: { pt: "Hipótese", en: "Hypothesis" },
};

function formatDataOf(iso: string, locale: string): string {
  try {
    const hasTime = iso.includes("T");
    return new Date(iso).toLocaleString(
      locale === "pt" ? "pt-BR" : "en-US",
      hasTime
        ? {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          }
        : { day: "2-digit", month: "2-digit", year: "numeric" }
    );
  } catch {
    return iso;
  }
}

function formatReviewedAt(iso: string, locale: string): string {
  try {
    return new Date(iso).toLocaleDateString(
      locale === "pt" ? "pt-BR" : "en-US",
      { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }
      // pt-BR → DD/MM  |  en-US → MM/DD
    );
  } catch {
    return iso;
  }
}

function formatReviewDate(iso: string, locale: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(
      locale === "pt" ? "pt-BR" : "en-US",
      locale === "pt"
        ? { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo" }
        : { month: "2-digit", day: "2-digit", timeZone: "America/Sao_Paulo" }
    );
  } catch {
    return iso;
  }
}

function localize(locale: string, pt?: string, en?: string): string {
  return locale === "pt" ? pt ?? "" : en ?? pt ?? "";
}

function levelLabel(level: string | undefined, locale: string): string {
  if (!level) return "—";
  const labels: Record<string, { pt: string; en: string }> = {
    high: { pt: "alto", en: "high" },
    medium: { pt: "médio", en: "medium" },
    low: { pt: "baixo", en: "low" },
    not_material: { pt: "não material", en: "not material" },
  };
  return labels[level]?.[locale === "pt" ? "pt" : "en"] ?? level;
}

export function InsightBoxPresentation({ entry, legacy, updatedAt, nowMs }: PresentationProps) {
  const locale = getLocale();

  if (!entry && !legacy) return null;

  // ── Legacy path ──────────────────────────────────────────────
  if (!entry && legacy) {
    if (legacy.freshness === "stale") {
      return (
        <div className="mb-6 border border-[#FF8C00]/20 bg-[#FF8C00]/5 p-4">
          <div className="flex items-center gap-1.5 text-[8px] font-mono text-[#FF8C00]">
            <AlertTriangle size={10} />
            {t("insight.underReviewGeneric")}
          </div>
        </div>
      );
    }

    const text = locale === "pt" ? legacy.pt : legacy.en;
    if (!text) return null;
    const preserved = legacy.generationStatus?.startsWith("preserved") ?? false;

    return (
      <div className="mb-6 border border-[#00FFFF]/20 bg-[#00FFFF]/5 p-4">
        <div className="flex items-center flex-wrap gap-2 mb-2">
          <Sparkles size={12} className="text-[#00FFFF]" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#00FFFF]">
            ODIN Insight
          </span>
          <span className="text-[8px] font-mono text-[#444]">· {t("insight.badge")}</span>
        </div>
        <p className="text-[11px] font-mono text-[#999] leading-relaxed">{text}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {legacy.dataAsOf && (
            <span className="text-[8px] font-mono text-[#555]">
              {t("insight.dataOf")} {formatDataOf(legacy.dataAsOf, locale)}
            </span>
          )}
          {updatedAt && (
            <span className="text-[8px] font-mono text-[#555]">
              {t("insight.generatedAt")} {formatUpdatedAt(updatedAt, locale)}
            </span>
          )}
          {legacy.confidence && (
            <span className="text-[8px] font-mono text-[#555]">
              {t("insight.confidence")}: {t("insight.data")} {levelLabel(legacy.confidence.data, locale)} ·{" "}
              {t("insight.interpretation")} {levelLabel(legacy.confidence.interpretation, locale)}
            </span>
          )}
        </div>
        {preserved && (
          <div className="mt-2 flex items-center gap-1.5 text-[8px] font-mono text-[#777]">
            <History size={10} />
            {t("insight.preserved")}
          </div>
        )}
      </div>
    );
  }

  if (!entry) return null;

  // ── v2 path: expiry and stale checks ─────────────────────────
  const { expired } = reviewState(entry.nextReviewAt, nowMs);
  const isStale = entry.freshness === "stale";

  // Expired takes precedence: always show dated warning.
  if (expired) {
    return (
      <div className="mb-6 border border-[#FF8C00]/20 bg-[#FF8C00]/5 p-4">
        <div className="flex items-center gap-1.5 text-[8px] font-mono text-[#FF8C00]">
          <AlertTriangle size={10} />
          {t("insight.underReviewSince")} {formatReviewDate(entry.nextReviewAt!, locale)}
        </div>
      </div>
    );
  }

  // Stale but not yet expired: generic warning, hide analytical content.
  if (isStale) {
    return (
      <div className="mb-6 border border-[#FF8C00]/20 bg-[#FF8C00]/5 p-4">
        <div className="flex items-center gap-1.5 text-[8px] font-mono text-[#FF8C00]">
          <AlertTriangle size={10} />
          {t("insight.underReviewGeneric")}
        </div>
      </div>
    );
  }

  // ── v2 full render ────────────────────────────────────────────
  const text = localize(locale, entry.pt, entry.en);
  if (!text) return null;

  const law = entry.economicLaw;
  const stakeholders = entry.stakeholderImplications ?? [];
  const watch = entry.whatToWatch ?? [];
  const claims = entry.claims ?? [];
  const provenance = entry.provenance ?? [];
  const generatedAt = entry.generatedAt ?? updatedAt;
  const validAsOf = entry.validAsOf;
  const preserved = entry.status?.startsWith("preserved") ?? false;

  const isHumanReviewed =
    entry.reviewStatus === "approved" &&
    !!entry.reviewedAt && !isNaN(Date.parse(entry.reviewedAt)) &&
    !!entry.reviewedBy;

  return (
    <details className="mb-6 group border border-[#00FFFF]/20 bg-[#00FFFF]/5">
      <summary className="list-none cursor-pointer select-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-[#00FFFF]/5 transition-colors">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <Sparkles size={12} className="text-[#00FFFF] shrink-0" />
          <span className="text-[9px] font-mono uppercase tracking-widest text-[#00FFFF]">
            ODIN Insight
          </span>
          <span className="text-[8px] font-mono text-[#444]">· v{entry.promptVersion ?? "3.0"}</span>
          {isHumanReviewed && (
            <span className="text-[8px] font-mono text-[#00FF88]" data-human-reviewed="true">
              {t("insight.humanReviewedOn")} {formatReviewedAt(entry.reviewedAt!, locale)}
            </span>
          )}
        </div>
        <ChevronDown
          size={13}
          className="text-[#555] shrink-0 transition-transform group-open:rotate-180"
        />
      </summary>

      <div className="border-t border-[#00FFFF]/10 px-4 pb-4">
        <div className="pt-4">
          <div className="flex items-center gap-2 mb-2">
            <Eye size={11} className="text-[#00FFFF]" />
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#777]">
              {locale === "pt" ? "Contexto Estratégico" : "Strategic Context"}
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#999] leading-relaxed">{text}</p>
        </div>

        {entry.thesis && (
          <div className="mt-4 border-l border-[#00FFFF]/40 pl-3">
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#777] mb-2">
              {locale === "pt" ? "Tese ODIN" : "ODIN Thesis"}
            </div>
            <p className="text-[11px] font-mono text-[#bbb] leading-relaxed">
              {localize(locale, entry.thesis.pt, entry.thesis.en)}
            </p>
          </div>
        )}

        {law && (
          <div className="mt-4 border border-[#1a1a1a] bg-[#080808] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Scale size={11} className="text-[#FF8C00]" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#777]">
                {locale === "pt" ? "Lente de Direito Econômico" : "Economic Law Lens"}
              </span>
              {law.relevance && (
                <span className="text-[8px] font-mono text-[#FF8C00]">
                  · {locale === "pt" ? "relevância" : "relevance"}: {levelLabel(law.relevance, locale)}
                </span>
              )}
            </div>
            {(law.pt || law.en) && (
              <p className="text-[10px] font-mono text-[#999] leading-relaxed">
                {localize(locale, law.pt, law.en)}
              </p>
            )}
            {(law.norms?.length || law.institutions?.length) ? (
              <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-3">
                {law.norms?.length ? (
                  <div>
                    <div className="text-[8px] font-mono uppercase tracking-widest text-[#555] mb-1">
                      {locale === "pt" ? "Normas" : "Rules"}
                    </div>
                    <ul className="space-y-1">
                      {law.norms.map((item, i) => (
                        <li key={i} className="text-[9px] font-mono text-[#777] leading-relaxed">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {law.institutions?.length ? (
                  <div>
                    <div className="text-[8px] font-mono uppercase tracking-widest text-[#555] mb-1">
                      {locale === "pt" ? "Instituições" : "Institutions"}
                    </div>
                    <ul className="space-y-1">
                      {law.institutions.map((item, i) => (
                        <li key={i} className="text-[9px] font-mono text-[#777] leading-relaxed">
                          · {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {(entry.decisionLens?.implications ?? []).length > 0 && (
          <div className="mt-4 border-l border-[#FF8C00]/50 pl-3" data-decision-lens={entry.decisionLens!.lens}>
            <div className="text-[9px] font-mono uppercase tracking-widest text-[#777] mb-2" data-term="founderLens">
              {term("founderLens", locale)}
            </div>
            <ul className="space-y-1.5">
              {entry.decisionLens!.implications.map((imp, i) => (
                <li key={i} className="text-[11px] font-mono text-[#bbb] leading-relaxed">{localize(locale, imp.textPt, imp.textEn)}</li>
              ))}
            </ul>
          </div>
        )}

        {stakeholders.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Users size={11} className="text-[#00FF88]" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#777]">
                {locale === "pt" ? "Implicações para Stakeholders" : "Stakeholder Implications"}
              </span>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-[#1a1a1a] border border-[#1a1a1a]">
              {stakeholders.map((item, i) => (
                <div key={i} className="bg-[#0a0a0a] p-3">
                  <div className="text-[8px] font-mono uppercase tracking-widest text-[#00FF88] mb-1">
                    {audienceLabels[item.audience]?.[locale === "pt" ? "pt" : "en"] ?? item.audience}
                  </div>
                  <p className="text-[10px] font-mono text-[#999] leading-relaxed">
                    {localize(locale, item.pt ?? item.textPt, item.en ?? item.textEn)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {watch.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <CalendarClock size={11} className="text-[#4488FF]" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#777]">
                What to Watch
              </span>
            </div>
            <div className="space-y-2">
              {watch.map((item, i) => (
                <div key={i} className="border border-[#1a1a1a] bg-[#080808] p-3">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1">
                    <span className="text-[9px] font-mono font-bold text-[#bbb]">{localize(locale, item.signalPt ?? item.signal, item.signalEn ?? item.signal)}</span>
                    {item.expectedDate && (
                      <span className="text-[8px] font-mono text-[#4488FF]">{item.expectedDate}</span>
                    )}
                    <span className="text-[8px] font-mono text-[#555]">
                      {"source: " + (item.sourceId ?? item.source)}
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-[#888] leading-relaxed">{localize(locale, item.whyItMattersPt ?? item.whyItMatters, item.whyItMattersEn ?? item.whyItMatters)}</p>
                  {(item.ownerLens || item.relatedSection) && (
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[8px] font-mono text-[#555]">
                      {item.ownerLens && <span>{"lens: " + item.ownerLens}</span>}
                      {item.relatedSection && <span>{"section: " + item.relatedSection}</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(claims.length > 0 || provenance.length > 0) && (
          <details className="mt-4 border-t border-[#1a1a1a] pt-3 group/evidence">
            <summary className="list-none cursor-pointer flex items-center gap-2 text-[8px] font-mono uppercase tracking-widest text-[#555] hover:text-[#777]">
              <FileText size={10} />
              {locale === "pt" ? "Evidências e Proveniência" : "Evidence & Provenance"}
              <ChevronDown size={10} className="transition-transform group-open/evidence:rotate-180" />
            </summary>
            <div className="mt-3 space-y-2">
              {claims.map((claim, i) => (
                <div key={i} className="border-l border-[#222] pl-3">
                  <div className="text-[8px] font-mono text-[#00FFFF] mb-1">
                    {claimLabels[claim.kind]?.[locale === "pt" ? "pt" : "en"] ?? claim.kind}
                    {claim.evidenceRefs?.length ? " · " + claim.evidenceRefs.join(", ") : ""}
                  </div>
                  <p className="text-[9px] font-mono text-[#777] leading-relaxed">
                    {localize(locale, claim.pt ?? claim.textPt, claim.en ?? claim.textEn)}
                  </p>
                </div>
              ))}
              {provenance.map((source, i) => (
                <div key={i} className="flex flex-wrap gap-x-2 text-[8px] font-mono text-[#555]">
                  <span>{source.sourceId ?? "source"}</span>
                  {source.asOf && <span>{"· asOf " + source.asOf}</span>}
                  {source.sourceUrl && (
                    <a
                      href={source.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#4488FF] hover:text-[#00FFFF] truncate max-w-full"
                    >
                      {source.sourceUrl}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </details>
        )}

        <div className="mt-4 pt-3 border-t border-[#1a1a1a] flex flex-wrap items-center gap-x-3 gap-y-1">
          {validAsOf && (
            <span className="text-[8px] font-mono text-[#555]">
              {locale === "pt" ? "Dados até" : "Data as of"} {formatDataOf(validAsOf, locale)}
            </span>
          )}
          {generatedAt && (
            <span className="text-[8px] font-mono text-[#555]">
              {t("insight.generatedAt")} {formatUpdatedAt(generatedAt, locale)}
            </span>
          )}
          {entry.confidence && (
            <span className="text-[8px] font-mono text-[#555]">
              {t("insight.confidence")}: {t("insight.data")} {levelLabel(entry.confidence.data, locale)} ·{" "}
              {t("insight.interpretation")} {levelLabel(entry.confidence.interpretation, locale)}
            </span>
          )}
          {entry.provider && entry.model && (
            <span className="text-[8px] font-mono text-[#555]">
              {entry.provider} · {entry.model}
            </span>
          )}
          {entry.nextReviewAt && (
            <span className="text-[8px] font-mono text-[#555]">
              {locale === "pt" ? "Próxima revisão" : "Next review"} {formatDataOf(entry.nextReviewAt, locale)}
            </span>
          )}
        </div>

        {preserved && (
          <div className="mt-2 flex items-center gap-1.5 text-[8px] font-mono text-[#777]">
            <History size={10} />
            {t("insight.preserved")}
          </div>
        )}
      </div>
    </details>
  );
}

export default function InsightBox({ section }: Props) {
  const [entry, setEntry] = useState<V2InsightEntry | null>(null);
  const [legacy, setLegacy] = useState<LegacyInsightEntry | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const v2 = await fetchSnapshot<V2Data>("insights.v2.json", { sections: {} });
      const v2Entry = v2.data?.sections?.[section];

      if (v2Entry && !cancelled && (v2Entry.pt || v2Entry.en)) {
        setEntry(v2Entry);
        setUpdatedAt(v2.updatedAt ?? v2Entry.generatedAt ?? null);
        return;
      }

      const old = await fetchSnapshot<LegacyData>("insights.json", { sections: {} });
      const oldEntry = old.data.sections?.[section];

      if (!cancelled && oldEntry && (oldEntry.pt || oldEntry.en)) {
        setLegacy(oldEntry);
        setUpdatedAt(old.updatedAt ?? oldEntry.generatedAt ?? null);
      }
    }

    load().catch(() => {
      // Sem insights publicados: a seção permanece sem o componente.
    });

    return () => {
      cancelled = true;
    };
  }, [section]);

  // Schedule a re-render at expiry. Each tick uses nextCheckDelay (≤ 24 h).
  // Only schedules when nextReviewAt is valid and in the future.
  useEffect(() => {
    if (!shouldSchedule(entry?.nextReviewAt, now)) return;
    const { msUntilExpiry } = reviewState(entry!.nextReviewAt!, now);
    const delay = nextCheckDelay(msUntilExpiry!);
    const id = setTimeout(() => setNow(Date.now()), delay);
    return () => clearTimeout(id);
  }, [entry?.nextReviewAt, now]);

  return (
    <InsightBoxPresentation
      entry={entry}
      legacy={legacy}
      updatedAt={updatedAt}
      nowMs={now}
    />
  );
}
