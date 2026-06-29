# Development Guide

This document keeps the project structure, refactor rules, and release checks in one place. Use it as the first stop before adding a feature or reshaping an existing page.

## Architecture Map

```text
src/main.ts              Vue, Pinia, router, global styles
src/App.vue              Global shell: nav, footer, mobile nav, Live2D, toast, scroll tools
src/router/              Route table and page metadata
src/views/               Route-level screens. Keep orchestration here, not reusable business logic.
src/components/          Reusable UI pieces with narrow props and no global data ownership.
src/components/admin/    Admin-console modules: sidebar, side rail, KPI grid, carousel manager, reports table, and typed view-model props.
src/composables/         Reusable stateful logic, page data derivation, browser behavior.
src/stores/              Pinia domain state and API-facing actions.
src/api/                 Mock/static adapters plus HTTP API adapter.
src/utils/               Pure helpers without Vue lifecycle or store ownership.
src/types/               Shared content, API, and UI contracts.
server/                  Express API for real online data.
prisma/                  MySQL schema, migrations, seed, and database health tools.
docs/                    Development, database, content source, and roadmap notes.
```

## Data Paths

- Static GitHub Pages path: bundled public-source seed data -> Pinia store -> Vue views.
- API path: Vue frontend -> `VITE_API_BASE_URL` -> Express API -> Prisma -> MySQL.
- Timeline path: `scripts/export-anime-timeline.mjs` writes `public/data/anime-timeline.json` during Pages builds.
- Upload path: local `uploads/` for the Express API. Use persistent volume or object storage before relying on uploaded assets in production.

## Componentization Rules

- A `view` should own route lifecycle, page layout, and high-level event wiring.
- A `component` should own repeated rendering or an isolated UI pattern, such as cards, stat pills, panels, menus, and forms.
- A `composable` should own reusable stateful behavior or page data derivation, such as filters, sorting, keyboard handlers, debounce, lazy image handling, and SEO state.
- A `store` should own durable domain state, API calls, session data, and mutations that multiple screens need.
- A `utils` file should stay pure and framework-light. If it needs `ref`, `computed`, lifecycle hooks, or a store, it belongs in `composables`.

## Current Health Notes

- `src/assets/styles/base.css` is the largest file. Future CSS work should split it by layer: shell, content cards, editor, admin, schedule, gallery, responsive.
- `src/views/AdminView.vue` is the largest page. Admin navigation, side rail panels, KPI cards, system health display, carousel manager, and reports table now live in `src/components/admin/`; next refactor should extract repeated admin tables.
- `src/api/mock.ts` is both seed data and asset registry. Next data cleanup should split image assets, users, posts, carousel, and timeline fixtures into focused files.
- `src/views/EditorView.vue` is feature-heavy. Future changes should extract metadata form, image manager, editor toolbar, draft history, and preview panel.
- Prefer small structural passes that keep `npm run build` green after every pass.

## New Feature Checklist

1. Put UI repeated in more than one place into `src/components`.
2. Put route-specific computed filters, sorters, and lightbox/tab state into `src/composables`.
3. Keep API behavior aligned between `src/api/mock.ts`, `src/api/appApi.ts`, and `server/index.js`.
4. Record new source-backed content in `docs/content-sources.md`.
5. Avoid new dependencies unless existing Vue, Pinia, browser APIs, or small local helpers cannot solve the problem cleanly.
6. Run `npm run build` before commit.
7. For visible UI work, inspect desktop and mobile viewports and check for horizontal overflow.

## Release Checks

```bash
npm run build
npm run content:timeline
npm run smoke:api
```

Use `content:timeline` when touching schedule data or deployment workflow. Use `smoke:api` after deploying or changing the hosted API.

## Refactor Roadmap

| Priority | Area | Target |
| --- | --- | --- |
| P1 | Admin page | Continue extracting repeated admin tables until `AdminView.vue` is mostly route orchestration. |
| P1 | Global CSS | Split `base.css` into route and component layers imported from one index stylesheet. |
| P2 | Mock data | Split seed data by domain and keep asset metadata close to image definitions. |
| P2 | Editor | Extract rich-text toolbar, metadata form, image manager, and draft history. |
| P3 | Tests | Add lightweight smoke scripts for routes that do not require a real browser session. |
