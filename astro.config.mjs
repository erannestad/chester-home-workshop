// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Set this once the domain is live (enables canonical URLs and social share images).
  // site: 'https://chesterhomeworkshop.com',
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
