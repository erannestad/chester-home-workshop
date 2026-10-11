// Content model. Pages CMS (.pages.yml) writes these files; Astro reads them here.
// Schemas are deliberately forgiving so an edit in the CMS never breaks the build:
// blank fields become sensible defaults instead of errors.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const STATUSES = ['available', 'made_to_order', 'sold_out'] as const;
export type Status = (typeof STATUSES)[number];

/** Optional text: null/undefined/whitespace -> "" */
const text = () =>
  z
    .string()
    .nullish()
    .transform((v) => (v ?? '').trim());

/** Optional number that tolerates "28" or "" from hand-edited files */
const num = () =>
  z
    .union([z.number(), z.string()])
    .nullish()
    .transform((v) => {
      if (v === null || v === undefined || v === '') return null;
      const n = typeof v === 'number' ? v : Number(String(v).replace(/[$,\s]/g, ''));
      return Number.isFinite(n) ? n : null;
    });

/** Optional boolean */
const flag = () =>
  z
    .boolean()
    .nullish()
    .transform((v) => v === true);

/** Category reference stored by the CMS as "fabric.md" (or a path) -> "fabric" */
const categoryRef = () =>
  z
    .string()
    .nullish()
    .transform((v) => (v ? v.split('/').pop()!.replace(/\.mdx?$/, '').trim() || null : null));

const products = defineCollection({
  loader: glob({ base: './src/content/products', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      images: z
        .union([image(), z.array(image())])
        .nullish()
        .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : [])),
      category: categoryRef(),
      price: num(),
      price_note: text(),
      status: z
        .string()
        .nullish()
        .transform((v): Status => ((STATUSES as readonly string[]).includes(v ?? '') ? (v as Status) : 'available')),
      summary: text(),
      details: z
        .array(z.object({ label: text(), value: text() }))
        .nullish()
        .transform((v) => (v ?? []).filter((d) => d.label || d.value)),
      featured: flag(),
      order: num(),
      draft: flag(),
    }),
});

const categories = defineCollection({
  loader: glob({ base: './src/content/categories', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    summary: text(),
    order: num(),
  }),
});

const pages = defineCollection({
  loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      heading: text(),
      intro: text(),
      image: image().nullish(),
      image_alt: text(),
      featured_heading: text(),
    }),
});

/** Date written by the CMS as 2026-10-04 (YAML may already parse it) -> Date, or null if missing/invalid */
const day = () =>
  z
    .union([z.date(), z.string()])
    .nullish()
    .transform((v) => {
      if (!v) return null;
      const d = v instanceof Date ? v : new Date(String(v).trim());
      return Number.isNaN(d.getTime()) ? null : d;
    });

const journal = defineCollection({
  loader: glob({ base: './src/content/journal', pattern: '**/*.md' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: day(),
      images: z
        .union([image(), z.array(image())])
        .nullish()
        .transform((v) => (v ? (Array.isArray(v) ? v : [v]) : [])),
      draft: flag(),
    }),
});

export const collections = { products, categories, pages, journal };
