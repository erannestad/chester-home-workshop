// Site-wide settings, edited by the CMS in src/data/settings.json.
import raw from '../data/settings.json';
import type { JournalDivider } from './journal';

type Settings = {
  site_name: string;
  tagline: string;
  location: string;
  email: string;
  phone: string;
  instagram: string;
  facebook: string;
  announcement: string;
  ordering_note: string;
  journal_color: boolean;
  journal_gray: boolean;
  journal_divider: JournalDivider;
};

type Flags = 'journal_color' | 'journal_gray' | 'journal_divider';

const defaults: Omit<Settings, Flags> = {
  site_name: 'Chester Home Workshop',
  tagline: '',
  location: '',
  email: '',
  phone: '',
  instagram: '',
  facebook: '',
  announcement: '',
  ordering_note: '',
};

const clean = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const data = raw as Record<string, unknown>;

export const settings: Settings = {
  ...(Object.fromEntries(
    Object.keys(defaults).map((k) => [k, clean(data[k]) || defaults[k as keyof typeof defaults]]),
  ) as Omit<Settings, Flags>),
  journal_color: data.journal_color === true,
  journal_gray: data.journal_gray !== false,
  journal_divider: (['year', 'months'] as const).find((v) => v === data.journal_divider) ?? 'solstices',
};

/** Prefixes an internal path ("/shop/") with the deploy base ("/chester-home-workshop/"). */
export function link(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path;
}

export const CMS = 'https://app.pagescms.org/erannestad/chester-home-workshop/main';

const cmsFile = (name: string) => `${CMS}/file/${name}`;
const cmsEntry = (collection: string, file: string) =>
  `${CMS}/collection/${collection}/edit/${encodeURIComponent(file)}`;

/** Pages CMS editor for whatever this page is showing, or null if there isn't one. */
export function cmsEditUrl(pathname: string): string | null {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  let path = pathname;
  if (base && path.startsWith(base)) path = path.slice(base.length) || '/';
  const parts = path.replace(/\/+$/, '').split('/').filter(Boolean);

  if (parts.length === 0) return cmsFile('home');
  if (parts[0] === 'about') return cmsFile('about');
  if (parts[0] === 'contact') return cmsFile('contact');
  if (parts[0] === 'products' && parts[1]) return cmsEntry('products', `src/content/products/${parts[1]}.md`);
  if (parts[0] === 'journal' && parts[1]) return cmsEntry('journal', `src/content/journal/${parts[1]}.md`);
  if (parts[0] === 'shop' && parts[1]) return cmsEntry('categories', `src/content/categories/${parts[1]}.md`);
  if (parts[0] === 'shop') return `${CMS}/collection/products`;
  return null;
}

/** Accepts "@handle", "handle" or a full URL. */
export function instagramUrl(value: string): string {
  if (!value) return '';
  if (/^https?:\/\//.test(value)) return value;
  return `https://www.instagram.com/${value.replace(/^@/, '')}/`;
}

export function instagramHandle(value: string): string {
  if (!value) return '';
  const m = value.match(/instagram\.com\/([^/?#]+)/);
  return '@' + (m ? m[1] : value.replace(/^@/, ''));
}

/** Accepts a page name ("chesterhomeworkshop"), "facebook.com/..." or a full URL. */
export function facebookUrl(value: string): string {
  if (!value) return '';
  if (/^https?:\/\//.test(value)) return value;
  if (/facebook\.com\//.test(value)) return `https://${value.replace(/^\/+/, '')}`;
  return `https://www.facebook.com/${value.replace(/^@/, '')}`;
}
