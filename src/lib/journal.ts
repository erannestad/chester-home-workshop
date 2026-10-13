// Journal posts, edited in Pages CMS (src/content/journal). Newest first; drafts appear only in `npm run dev`.
import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type Post = {
  id: string;
  title: string;
  date: Date | null;
  images: ImageMetadata[];
  span: number; // 1–3 journal columns on a wide screen
  bodyHtml: string;
};

export async function getPosts(): Promise<Post[]> {
  const entries = await getCollection('journal');
  return entries
    .filter(({ data }) => import.meta.env.DEV || !data.draft)
    .map(({ id, data, rendered }) => ({
      id,
      title: data.title,
      date: data.date,
      images: data.images,
      span: data.span,
      bodyHtml: rendered?.html ?? '',
    }))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || b.id.localeCompare(a.id));
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Insert extras as the 2nd or 3rd item in each group. Same ids always produce the same gaps. */
export function scatterEvery<T, U>(
  items: T[],
  extras: U[],
  itemId: (item: T) => string,
  extraId: (extra: U) => string,
): Array<{ kind: 'item'; value: T; index: number } | { kind: 'extra'; value: U }> {
  if (!extras.length) return items.map((value, index) => ({ kind: 'item' as const, value, index }));
  if (!items.length) return extras.map((value) => ({ kind: 'extra' as const, value }));

  let seed = 2166136261;
  for (const ch of [...extras.map(extraId), ...items.map(itemId)].join('|')) {
    seed ^= ch.charCodeAt(0);
    seed = Math.imul(seed, 16777619);
  }
  const rand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gap = () => 1 + Math.floor(rand() * 2);

  const out: Array<{ kind: 'item'; value: T; index: number } | { kind: 'extra'; value: U }> = [];
  let i = 0;
  let e = 0;
  let until = gap();
  while (i < items.length) {
    out.push({ kind: 'item', value: items[i], index: i });
    i++;
    until--;
    if (until <= 0 && e < extras.length) {
      out.push({ kind: 'extra', value: extras[e++] });
      until = gap();
    }
  }
  while (e < extras.length) out.push({ kind: 'extra', value: extras[e++] });
  return out;
}
