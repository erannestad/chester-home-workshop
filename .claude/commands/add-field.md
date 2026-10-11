---
description: Add a new editable field to products (CMS + schema + adapter + page + guide)
argument-hint: <what the field is, e.g. "dye color, optional short text">
---

Add this product field: $ARGUMENTS

Follow the four-place procedure in CLAUDE.md, in order:

1. `.pages.yml`: add the field to the `products` collection with a plain-English `label` and a `description` that includes a concrete example. Use `required`/`pattern` here if validation is needed.
2. `src/content.config.ts`: add it with a forgiving helper (`text()`, `num()`, `flag()`). It must accept null, `""` and missing values. No strict validation.
3. `src/lib/catalog.ts`: add it to the `Product` type and map it in `loadProducts()` (camelCase in TS, snake_case in files).
4. `src/pages/products/[id].astro` (and `ProductCard.astro` if it belongs in listings): render it only when it's non-empty, using existing classes and tokens.

Then:
- Add a short section or line to `docs/editing-guide.md` explaining the field to Mom.
- Add the field to one sample product so it's visible in dev.
- Run `/verify`.
