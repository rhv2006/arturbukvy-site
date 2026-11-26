import data from '../data/cases.json';

const FEED = 'https://www.behance.net/feeds/user?username=rhv2006';

export interface Case {
  id: string;
  title: string;
  tag?: string;
  url: string;
  cover: string;
  date: string;
  top?: number;
  /** место в хвосте галереи — после заглушек «AI video» и «Mobile games» */
  tail?: number;
  videos?: string[];
  loop?: string;
}

interface Override {
  /** своя обложка из public/ вместо обложки с Behance */
  image?: string;
  title?: string;
  tag?: string;
  top?: number;
  tail?: number;
  hidden?: boolean;
  videos?: string[];
  loop?: string;
  url?: string;
  cover?: string;
  date?: string;
}

const overrides = data.cases as Record<string, Override>;

/** RSS отдаёт обложку 404px; для ретины берём max_808 (размер 808 есть не у всех проектов). */
const hiRes = (src: string) => src.replace('/projects/404/', '/projects/max_808/');

/** Запасное название из адреса, если в cases.json его ещё нет. */
function titleFromSlug(url: string): string {
  const slug = decodeURIComponent(url.split('/').pop() ?? '').replace(/-/g, ' ');
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

const cdata = (s: string) => s.replace(/^<!\[CDATA\[|\]\]>$/g, '').trim();
const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`));
  return m ? cdata(m[1]) : '';
};

async function fromFeed(): Promise<Case[]> {
  const res = await fetch(FEED, { headers: { 'User-Agent': 'Mozilla/5.0 (arturbukvy-site build)' } });
  if (!res.ok) throw new Error(`Behance RSS: HTTP ${res.status}`);
  const xml = await res.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => m[1]);
  if (!items.length) throw new Error('Behance RSS: пустая лента');

  return items.map((item) => {
    const url = tag(item, 'link');
    const id = url.match(/gallery\/(\d+)/)?.[1] ?? url;
    const cover = tag(item, 'description').match(/src='([^']+)'/)?.[1] ?? '';
    const date = new Date(tag(item, 'pubDate')).toISOString().slice(0, 10);
    const feedTitle = tag(item, 'title');
    return {
      id,
      url,
      cover,
      date,
      // кириллица в RSS приходит знаками «?»
      title: feedTitle.includes('?') ? titleFromSlug(url) : feedTitle,
    };
  });
}

function fromCache(): Case[] {
  return Object.entries(overrides)
    .filter(([, o]) => o.url && o.cover)
    .map(([id, o]) => ({ id, url: o.url!, cover: o.cover!, date: o.date ?? '', title: o.title ?? '' }));
}

let cached: Promise<{ top: Case[]; rest: Case[]; tail: Case[] }> | undefined;

export function getCases() {
  cached ??= (async () => {
    let base: Case[];
    try {
      base = await fromFeed();
    } catch (err) {
      console.warn(`[behance] ${(err as Error).message} — беру кейсы из cases.json`);
      base = fromCache();
    }
    // кейсы из хвоста старые и в короткую RSS-ленту могут не попасть — берём их из cases.json
    const seen = new Set(base.map((c) => c.id));
    base.push(...fromCache().filter((c) => overrides[c.id]?.tail && !seen.has(c.id)));

    const all = base
      .filter((c) => !overrides[c.id]?.hidden)
      .map((c) => {
        const o = overrides[c.id] ?? {};
        return { ...c, title: o.title ?? c.title, tag: o.tag, top: o.top, tail: o.tail, videos: o.videos, loop: o.loop, cover: o.image ?? hiRes(c.cover) };
      });

    const top = all.filter((c) => c.top).sort((a, b) => a.top! - b.top!);
    const rest = all.filter((c) => !c.top && !c.tail).sort((a, b) => b.date.localeCompare(a.date));
    const tail = all.filter((c) => c.tail).sort((a, b) => a.tail! - b.tail!);
    return { top, rest, tail };
  })();
  return cached;
}
