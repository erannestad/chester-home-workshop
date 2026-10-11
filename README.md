# Chester Home Workshop

Website for Chester Home Workshop: hand-dyed fabric, upholstery, watercolors and local honey.

| Piece | What | Cost |
|---|---|---|
| Site | [Astro](https://astro.build) 7, static HTML + one plain CSS file. No JS framework. | Free |
| CMS | [Pages CMS](https://pagescms.org) (hosted at app.pagescms.org). Edits the files in this repo. | Free |
| Hosting | Cloudflare Workers (static assets), auto-deploys from GitHub. | Free tier |
| Checkout | Not yet. Every product has an inquiry button. Plan: Stripe Checkout, see [Adding online checkout](#adding-online-checkout). | Stripe per-sale fees only |

Every save in the CMS is a git commit. Every commit rebuilds the site (about a minute).

---

## Local development

Requires Node 22.12+.

Open `chester-home-workshop.code-workspace` in VS Code. It recommends the Astro, Claude Code and YAML extensions and adds dev/build/check tasks.

```sh
npm install
npm run dev       # http://localhost:4321 (drafts are visible here)
npm run build     # production build into dist/
npm run preview   # serve dist/ locally
npm run check     # type-check
```

## Project map

```
CLAUDE.md                  Project context for Claude Code (rules, design constraints, CMS gotchas)
.claude/                   Claude Code project settings + commands: /verify, /add-field, /stripe-checkout
.pages.yml                 CMS configuration (what the editor sees)
astro.config.mjs           Site config (set `site` once the domain is live)
wrangler.jsonc             Cloudflare config (serves dist/)
src/
  content.config.ts        Content schemas (forgiving: blank fields never break the build)
  content/
    products/*.md          One file per product
    categories/*.md        Fabric, Upholstery, Watercolors, Honey…
    pages/                 home.md, about.md, contact.md
  data/settings.json       Business name, email, phone, Instagram, announcement bar, ordering note
  assets/products/         Product photos (optimized to WebP at build time)
  assets/pages/            Page photos
  lib/catalog.ts           Catalog adapter. The ONLY file that knows where products come from.
  lib/site.ts              Reads settings.json
  site.config.ts           Developer settings (contact form endpoint)
  styles/tokens.css        Colors, type, spacing. Restyle the site here.
  styles/global.css        All other CSS
  components/BuyBox.astro  The single place that decides how someone buys
  pages/                   Routes: /, /shop/, /shop/[category]/, /products/[id]/, /about/, /contact/
```

## Design

- One serif family (Source Serif 4, self-hosted), black + white, warm gray hairlines.
- No transitions, fades or animations anywhere.
- **Brand color:** change `--brand` in `src/styles/tokens.css`. A few brownish reds are listed in the comment there. Body text stays near-black via `--ink`.
- **Font:** swap the two `@fontsource-variable/...` imports in `src/layouts/Base.astro` and `--font` in `tokens.css`.

---

## Deploy (one-time)

1. **GitHub:** create a private repo and push this folder.
   ```sh
   git init && git add -A && git commit -m "Initial site"
   git branch -M main
   git remote add origin git@github.com:<you>/chester-home-workshop.git
   git push -u origin main
   ```
2. **Cloudflare:** Dashboard → Workers & Pages → Create → *Import a repository* → pick the repo.
   - Build command: `npm run build`
   - Deploy command: `npx wrangler deploy`
   - It deploys to `chester-home-workshop.<account>.workers.dev`. Add the real domain under the Worker's *Settings → Domains & Routes*.
3. Once the domain is live, set `site` in `astro.config.mjs`. That turns on canonical URLs and social-share images.

## CMS setup (one-time)

1. Go to **app.pagescms.org** and sign in with GitHub.
2. Install the Pages CMS GitHub App on the repo when prompted. It picks up `.pages.yml` automatically.
3. Open the repo in Pages CMS → **Collaborators** → invite your mom **by email**. She doesn't need a GitHub account. She signs in with a link sent to her email.
4. Send her `docs/editing-guide.md`.

Collaborators can edit content and photos. They can't change `.pages.yml` or invite others.

### Changing what the CMS shows

Edit `.pages.yml`. Field `name`s must match `src/content.config.ts`. To add a product field:

1. Add it to `.pages.yml`.
2. Add it to the schema in `content.config.ts` (use the `text()` / `num()` / `flag()` helpers so blanks are safe).
3. Map it in `loadProducts()` in `lib/catalog.ts`.
4. Render it in `pages/products/[id].astro`.

---

## Contact form (optional)

By default the contact page shows a "Write to us" button that opens an email pre-filled with the product name. For an on-page form instead, create a free form endpoint (Formspree, Web3Forms, Basin…) and paste its URL into `formEndpoint` in `src/site.config.ts`. The form posts `name`, `email`, `item`, `message`.

---

## Adding online checkout

All buy logic lives in `src/components/BuyBox.astro`, and all product data comes through `src/lib/catalog.ts`. Pick one:

### A. Stripe Checkout, products stay in the CMS (planned: online-only, low volume)

No second catalog to maintain. Prices come from the same Markdown files.

1. At build time, write a small `dist/catalog.json` (`id`, `title`, `price`, `status`) from `getProducts()`. One extra Astro endpoint does it: `src/pages/catalog.json.ts`.
2. Add a Worker script (`worker/index.ts`). Set `"main"` in `wrangler.jsonc`, and add `"binding": "ASSETS"` plus `"run_worker_first": ["/api/*"]` under `assets`.
   - `POST /api/checkout { id }` reads the price from `catalog.json` through the `ASSETS` binding, so a customer can't tamper with it.
   - It then creates a Stripe Checkout Session with inline `price_data`, plus shipping address collection if needed, and redirects.
3. Store the Stripe secret with `npx wrangler secret put STRIPE_SECRET_KEY`.
4. In `BuyBox.astro`, render a `<form method="post" action="/api/checkout">` with a hidden `id` for products with `status === 'available'` and a price. Keep the inquiry button for made-to-order and sold items.
5. Orders, payouts and receipts live in the Stripe dashboard/app. After a one-of-a-kind sale, she marks the item **Sold** in the CMS.

### B. Square as the catalog (best if she also sells in person)

She manages products in the Square app, and in-person and online inventory stay in sync. Square Free has no monthly fee.

1. Replace `loadProducts()` / `loadCategories()` in `lib/catalog.ts` with Square Catalog API calls. Use a server-side access token in a build env var. Map items → `Product` and categories → `Category`.
2. Remote image hosts are already allowed in `astro.config.mjs`.
3. Rebuild on catalog changes: add a Square webhook (`catalog.version.updated`) that calls a Cloudflare deploy hook.
4. Checkout: a Worker endpoint that creates a Square payment link for the item (same pattern as A).
5. Remove the Products/Categories sections from `.pages.yml`. Keep Pages and Settings.

### C. Shopify as the catalog

Same as B, using the Storefront API and Shopify's hosted checkout. Requires a paid plan that includes headless (Basic, not Starter).

---

## Notes

- **Photos:** JPG/PNG/WebP only (HEIC, GIF and SVG are blocked in the CMS because the build can't process them). Large phone photos are fine; they're resized at build time.
- **Drafts:** "Hide from website" keeps a product off the live site. It still shows in `npm run dev`.
- **Sample content:** every product, category and page text, plus the photos in `src/assets/`, are placeholders to be replaced.
