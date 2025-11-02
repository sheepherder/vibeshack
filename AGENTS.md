# VibeShack Agent Guide

- Single-page React app bootstrapped with Vite; use `npm install` + `npm run dev`/`npm run build`.
- Routing lives in `src/App.jsx` via `HashRouter` (required for GitHub Pages deployment).
- Pages under `src/pages/`, shared UI in `src/components/`, utilities/hooks in `src/utils` & `src/hooks`.
- Maintain design tokens defined in `src/index.css`; prefer existing CSS variables before adding new colors.
- Festival Planner feature relies on `@dnd-kit` for drag & drop and `timeHelpers.js` for time math—re-use them when extending scheduler behavior.
- Check localStorage interactions when adjusting persisted state (`useLocalStorage` hook in `src/hooks`).
- Run `npm run lint` and relevant feature smoke tests before shipping interactive changes.
