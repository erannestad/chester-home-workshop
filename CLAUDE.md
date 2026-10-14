# Chester Home Workshop: project context

Website for Eric's mom's home business in Chester, CT: hand-dyed fabric, upholstery services, watercolor paintings, local honey and other things. **Eric** (designer, maintains the code in VS Code) and **his mom** (non-technical, edits content in Pages CMS) both work on it. Every CMS save is a git commit, and every commit redeploys.

## Stack

- **Astro 7**, fully static output (`astro build` → `dist/`). No adapter, no SSR, no UI framework.
- **Pages CMS** (app.pagescms.org, free hosted). Configured by `.pages.yml`. Edits files in this repo directly. Mom is an email-invited collaborator with no GitHub account.
- **GitHub Pages**, deployed by `.github/workflows/deploy.yml` on every push to `main` (including CMS commits). Custom domain **chesterhomeworkshop.com** at the root, so there is no `base`. Internal links go through `url()` in `src/lib/site.ts`, so a `base` can be reintroduced safely.
  - GitHub Pages is static only (no server functions). Its terms also discourage sites mainly for commercial transactions, so checkout code must not assume Pages can run anything. See "Checkout plan".
  - `wrangler.jsonc` is kept from the earlier Cloudflare plan. It is unused unless hosting moves there.
- **Font:** Source Serif 4 variable (opsz), self-hosted through `@fontsource-variable`.
- Node 22.12+ (`.nvmrc`).

## Commands

```sh
npm run dev       # localhost:4321. Drafts are visible in dev only
npm run build     # must pass before any change is done
npm run check     # astro check (types); must report 0 errors
npm run preview   # serve dist/
```

## Map

