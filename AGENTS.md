# AGENTS.md — JvC Bible (jtrb-platform)

Side-by-side Bible reader PWA: Japanese Shinkaiyaku 2003 (JSS) + Chinese RCUV, with furigana.

## Stack

- **Preact 10** (NOT React — `preact/hooks`, `preact/compat` for `forwardRef` only)
- **Vite 6** + TypeScript 5.8 (strict)
- **sql.js** (SQLite3 in-browser, cached in IndexedDB)
- **kuroshiro-browser** + brotli-wasm (furigana processing)
- **vite-plugin-pwa** (custom Service Worker with CacheFirst for DBs)
- **Vitest** (jsdom) + **Playwright** for e2e (config exists, NO tests written yet)
- **No linter/formatter** configured (no eslint, prettier, biome)
- **No CI** configured

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Build to docs/ (production output)
npm run preview      # Preview production build
npm test             # vitest run (no tests exist)
npm run test:watch   # vitest watch
npm run test:e2e     # playwright test (no tests exist)
```

## Architecture

Single-page app, no router. Two states:

```
App → PasscodeGate (unauthenticated) → BibleViewer (authenticated)
```

**BibleViewer** renders two `BiblePanel` components side-by-side (JSS | RCUV) with scroll sync.

### Data Flow

1. `useDatabase` loads two SQLite3 databases (`RCUV.SQLite3`, `新改訳2003.SQLite3`) via `fetch()`, caches in IndexedDB (`jvc-bible-dbs`)
2. `useBible` queries both DBs by book/chapter, merges verse arrays
3. `useFurigana` initializes Kuroshiro (lazy, singleton) for JSS furigana conversion
4. All DB queries are raw SQL via `db.exec()` — no ORM

### Route aliases

```json
"@/*" → "./src/*"
```

`@/` at import root means `src/`.

## Critical Conventions

### Preact, not React

```tsx
// CORRECT
import { useState, useEffect, useCallback } from 'preact/hooks';
import { forwardRef } from 'preact/compat';  // ONLY use compat for forwardRef

// WRONG — will cause import errors
import { useState } from 'react';
```

JSX uses `jsxImportSource: "preact"` — no need for `import { h } from 'preact'`.
Also, Preact uses native `class` for CSS classes (NOT `className`). All components in this codebase use `class=`.

### Base path: `/jtrb-platform/`

ALL asset URLs MUST use the base path prefix. This applies to:
- DB files: `/jtrb-platform/db/RCUV.SQLite3`
- WASM: `/jtrb-platform/sql-wasm.wasm`, `/jtrb-platform/sql-wasm-browser.wasm`
- Dictionary files: `/jtrb-platform/dict/` (kuromoji .br files)
- Icons: `/jtrb-platform/icons/icon-*.png`
- Manifest: `/jtrb-platform/manifest.json`

### Build output: `docs/`

- `outDir` is `docs/` (for GitHub Pages deployment)
- `docs/` directory is committed — it IS the deploy artifact
- `public/` mirrors `docs/` structure for dev server static files
- When changing Vite config or static assets, verify both `public/` and `docs/` alignment

### Portrait mode blocked

CSS blocks all content in portrait orientation with a "rotate device" overlay. The app is landscape-only by intent.

### Passcode

- Hardcoded PIN: `9499`
- Session-based auth via `sessionStorage` key `jvc-auth`
- Stored state keys: `jvc-theme` (localStorage), `jvc-last-book`, `jvc-last-chapter` (localStorage)

### DB caching

Two-level cache:
1. **IndexedDB** (`jvc-bible-dbs` / `databases` object store) — caches downloaded SQLite3 files
2. **Service Worker** (`CacheFirst` with `bible-db` cache) — caches `/db/*.SQLite3` for 1 year

If IndexedDB entry is corrupt, falls back to re-download.

### Furigana setup

- Kuroshiro initialized lazily via `Kuroshiro.buildAndInitWithKuromoji(true)` — uses browser-based kuromoji dictionary
- `installDictInterceptor()` monkey-patches `window.fetch` to brotli-decompress `/dict/*.br` files
- Interceptor skips `localhost` (assumes dev environment doesn't need it)
- Verse processing is batched (10 verses at a time) to avoid blocking the UI
- Results cached in a `Map<string, string>` per component instance

### Theming

- CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark)
- Theme persisted in localStorage `jvc-theme`
- System preference used as default when no stored preference
- `data-theme` attribute applied to `<html>` element via `useTheme()`

### Scroll sync

- Percentage-based: calculates scroll percentage of source panel, applies to target
- Uses `requestAnimationFrame` with guard flag to prevent feedback loops
- Only active when `panelsReady` is true (DB loaded + verses rendered)

## File Map

```
src/
├── main.tsx              # App entry: passcode gate → BibleViewer
├── style.css             # All styles (CSS custom properties, theaming, 793 lines)
├── types.ts              # Book, Verse, MergedVerse, PanelLanguage, BibleDB
├── vite-env.d.ts         # Vite client types
├── components/
│   ├── BibleViewer.tsx   # Main layout: header, 2 panels, chapter nav, loading/error states
│   ├── BiblePanel.tsx    # Single panel: renders verses, handles furigana processing
│   ├── BookChapterNav.tsx# Book/chapter selection modal with filter
│   ├── ChapterNav.tsx    # Prev/Next chapter buttons
│   ├── PasscodeGate.tsx  # PIN entry with keypad + keyboard support
│   └── ThemeToggle.tsx   # Light/dark toggle button
├── hooks/
│   ├── useDatabase.ts    # Loads + caches sql.js instances
│   ├── useBible.ts       # Queries verses by book/chapter, merges JSS+RCUV
│   ├── useFurigana.ts    # Kuroshiro init + verse processing
│   ├── usePasscode.ts    # sessionStorage-based auth
│   ├── useTheme.ts       # Light/dark theme management
│   ├── useScrollSync.ts  # Percentage-based scroll sync between panels
│   └── useLocalStorage.ts# Generic localStorage hook
├── utils/
│   ├── db.ts             # sql.js init, IndexedDB caching, DB loading
│   ├── bible.ts          # SQL queries: getBooks, getMaxChapter, getVerses, mergeVerses
│   ├── furigana.ts       # Kuroshiro init, fetch interceptor, verse processing with cache
│   └── cleanText.ts      # RCUV text cleaning (strip XML tags, format footnotes)
└── types/
    └── kuroshiro-browser.d.ts  # Type declarations for kuroshiro-browser
```

## Testing

- Vitest configured with `environment: 'jsdom'`, test files pattern: `src/**/*.test.*`
- Playwright configured for e2e tests in `e2e/` directory
- **No test files currently exist** — both test runners are fully configured but unused

## Gotchas

- **No React**: never import from `react` or `react-dom`. All hooks from `preact/hooks`.
- **No JSX pragma needed**: tsconfig handles `jsxImportSource`.
- **DB paths are absolute with base**: must use `/jtrb-platform/db/...` not relative paths.
- **WASM files**: `sql-wasm.wasm` and `sql-wasm-browser.wasm` must be present in both `public/` (dev) and `docs/` (built).
- **fetch monkey-patch**: furigana replaces `window.fetch` globally for dictionary decompression. Be aware if adding new fetch-based functionality.
- **Portrait mode**: app is invisible in portrait. If developing mobile UI, remove the `@media (orientation: portrait)` block in `style.css`.
- **docs/ is both source and output**: `vite build` writes to `docs/`. Static files in `public/` are the dev-server versions. Keep them in sync.
- **No hot module reloading for DB files**: DB changes require full page reload.
