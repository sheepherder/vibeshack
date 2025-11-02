# VibeShack Agent Guidelines

## Projektüberblick
- Dieses Repo enthält eine Vite-React-App mit mehreren "Experiments" (Taschenrechner, Festival Planner, Meditation Timer, Ambient Soundscape).
- Der Router nutzt einen `HashRouter`, damit die App problemlos auf GitHub Pages (Pfad `/vibeshack/`) ausgeliefert werden kann.
- Build-Metadaten werden in `vite.config.js` beim Build aus Git gelesen und als `__GIT_*__` Konstante injiziert. Diese Platzhalter werden im UI (z. B. in `Home.jsx`) angezeigt und sollten nicht entfernt werden.

## Lokale Commands
- `npm install` zum Installieren der Dependencies.
- `npm run dev` startet den lokalen Entwicklungsserver.
- `npm run build` erstellt den Produktionsbuild. Nutze das vor einem Commit, wenn du Build-Fehler ausschließen willst.
- `npm run preview` startet die Vite-Preview des Produktionsbuilds.

## Code-Style & Struktur
- Schreibe ausschließlich funktionale React-Komponenten mit Hooks (siehe `src/pages/*.jsx`).
- Verwende `import`/`export` im ES-Modul-Stil. Neue Dateien sollten die Endung `.jsx` bzw. `.js` behalten.
- Strings benutzen im gesamten Projekt **einfache Anführungszeichen** und es werden **keine Semikolons** gesetzt. Richte dich beim Format an den bestehenden Dateien (2 Leerzeichen Einrückung).
- Kommentare und UI-Texte sind überwiegend auf Deutsch. Halte dich daran, wenn du neue Texte hinzufügst.
- Für Event-Handler werden im Allgemeinen Inline-Arrow-Funktionen verwendet (`onClick={() => …}`) – übernimm dieses Muster, wenn du neue Interaktionen ergänzt.
- Nutze vorhandene Utility-Funktionen weiter, z. B. `timeHelpers`, `csvHelpers` im Festival Planner, statt ähnliche Logik dupliziert zu schreiben.

## Routing & Navigation
- Neue Seiten müssen sowohl in `src/App.jsx` als auch in der Navigation (`<nav>`) registriert werden. Achte darauf, dass der `HashRouter`-Pfad mit einem führenden `/` arbeitet (z. B. `/neues-tool`).
- Wenn du neue Experimente hinzufügst, erweitere zusätzlich das `experiments`-Array in `Home.jsx`, damit die Startseite einen Link anzeigt.

## Styling
- Globale Styles und Design-Tokens (`--primary`, `--bg`, etc.) liegen in `src/index.css`. Greife auf diese CSS-Variablen zurück, statt neue Farbwerte zu streuen.
- Für seiten- bzw. feature-spezifische Styles existieren eigene CSS-Dateien (`AmbientSoundscape.css`, `MeditationTimer.css`). Lege bei neuen Features ebenfalls eine dedizierte Datei an und importiere sie oben in der jeweiligen Komponente.
- Halte dich bei Layouts an das bestehende Card/Grid-Muster (`.container`, `.page-title`, `.page-subtitle`).

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
- Es existieren aktuell keine automatisierten Tests. Führe vor einem Commit mindestens einen manuellen Smoke-Test der betroffenen Features im Browser aus.
- Halte den Build mit `npm run build` sauber. Fehlermeldungen sollten vor dem Commit behoben werden.

## PR-Hinweise
- Halte deine Commits und PR-Beschreibungen auf Deutsch (analog zur restlichen Dokumentation).
- Erwähne in der PR-Beschreibung, welche Experimente oder Seiten betroffen sind, damit Reviewer schnell gezielt testen können.
