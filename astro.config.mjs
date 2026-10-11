// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://ericrannestad.com',
  base: '/chester-home-workshop/',
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
