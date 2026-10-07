import { useEffect, useState } from "react";
import { t, getLocale } from "@/i18n";
import { Newspaper, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, Clock } from "lucide-react";

interface NewsItem {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  feed: string;
}

interface NewsSnapshot {
  updatedAt: string;
  source: string;
  sourceUrl: string;
  status: "fresh" | "stale" | "error";
  data: { items: NewsItem[] };
}

// Snapshot diário (cron 06:17 UTC): acima de 36h sem atualização, marca como desatualizado
const STALE_AFTER_HOURS = 36;

export default function NewsTicker() {
  const [snapshot, setSnapshot] = useState<NewsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [page, setPage] = useState(0);
  const locale = getLocale();

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/news.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json: NewsSnapshot) => {
        setSnapshot(json);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  const items = snapshot?.data.items ?? [];
  const itemsPerPage = 3;
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const currentItems = items.slice(page * itemsPerPage, (page + 1) * itemsPerPage);

  const dateLocale = locale === "pt" ? "pt-BR" : "en-US";
  const updatedAt = snapshot ? new Date(snapshot.updatedAt) : null;
  const isStale = updatedAt ? Date.now() - updatedAt.getTime() > STALE_AFTER_HOURS * 3600_000 : false;
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(dateLocale) : "");

  return (
    <section id="news" className="border-b border-[#1a1a1a] bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
      <div className="max-w-[1440px] mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Newspaper size={16} className="text-[#00FFFF]" />
            <div>
              <h2 className="text-lg font-bold text-[#e0e0e0] tracking-tight">{t("news.title")}</h2>
              <p className="text-[10px] font-mono text-[#555]">{t("news.subtitle")}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className={`hidden sm:flex items-center gap-1 text-[9px] font-mono ${isStale ? "text-[#FF8C00]" : "text-[#555]"}`}>
                <Clock size={10} />
                {t("news.updated")} {updatedAt.toLocaleDateString(dateLocale)}
                {isStale ? ` · ${t("news.stale")}` : ""}
              </span>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="p-1 text-[#555] hover:text-[#00FFFF] disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
              <span className="text-[9px] font-mono text-[#555]">{page + 1}/{totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="p-1 text-[#555] hover:text-[#00FFFF] disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="border border-[#1a1a1a] bg-[#0a0a0a] p-4 animate-pulse">
                <div className="h-3 bg-[#1a1a1a] rounded w-3/4 mb-3" />
                <div className="h-2 bg-[#1a1a1a] rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : error || items.length === 0 ? (
          <div className="flex items-center gap-2 text-[#FF8C00] text-[11px] font-mono">
            <AlertCircle size={12} />
            {t("news.unavailable")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {currentItems.map((item, i) => (
              <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" className="group border border-[#1a1a1a] bg-[#0a0a0a] p-4 hover:border-[#00FFFF]/30 transition-all">
                <div className="text-[10px] font-mono text-[#555] mb-2 flex items-center justify-between"><span>{item.source}</span><span>{fmtDate(item.publishedAt)}</span></div>
                <p className="text-[12px] text-[#aaa] leading-relaxed group-hover:text-[#e0e0e0] transition-colors line-clamp-3">{item.title}</p>
                <div className="mt-3 flex items-center gap-1 text-[9px] font-mono text-[#00FFFF] opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink size={8} />{t("news.readMore")}</div>
              </a>
            ))}
          </div>
        )}
        <div className="mt-4 text-[8px] font-mono text-[#444]">{t("news.source")}: Google News RSS · {t("news.snapshotNote")}</div>
      </div>
    </section>
  );
}
