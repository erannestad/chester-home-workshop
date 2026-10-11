---
description: Build the planned Stripe Checkout (products stay in the CMS; prices read server-side)
argument-hint: [shipping notes, e.g. "US only, flat $8 shipping, local pickup option"]
---

Implement online checkout per the "Checkout plan" in CLAUDE.md. Shipping/options: $ARGUMENTS

Requirements:
- No second catalog. Prices come only from the CMS content via `getProducts()`.
- `src/pages/catalog.json.ts` is a static endpoint emitting `{ id, title, price, status }[]`.
- `worker/index.ts` is a Cloudflare Worker. `POST /api/checkout` with form field `id`:
  - Look up the product in `catalog.json` via `env.ASSETS.fetch`.
  - Reject it if missing, sold, made-to-order or unpriced.
  - Create a Stripe Checkout Session using `fetch` to `https://api.stripe.com/v1/checkout/sessions` (form-encoded, no SDK) with inline `price_data` (USD, `unit_amount` in cents, product name + first image URL if `site` is set).
  - Set `success_url` to `/thanks/` and `cancel_url` to the product page.
  - Respond with a 303 redirect to `session.url`.
  - Everything else falls through to static assets.
- `wrangler.jsonc`: add `main`, `assets.binding: "ASSETS"` and `assets.run_worker_first: ["/api/*"]`. Use a current `compatibility_date`.
- `.dev.vars.example` with `STRIPE_SECRET_KEY=sk_test_...`. Make sure `.dev.vars` is gitignored.
- `src/pages/thanks.astro` in the existing style.
- `BuyBox.astro`: for `available` items with a price, render `<form method="post" action="/api/checkout">` with a hidden `id` and a "Buy" button. Keep the inquiry link as a secondary text link. Made-to-order and sold items keep the current behavior.
- Update the README "Adding online checkout" section to describe what was built, plus the setup steps (Stripe account, `wrangler secret put STRIPE_SECRET_KEY`, test mode first).
- Add a short "When something sells" note to `docs/editing-guide.md` (mark one-of-a-kind items Sold).

Ask before running any `wrangler deploy` or `git push`. Finish with `/verify`.
