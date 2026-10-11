// Site-wide settings, edited by the CMS in src/data/settings.json.
import raw from '../data/settings.json';

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
};

const defaults: Settings = {
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

export const settings: Settings = Object.fromEntries(
  Object.keys(defaults).map((k) => [k, clean((raw as Record<string, unknown>)[k]) || defaults[k as keyof Settings]]),
) as Settings;

/** Prefixes an internal path ("/shop/") with the deploy base ("/chester-home-workshop/"). */
export function link(path: string): string {
  return import.meta.env.BASE_URL.replace(/\/$/, '') + path;
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
