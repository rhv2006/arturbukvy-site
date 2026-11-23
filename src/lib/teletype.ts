import data from '../data/articles.json';

const FEED = 'https://teletype.in/rss/rhv2006';

export interface Article {
  id: string;
  title: string;
  url: string;
  cover?: string;
  date: string;
  excerpt?: string;
}

interface Config {
  hidden: string[];
  order: string[];
  cache: Article[];
}

const config = data as Config;

const strip = (s: string) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`))?.[1] ?? '';

function excerpt(text: string, max = 180) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')) + '…';
}

async function fromFeed(): Promise<Article[]> {
  const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 (arturbukvy-site build)' } });
  if (!res.ok) throw new Error(`Teletype RSS: HTTP ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  if (!items.length) throw new Error('Teletype RSS: пустая лента');

  return items.map((item) => {
    const url = strip(tag(item, 'link')).split('?')[0];
    const cover = item.match(/<enclosure[^>]*url="([^"]+)"/)?.[1] ?? item.match(/<img[^>]*src="([^"]+)"/)?.[1];
    return {
      id: url.split('/').pop() ?? url,
      title: strip(tag(item, 'title')),
      url,
      cover,
      date: new Date(strip(tag(item, 'pubDate'))).toISOString().slice(0, 10),
      excerpt: excerpt(strip(tag(item, 'description'))) || undefined,
    };
  });
}

/** Статьи с Teletype: берутся из RSS при сборке; если лента недоступна — из кэша в articles.json. */
export async function getArticles(): Promise<Article[]> {
  let list: Article[];
  try {
    list = await fromFeed();
  } catch (err) {
    console.warn(`[teletype] ${(err as Error).message} — беру статьи из articles.json`);
    list = config.cache;
  }
  const rank = (a: Article) => {
    const i = config.order.indexOf(a.id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  return list
    .filter((a) => !config.hidden.includes(a.id))
    .sort((a, b) => rank(a) - rank(b) || b.date.localeCompare(a.date));
}
