---
description: Type-check, build, and sanity-check the site before finishing a change
---

Verify the current state of the site:

1. `npm run check` must report 0 errors and 0 warnings.
2. `npm run build` must complete.
3. Design guardrails: `grep -rnE "transition|@keyframes|animation|ClientRouter" src/` should find nothing except the comment at the top of `global.css`.
4. CMS ↔ schema: every field `name` under the `products`, `categories` and pages entries in `.pages.yml` must exist in the matching schema in `src/content.config.ts` (`body` maps to the Markdown body and is exempt). Report any mismatch.
5. Robustness: temporarily add `src/content/products/zz-verify.md` with only `title: Verify` and every other field blank or null. Confirm the build still passes, then delete the file.
6. If anything visual changed, start `npm run dev` and check `/`, `/shop/`, one `/products/...` page and `/contact/?item=Test` at about 390px and 1440px wide. Look for horizontal scroll and broken layout.

Summarize pass/fail per step in a short list.
