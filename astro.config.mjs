// @ts-check
// Node is available when Astro loads this file. The site has no @types/node.
// @ts-expect-error ts(2591)
import { execFileSync } from 'node:child_process';
import { defineConfig } from 'astro/config';

/** Committer time of HEAD, baked into the footer at build. */
function siteUpdated() {
  try {
    return execFileSync('git', ['log', '-1', '--format=%cI'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

export default defineConfig({
  vite: {
    define: {
      __SITE_UPDATED__: JSON.stringify(siteUpdated()),
    },
  },
  site: 'https://chesterhomeworkshop.com',
  trailingSlash: 'always',
  build: { format: 'directory' },
  // Allow remote product photos if the catalog later comes from Square or Shopify.
  image: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.squarecdn.com' },
      { protocol: 'https', hostname: 'items-images-production.s3.us-west-2.amazonaws.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
    ],
  },
});
