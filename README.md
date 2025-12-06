# VibeShack 🎨

Kompakte Sammlung von kreativen Web-Experimenten und interaktiven Demos.

## Live Demo

Die App wird automatisch auf GitHub Pages deployed: [vibeshack](https://sheepherder.github.io/vibeshack/)

## Experimente im Überblick

- **Taschenrechner** – Minimalistischer Rechner mit modernem Layout
- **Festival Planner** – Programmplanung mit Drag & Drop, Sessions-Verwaltung und CSV Import/Export
- **Ambient Music Generator** – Generativer Ambient-Synth mit mehreren Spuren (Deep Bass, Rhythmic Pulse, Cosmic Pad, Melodic Lead, Hi-Hats, Texture) und Auto-Modus
- **Meditation Timer** – Timer für verschiedene Meditationstypen (u. a. Metta/Liebende Güte) inklusive Klangschale

## Schnellstart

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten (HashRouter unter /vibeshack/)
npm run dev

# Produktionsbuild erstellen
npm run build

# Produktionsbuild lokal ansehen
npm run preview
```

## Tech Stack

- React + Vite
- React Router (HashRouter für GitHub Pages)
- GitHub Pages Deployment über GitHub Actions

## Deployment

Jeder Push auf den `main` Branch triggert automatisch den GitHub Pages Deploy.
