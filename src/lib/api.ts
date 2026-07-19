// ============================================================
// ODIN API HELPER — padrão snapshot + live fetch com fallback
// Snapshots: JSONs versionados em /public/data (ver scripts/fetch-data.mjs)
// Live: chamadas diretas a APIs sem chave e CORS livre (mempool.space)
// ============================================================

export interface SnapshotResult<T> {
  data: T;
  updatedAt: string | null;
  isLive: boolean;
}

interface SnapshotEnvelope<T> {
  updatedAt?: string;
  source?: string;
  sourceUrl?: string;
  data: T;
}

/** Lê um snapshot de /public/data com fallback local em caso de falha. */
export async function fetchSnapshot<T>(file: string, fallback: T, timeoutMs = 6000): Promise<SnapshotResult<T>> {
  try {
    const base = import.meta.env.BASE_URL || "/";
    const res = await fetch(`${base}data/${file}`, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as SnapshotEnvelope<T>;
    return { data: json.data ?? fallback, updatedAt: json.updatedAt ?? null, isLive: true };
  } catch {
    return { data: fallback, updatedAt: null, isLive: false };
  }
}

/** Fetch JSON genérico com timeout (APIs live sem chave). Lança erro em falha. */
export async function fetchJson<T>(url: string, timeoutMs = 6000): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Formata ISO do snapshot para exibição curta no badge. */
export function formatUpdatedAt(iso: string | null, locale: string): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(locale === "pt" ? "pt-BR" : "en-US", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}
