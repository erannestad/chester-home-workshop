/*
  Catalog adapter: the ONLY place that knows where products come from.

  Today: Markdown files in src/content (edited with Pages CMS).
  Later: swap the two loader functions below for Square / Shopify API calls that return
  the same Product and Category shapes. Pages and components only use these shapes.
*/
import { getCollection } from 'astro:content';
import type { ImageMetadata } from 'astro';
import type { Status } from '../content.config';

export type { Status };

/** Local images are ImageMetadata; remote (store API) images are URL strings. */
export type ProductImage = ImageMetadata | string;

export type Product = {
  id: string; // URL slug: /products/{id}/
  title: string;
  images: ProductImage[];
  category: string | null; // Category id
  price: number | null; // USD; null = price on request
  priceNote: string;
  status: Status;
  summary: string;
  details: { label: string; value: string }[];
  featured: boolean;
  order: number | null;
  draft: boolean;
  bodyHtml: string; // long description, already rendered to HTML
};

export type Category = {
  id: string;
  title: string;
  summary: string;
  order: number | null;
  bodyHtml: string;
};

const LAST = Number.MAX_SAFE_INTEGER;

/* ---------- Source: Markdown content collections ---------- */

async function loadProducts(): Promise<Product[]> {
  const entries = await getCollection('products');
  return entries.map(({ id, data, rendered }) => ({
    id,
    title: data.title,
    images: data.images,
    category: data.category,
    price: data.price,
    priceNote: data.price_note,
    status: data.status,
    summary: data.summary,
    details: data.details,
    featured: data.featured,
    order: data.order,
    draft: data.draft,
    bodyHtml: rendered?.html ?? '',
  }));
}

async function loadCategories(): Promise<Category[]> {
  const entries = await getCollection('categories');
  return entries.map(({ id, data, rendered }) => ({
    id,
    title: data.title,
    summary: data.summary,
    order: data.order,
    bodyHtml: rendered?.html ?? '',
  }));
}

/* ---------- Public API used by pages ---------- */

/** Published products: manual order first, sold items last, then A–Z. Drafts appear only in `npm run dev`. */
export async function getProducts(): Promise<Product[]> {
  const all = (await loadProducts()).filter((p) => import.meta.env.DEV || !p.draft);
  return all.sort(
    (a, b) =>
      (a.order ?? LAST) - (b.order ?? LAST) ||
      Number(a.status === 'sold_out') - Number(b.status === 'sold_out') ||
      a.title.localeCompare(b.title),
  );
}

export async function getCategories(): Promise<Category[]> {
  return (await loadCategories()).sort(
    (a, b) => (a.order ?? LAST) - (b.order ?? LAST) || a.title.localeCompare(b.title),
  );
}

/* ---------- Presentation helpers ---------- */

export const STATUS_LABEL: Record<Status, string> = {
  available: 'Available',
  made_to_order: 'Made to order',
  sold_out: 'Sold',
};

const usd = (n: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  }).format(n);

/** "$28 per yard", "$14 · 8 oz jar", "Quoted per piece", or "Price on request". */
export function priceLine(p: Pick<Product, 'price' | 'priceNote'>): string {
  if (p.price === null) return p.priceNote || 'Price on request';
  if (!p.priceNote) return usd(p.price);
  // Notes that read as a unit ("per yard", "each") follow the price directly.
  return /^(per |each|\/|a |an )/i.test(p.priceNote) ? `${usd(p.price)} ${p.priceNote}` : `${usd(p.price)} · ${p.priceNote}`;
}
