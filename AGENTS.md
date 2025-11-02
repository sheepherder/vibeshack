# VibeShack Agent Guidelines

## Projektüberblick
- Dieses Repo enthält eine Vite-React-App mit mehreren "Experiments" (Taschenrechner, Festival Planner, Meditation Timer, Ambient Soundscape).
- Der Router nutzt einen `HashRouter`, damit die App problemlos auf GitHub Pages (Pfad `/vibeshack/`) ausgeliefert werden kann.
- Build-Metadaten werden in `vite.config.js` beim Build aus Git gelesen und als `__GIT_*__` Konstante injiziert. Diese Platzhalter werden im UI (z. B. in `Home.jsx`) angezeigt und sollten nicht entfernt werden.

## Lokale Commands
- `npm install` – Dependencies installieren
- `npm run dev` – Lokaler Entwicklungsserver
- `npm run build` – Produktionsbuild (vor Commit ausführen, um Build-Fehler zu vermeiden)
- `npm run preview` – Vite-Preview des Produktionsbuilds

## Deployment
- Das Projekt wird automatisch über GitHub Actions auf GitHub Pages deployed, sobald Änderungen in den `main` Branch gepusht werden.
- Die App läuft unter `/vibeshack/`, daher wird `HashRouter` verwendet.

## Code-Style & Struktur
- Funktionale React-Komponenten mit Hooks (siehe `src/pages/*.jsx`)
- ES-Module mit `import`/`export`, Dateien als `.jsx` bzw. `.js`
- **Einfache Anführungszeichen** für Strings, **keine Semikolons**, 2 Leerzeichen Einrückung
- Kommentare und UI-Texte auf **Deutsch**
- Event-Handler als Inline-Arrow-Funktionen (`onClick={() => …}`)
- Vorhandene Utility-Funktionen wiederverwenden (z. B. `timeHelpers`, `csvHelpers`)

## Routing & Navigation
- Neue Seiten in `src/App.jsx` und `<nav>` registrieren, Pfad mit führendem `/` (z. B. `/neues-tool`)
- Neue Experimente auch im `experiments`-Array in `Home.jsx` ergänzen

## Styling
- Globale Styles und Design-Tokens (`--primary`, `--bg`, etc.) in `src/index.css` verwenden
- Feature-spezifische CSS-Dateien anlegen (z. B. `AmbientSoundscape.css`) und in Komponente importieren
- Bestehendes Layout-Muster verwenden (`.container`, `.page-title`, `.page-subtitle`)

## Festival Planner Besonderheiten
- Sessions und Locations werden über den `useLocalStorage`-Hook in `hooks/useLocalStorage.js` persistiert. Bewahre die Schlüssel (`festival-sessions-2026`, `festival-locations-2026`) oder dokumentiere Änderungen daran.
- Drag & Drop basiert auf `@dnd-kit/core`. Wenn du das Verhalten anpasst, nutze die bestehenden Handler (`handleDragStart`, `handleDragEnd`, etc.) und halte `PointerSensor` weiter im Einsatz.
- Beim Import/Export existieren Hilfsfunktionen in `utils/csvHelpers.js` und `utils/timeHelpers.js`. Ergänzungen sollten diese Dateien erweitern, nicht ersetzen.
- Sessions haben die Struktur `{ id, day, startTime, endTime, locationId, title, description, … }`. Stelle sicher, dass neue Felder rückwärtskompatibel sind und beim Serialisieren berücksichtigt werden.

## Audio-Features (Meditation & Ambient Soundscape)
- Der Meditation Timer lädt ein Audio-Sample unter `/vibeshack/meditation-timer/singing-bowl.mp3` und besitzt einen Web-Audio-Fallback. Vermeide Änderungen, die dieses Verhalten brechen.
- Die Ambient Soundscape erstellt Tone.js-Instrumente einmalig (über `useRef`). Wenn du neue Instrumente hinzufügst, folge dem bestehenden Muster in `INSTRUMENT_CONFIG` (mit `create`, `trigger`, `defaultPattern`, `defaultVolume`).
- Sämtliche Tone.js-Aufrufe laufen im Browser – stelle sicher, dass asynchrone Startvorgänge (`await Tone.start()`) weiterhin behandelt werden.

## Qualitätssicherung
- Keine automatisierten Tests: Manueller Smoke-Test im Browser vor jedem Commit
- Halte den Build mit `npm run build` sauber. Fehlermeldungen sollten vor dem Commit behoben werden.

## PR-Hinweise
- Commits und PR-Beschreibungen auf Deutsch
- In PR-Beschreibung betroffene Experimente/Seiten für Reviewer erwähnen
