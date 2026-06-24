# Architecture

Vanilla HTML/CSS/JS, browser-only, zero backend. Source is ES modules under
`js/`; `index.html` loads a pre-built `js/app.bundle.js` (esbuild IIFE) so the
app runs on `file://` and over HTTP. Tailwind + Lucide load via CDN.


## What each folder owns

- **css/** — `tokens.css` (CSS variables + base body/scrollbar), `animations.css`
  (keyframes + animation utility classes), `components.css` (everything else).
- **js/constants.js** — `ERROR_MODES`, `STORAGE_KEYS`, shared config.
- **js/utils.js** — `escapeHtml`, `csvEsc`, `dateStamp`, `downloadBlob`. Pure.
- **js/lib/** — pure logic, no DOM, no state: `inference.js` (label heuristics),
  `metrics.js` (`confusionMatrix`, `accuracyPct`), `insights.js` (insight + error-bar data).
- **js/api/** — fetch only: `openai`, `gemini`, `github`, `qwen`, `detectProvider`,
  and `runInference.js` which builds the hidden frame-context prompt and dispatches.
- **js/services/** — side-effects that aren't app DOM: `storage.js` (localStorage +
  legacy migration + api key), `video.js` (canvas frame extraction), `import.js`,
  `export.js`.
- **js/state/** — `store.js` is the single mutable source of truth (sessions +
  workbench form state); `actions.js` performs CRUD, persists, and triggers re-renders.
- **js/ui/** — DOM rendering and event handlers only; reads from `store`, calls
  `actions`/`services`/`lib`. Inline `on*` attributes resolve to `window`-exposed
  functions assigned in `main.js`.

## Notable refactors

- Confusion-matrix math, previously duplicated in `updateMetrics()` and
  `renderSessionsTab()`, is now the single `confusionMatrix()` in `lib/metrics.js`.
- Insight/error-bar generation is split into pure data builders (`lib/insights.js`)
  and DOM rendering (`ui/insights.js`).


## Running

- **Recommended:** `.\serve.ps1` → `http://localhost:8080`
- **Direct:** open `index.html` in a browser (uses `app.bundle.js`)
- **After editing `js/`:** `npm run build` to regenerate `js/app.bundle.js`
