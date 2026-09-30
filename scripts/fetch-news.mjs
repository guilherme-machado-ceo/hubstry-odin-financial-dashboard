// ============================================================
// ODIN NEWS SNAPSHOT — coleta diária de notícias (Google News RSS, sem chave)
// Gera public/data/news.json consumido pelo NewsTicker (padrão snapshot:
// dados versionados em git, auditáveis, sem chamada de API no cliente).
// Cada feed falha de forma isolada; em erro total, o snapshot anterior é mantido.
// ============================================================
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve(process.cwd(), "public/data");
const UA = {
  "User-Agent": "ODIN-Dashboard-Snapshot/1.0 (+https://github.com/guilherme-machado-ceo/hubstry-odin-financial-dashboard)",
};

const FEEDS = [
  ["BRICS / Panda Bond / LC finance", "https://news.google.com/rss/search?q=BRICS+Panda+Bond+local+currency+finance&hl=en-US&gl=US&ceid=US:en"],
  ["Gold reserves / central banks", "https://news.google.com/rss/search?q=gold+reserves+central+bank+dollar&hl=en-US&gl=US&ceid=US:en"],
  ["Oil / Brent / petroyuan", "https://news.google.com/rss/search?q=oil+price+Brent+petroyuan+China&hl=en-US&gl=US&ceid=US:en"],
  ["Brazil-China yuan trade", "https://news.google.com/rss/search?q=Brazil+China+yuan+trade+agreement&hl=en-US&gl=US&ceid=US:en"],
];

const MAX_ITEMS = 12;

function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function pick(block, tag) {
  const m = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (!m) return "";
  return decodeEntities(m[1].replace(/<!\[CDATA\[|\]\]>/g, "").trim());
}

function parseItems(xml, feed) {
  const items = [];
  const blocks = xml.match(/<item>[\s\S]*?<\/item>/g) || [];
  for (const b of blocks) {
    const rawTitle = pick(b, "title");
    const link = pick(b, "link");
    const pubDate = pick(b, "pubDate");
    if (!rawTitle || !link) continue;
    // Google News entrega "Título - Fonte"
    const parts = rawTitle.split(" - ");
    const source = parts.length > 1 ? parts.pop() : feed;
    const title = parts.join(" - ");
    const ts = Date.parse(pubDate);
    items.push({
      title,
      url: link,
      source,
      publishedAt: Number.isFinite(ts) ? new Date(ts).toISOString() : null,
      feed,
    });
  }
  return items;
}

async function fetchFeed(url) {
  const res = await fetch(url, { headers: UA, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const all = [];
for (const [feed, url] of FEEDS) {
  try {
    const xml = await fetchFeed(url);
    const items = parseItems(xml, feed);
    console.log(`OK  ${feed}: ${items.length} itens`);
    all.push(...items);
  } catch (err) {
    console.warn(`SKIP ${feed}: ${err.message}`);
  }
}

const seen = new Set();
const items = all
  .filter((it) => {
    const k = it.title.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  })
  .sort((a, b) => (Date.parse(b.publishedAt) || 0) - (Date.parse(a.publishedAt) || 0))
  .slice(0, MAX_ITEMS);

if (items.length === 0) {
  console.warn("Nenhum item coletado — snapshot anterior mantido.");
  process.exit(0);
}

await mkdir(OUT_DIR, { recursive: true });
const payload = {
  updatedAt: new Date().toISOString(),
  source: "Google News RSS",
  sourceUrl: "https://news.google.com/",
  status: "fresh",
  data: { items },
};
await writeFile(path.join(OUT_DIR, "news.json"), JSON.stringify(payload));
console.log(`OK  news.json <- Google News RSS (${items.length} itens)`);