| Path | Role |
|---|---|
| `.pages.yml` | CMS UI definition: collections, fields, labels, media |
| `src/content.config.ts` | Zod schemas for `products`, `categories`, `pages`, `journal` |
| `src/content/products/*.md` | One product per file. Filename = URL slug (`/products/{id}/`) |
| `src/content/categories/*.md` | Categories. Filename = id (`/shop/{id}/`) |
| `src/content/pages/{home,about,contact}.md` | Page copy |
| `src/content/journal/*.md` | Journal posts (home page, right side). Filename `YYYY-MM-DD-slug.md` |
| `src/data/settings.json` | Business name, email, phone, Instagram, Facebook, announcement bar, ordering note, journal gray/color pass |
| `src/assets/{products,journal,pages}/` | Photos. They must live here (not `public/`) so Astro optimizes them |
| `src/lib/catalog.ts` | **Catalog adapter.** The only module that reads product/category data |
| `src/lib/site.ts` | Settings loader with defaults |
| `src/lib/journal.ts` | Journal loader (`getPosts()`, newest first) |
| `src/components/Home.astro` | Home page body, shared by `pages/index.astro` and `pages/journal/[id]/[...photo].astro` |
| `src/components/JournalPost.astro` | One journal post, closed (photo, thumbnails, caption) or open (spans the journal's columns, one photo at a time) |
| `src/components/JournalProduct.astro` | A shop product in the journal feed (full color, links to the product page) |
| `src/components/JournalCategory.astro` | The featured category, pinned by the journal script to the bottom of the rightmost column. One product photo sits, uncropped, in a 3:2 frame |
| `src/components/HomeArt.astro` + `src/assets/home-art/` | Custom art at the top of the home page (not in the CMS). One image = still; several = slow looping sequence in filename order. Empty folder = nothing shown |
| `src/site.config.ts` | Dev-only config (contact `formEndpoint`) |
| `src/components/BuyBox.astro` | **The only place purchase UI/logic lives** |
| `src/components/Photo.astro` | Wrapper around `<Image>` for local or remote photos |
| `src/styles/tokens.css` | Design tokens: color, type scale, spacing |
| `src/styles/global.css` | All other CSS, plain and sectioned |
| `scripts/duplicate-entry.mjs` + `.github/workflows/duplicate-entry.yml` | "Make a copy" CMS button on products: copies the file as a hidden draft. Add a folder to `ALLOWED_DIRS` (and an `actions:` entry in `.pages.yml`) to enable it elsewhere |
| `docs/editing-guide.md` | Mom's how-to. Update it when the CMS changes |

## Rules (keep these true)

1. **A CMS edit must never break the build.** Schemas are forgiving on purpose. Optional fields use the `text()`, `num()` and `flag()` helpers in `content.config.ts`, so null, `""` and `"28"` all coerce safely. Unknown `status` values fall back to `available`, and missing images become `[]` with a placeholder block. Never add `.min()`, `.url()`, strict enums or required fields beyond `title`. Enforce requirements in `.pages.yml` (`required: true`, `pattern`) instead.
2. **Pages read data only through `src/lib/catalog.ts`.** Use the normalized `Product` and `Category` types; don't call `getCollection('products')` in pages or components. This keeps a later switch to Square/Shopify a one-file change. Page copy (`pages` collection) is the exception and uses `getEntry` directly; journal posts go through `src/lib/journal.ts`.
3. **Adding a product field touches four places, in order:**
   1. `.pages.yml`
   2. `content.config.ts` (forgiving helper)
   3. `loadProducts()` mapping in `catalog.ts`
   4. Render in `pages/products/[id].astro`

   Then update `docs/editing-guide.md`. Field `name`s must match exactly between `.pages.yml` and the schema.
4. **Purchase behavior changes go in `BuyBox.astro` only.**
5. **Mom-facing text** (CMS labels and descriptions, the editing guide) is plain English with concrete examples. No jargon like "slug", "frontmatter" or "markdown".

## Design rules

- Minimal, warm, quiet. A Maine / coastal Connecticut feel. A "sophisticated vanilla HTML/CSS" look.
- **No transitions, animations, fades or page transitions.** No `transition`, no `@keyframes`, no Astro `<ClientRouter />`, no scroll effects. Hover states change instantly (underline thickness, button invert). Exceptions: the home art loop in `HomeArt.astro` (hard cuts between frames, paused for reduced motion), and the journal photo pass (photos fade from color to gray one second after load; hover eases the pass off).
- **Layout: Cargo-style column index.** On wide screens a frame (no outer border) fills the window; pages are a row of `Column.astro` panels (label bar on top, each scrolls on its own) with a thin bar (`Header.astro`: name, menu, ©) along the bottom. Below `56rem` columns stack and the bar moves to the top. Products render as `ProductCard.astro` entries (image, then a two-part caption: numeral left, details right). Info uses `.rows` (label left, text right, hairline between rows).
- **One serif family, one size** (`--text`). Hierarchy comes from italics (`.title`), small caps (`.label`) and hairline rules (`--rule`), not from size, weight or extra fonts.
- **Color:** `--brand` (black now, may become a brownish red; candidates are in `tokens.css`) plus white. Body text uses `--ink`, never `--brand`, so changing the brand color doesn't recolor paragraphs. Use the existing tokens; don't hard-code colors.
- Plain CSS only (no Tailwind, no CSS-in-JS). Add to the matching section of `global.css`.
- Minimal client JS. Prefer HTML/CSS solutions. There are two scripts: the inline prefill on `/contact/`, and the journal script in `Home.astro`. The script packs posts so they fill tightly (a post's Width field can span 1–3 columns) and swaps open posts and photos in place. Each open post and photo is a real static page (`/journal/{id}/{n}/`); the script keeps the address bar, Back button and arrow keys in step.
- Simple UI: no hamburger menu (the nav wraps on mobile), no carousels, no modals. The open journal post (Previous / Next) is the one gallery. Product photos stack in their own column.
- Layout must work at 390px wide with no horizontal scroll.
- Copy tone: plain, warm, short. No exclamation marks or marketing superlatives.

## Pages CMS facts (verified against its source)

- `media.output` may be relative. `../../assets/products` is intentional: it writes paths relative to `src/content/products/`, which Astro's `image()` resolves into `src/assets/products/`. Don't change it to `/...` or `public/`.
- Allowed uploads are `jpg, jpeg, png, webp`. HEIC/GIF/SVG would break or skip optimization. `rename: safe` slugifies and lowercases names.
- A `reference` field stores the `{name}` token, which is the **filename with extension** (`fabric.md`). The schema's `categoryRef()` strips the path and extension to get the id.
- `select` values use `{ name, label }` objects. `list: true` works on `object` fields. Field-level `default`, `description`, `hidden`, `required` and `pattern` are supported.
- A field named `body` maps to the Markdown below the frontmatter.
- Collaborators can edit content and media but not `.pages.yml`.
- Docs: https://pagescms.org/docs/configuration/

## Checkout plan (not built yet)

Online-only, low volume → **Stripe Checkout, with products staying in the CMS.** Never introduce a second product catalog (no Stripe Products or per-product payment links to maintain).

**Hosting caveat:** the steps below need a server function. GitHub Pages can't run one. Either move hosting to Cloudflare (DNS change only; the repo and CMS stay the same), or keep Pages and deploy just the checkout Worker on Cloudflare at a subdomain like `pay.chesterhomeworkshop.com`. Then `catalog.json` is fetched from the live site URL instead of the `ASSETS` binding. Decide this with Eric before building.

1. Add `src/pages/catalog.json.ts`, which emits `{ id, title, price, status }[]` from `getProducts()`.
2. Add `worker/index.ts`. In `wrangler.jsonc` set `"main"`, and under `assets` add `"binding": "ASSETS"` and `"run_worker_first": ["/api/*"]`.
   - `POST /api/checkout` reads the price from `catalog.json` through `env.ASSETS`, never from the client.
   - It creates a Checkout Session with inline `price_data` through the Stripe REST API (`fetch`, no SDK), then 303-redirects.
3. `npx wrangler secret put STRIPE_SECRET_KEY`.
4. Add `/thanks/` and handle cancel by returning to the product page.
5. In `BuyBox.astro`, show the Buy form only when `status === 'available' && price !== null`. Keep inquiry for made-to-order and sold items.

## Current state

- All products, categories, page copy and photos are **placeholder samples**.
- `settings.json` email is `hello@example.com` (placeholder).
- `astro.config.mjs` `site` is `https://chesterhomeworkshop.com`. It enables canonical URLs and `og:image`.
- Contact uses a `mailto:` button unless `formEndpoint` is set in `src/site.config.ts`.
