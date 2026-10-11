// Journal posts, edited in Pages CMS (src/content/journal). Newest first; drafts appear only in `npm run dev`.
import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';

export type Post = {
  id: string;
  title: string;
  date: Date | null;
  images: ImageMetadata[];
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
      bodyHtml: rendered?.html ?? '',
    }))
    .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0) || b.id.localeCompare(a.id));
}

export const formatDate = (d: Date) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
