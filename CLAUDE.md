# VibeShack - Technische Dokumentation für Claude Code

Diese Dokumentation richtet sich an zukünftige Claude Code Instanzen und beschreibt die Architektur, Code-Struktur und wichtige Patterns des VibeShack-Projekts.

## Projekt-Übersicht

**VibeShack** ist eine Sammlung von interaktiven Web-Experimenten, gebaut mit React und Vite. Das Projekt ist als Single Page Application (SPA) konzipiert und wird auf GitHub Pages gehostet.

- **Live URL**: https://sheepherder.github.io/vibeshack/
- **Repository**: sheepherder/vibeshack
- **Tech Stack**: React 19, Vite 7, React Router 7

## Projektstruktur

```
vibeshack/
├── src/
│   ├── main.jsx                    # Entry Point (ReactDOM.render)
│   ├── App.jsx                     # Root Component mit Navigation + Routing
│   ├── index.css                   # Globale Styles (CSS Variables, Components)
│   │
│   ├── pages/                      # Page Components (Routes)
│   │   ├── Home.jsx                # Landing Page mit Experiment-Cards
│   │   ├── Calculator.jsx          # Taschenrechner
│   │   ├── MeditationTimer.jsx     # Meditations-Timer
│   │   ├── AmbientMusicGenerator.jsx  # Ambient Music Synthesizer
│   │   └── FestivalPlanner/        # Festival Scheduling Tool
│   │       ├── index.jsx           # Main Component
│   │       └── components/         # Sub-Components
│   │           ├── SessionBlock.jsx
│   │           ├── SessionEditor.jsx
│   │           ├── LocationEditor.jsx
│   │           ├── GridCell.jsx
│   │           └── index.js        # Barrel Export
│   │
│   ├── components/                 # Reusable Components
│   │   └── Button/
│   │       ├── Button.jsx
│   │       └── index.js
│   │
│   ├── hooks/                      # Custom React Hooks
│   │   └── useLocalStorage.js      # LocalStorage Synchronization
│   │
│   ├── utils/                      # Utility Functions
│   │   ├── timeHelpers.js          # Zeit-Berechnungen
│   │   └── csvHelpers.js           # CSV Import/Export
│   │
│   └── data/                       # Static Data
│       └── meditationTypes.jsx     # Meditation Types Config
│
├── public/                         # Static Assets
├── package.json
├── vite.config.js                  # Vite Config (mit GitHub Pages Base)
└── README.md                       # User-facing Dokumentation
```

## Kern-Technologien

### Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-router-dom": "^7.9.5",     // Routing
    "@dnd-kit/core": "^6.3.1",        // Drag & Drop (FestivalPlanner)
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "tone": "^15.1.22"                // Web Audio (AmbientMusicGenerator)
  }
}
```

### Routing (HashRouter)

**Wichtig**: Das Projekt verwendet `HashRouter` statt `BrowserRouter`, da es auf GitHub Pages deployed wird und Hash-Routing für SPAs dort notwendig ist.

```jsx
// src/App.jsx
<HashRouter>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/calculator" element={<Calculator />} />
    <Route path="/festival-planner" element={<FestivalPlanner />} />
    <Route path="/ambient-music" element={<AmbientMusicGenerator />} />
    <Route path="/meditation-timer" element={<MeditationTimer />} />
  </Routes>
</HashRouter>
```

URLs haben das Format: `https://sheepherder.github.io/vibeshack/#/festival-planner`

## Design System

### CSS Variables (src/index.css:1-9)

```css
:root {
  --primary: #6366f1;          /* Indigo */
  --primary-dark: #4f46e5;
  --bg: #0f172a;               /* Dark Blue */
  --bg-secondary: #1e293b;
  --text: #f1f5f9;             /* Light Gray */
  --text-secondary: #94a3b8;
  --border: #334155;
}
```

### Button Components

Drei Standard-Button-Klassen:
- `.btn-primary` - Aktions-Buttons (Primary Color)
- `.btn-secondary` - Sekundäre Aktionen (Border Style)
- `.btn-icon` - Icon-Buttons (transparent, hover scale)

## Features / Pages

### 1. Festival Planner

**Pfad**: `src/pages/FestivalPlanner/`
**Route**: `/festival-planner`
**Zweck**: Event-Scheduling-Tool mit Drag & Drop für Festival-Programme

#### Architektur

```
FestivalPlanner (index.jsx)
├── State Management (useState + useLocalStorage)
│   ├── sessions         → 'festival-sessions-2026'
│   ├── locations        → 'festival-locations-2026'
│   ├── activeDay        → Aktueller Tag (1-4)
│   ├── viewMode         → 'grid' | 'list'
│   ├── editingSession   → Session im Edit-Modal
│   └── editingLocation  → Location im Edit-Modal
│
├── Drag & Drop (@dnd-kit)
│   ├── DndContext       → Drag & Drop Provider
│   ├── SortableContext  → Sortable Items (Sessions)
│   └── DragOverlay      → Visual Feedback beim Dragging
│
└── View Modes
    ├── Grid View        → Tabellarische Zeit-/Location-Matrix
    └── List View        → Chronologische Listen-Darstellung
```

#### Datenstruktur

**Session**:
```javascript
{
  id: 'session-123',           // Unique ID
  title: 'Opening Ceremony',   // Titel
  description: '...',           // Optional
  startTime: '10:00',          // HH:MM Format
  endTime: '11:30',            // HH:MM Format
  locationId: 'loc-1',         // Referenz zu Location
  day: 1                       // Tag-Nummer (1-4)
}
```

**Location**:
```javascript
{
  id: 'loc-1',
  name: 'Hauptbühne',
  color: '#6366f1'  // Hex Color für visuelle Unterscheidung
}
```

#### Wichtige Komponenten

**GridCell** (`components/GridCell.jsx`):
- Droppable Area für Drag & Drop
- Zeigt Sessions an, die in diesem Zeit-/Location-Slot starten
- Berechnet Session-Höhe basierend auf Dauer und Zoom-Level

**SessionBlock** (`components/SessionBlock.jsx`):
- Draggable Session-Karte
- Visuell mit Zeit, Titel, Hover-Effekten
- Bearbeiten/Löschen-Buttons

**SessionEditor** (`components/SessionEditor.jsx`):
- Modal für Session-Erstellung/Bearbeitung
- Formular mit Validierung
- Zeit-Picker, Location-Select, Day-Select

**LocationEditor** (`components/LocationEditor.jsx`):
- Modal für Location-Erstellung/Bearbeitung
- Name + Color Picker

#### View Modes

**Grid View** (src/pages/FestivalPlanner/index.jsx:279-345):
- Tabellarische Darstellung: Zeit (Zeilen) × Locations (Spalten)
- Drag & Drop zwischen Zellen
- Zoom-Levels: 5min, 15min, 30min, 1h, 2h
- Sessions werden dynamisch positioniert und skaliert

**List View** (src/pages/FestivalPlanner/index.jsx:347-428):
- Chronologische Liste aller Sessions des aktiven Tags
- Sortiert nach Startzeit
- Zeigt: Zeit, Dauer, Titel, Beschreibung, Location-Badge
- Kein Drag & Drop, nur Bearbeiten/Löschen
- Empty State wenn keine Sessions vorhanden

#### CSV/JSON Import/Export

- **CSV Export**: Sessions als CSV (Zeit, Titel, Location, Tag)
- **CSV Import**: Sessions aus CSV importieren (nutzt `csvHelpers.js`)
- **JSON Export**: Komplettes Backup (Sessions + Locations)
- **JSON Import**: Restore aus Backup

### 2. Ambient Music Generator

**Pfad**: `src/pages/AmbientMusicGenerator.jsx`
**Route**: `/ambient-music`
**Library**: Tone.js (Web Audio)

#### Spuren (Tracks)

6 unabhängige Audio-Spuren:
1. **Deep Bass** - Sub-Bass (40-80 Hz)
2. **Rhythmic Pulse** - Rhythmischer Puls (100-200 Hz)
3. **Cosmic Pad** - Ambient Pad (200-400 Hz)
4. **Melodic Lead** - Melodische Lead-Stimme (400-800 Hz)
5. **Hi-Hats** - Perkussive Hi-Hats
6. **Texture** - Atmosphärische Textur

#### Architektur

- Tone.js Synthesizer (Synth, FMSynth, MetalSynth)
- Auto-Mode: Zufällige Pattern-Generierung
- Reverb/Delay Effects per Track
- Unabhängige Volume-Controls

### 3. Meditation Timer

**Pfad**: `src/pages/MeditationTimer.jsx`
**Route**: `/meditation-timer`

#### Features

- Countdown-Timer mit Play/Pause/Reset
- Voreingestellte Meditationstypen (aus `src/data/meditationTypes.jsx`)
- Custom-Dauer-Eingabe
- Klangschalen-Sound bei Timer-Ende (Web Audio API)
- Persistenz der Auswahl in LocalStorage

#### Meditation Types

```javascript
// src/data/meditationTypes.jsx
export const meditationTypes = [
  {
    name: 'Metta / Liebende Güte',
    duration: 20,
    description: '...',
    instructions: ['Schritt 1...', 'Schritt 2...']
  },
  // ...
]
```

### 4. Calculator

**Pfad**: `src/pages/Calculator.jsx`
**Route**: `/calculator`

Einfacher Taschenrechner mit:
- Grundrechenarten (+, -, ×, ÷)
- Prozentrechnungen
- Klammern
- Clear/Delete

## Utility Functions

### timeHelpers.js

Wiederverwendbare Zeit-Hilfsfunktionen für alle Features:

```javascript
timeToMinutes(time)                    // "10:30" → 630
minutesToTime(minutes)                  // 630 → "10:30"
calculateDurationInMinutes(start, end) // "10:00", "11:30" → 90
addMinutes(time, minutes)              // "10:30", 45 → "11:15"
formatTime(seconds)                    // 90 → "01:30"
generateTimeSlots(interval, start, end) // Array von Zeit-Slots
calculateEndTime(start, duration)      // Endzeit berechnen
```

### useLocalStorage Hook

**Pfad**: `src/hooks/useLocalStorage.js`

Custom Hook für automatische LocalStorage-Synchronisation:

```javascript
const [value, setValue] = useLocalStorage('key', initialValue)
```

- Lädt initial aus LocalStorage
- Speichert automatisch bei Änderungen (useEffect)
- JSON Serialization/Deserialization
- Error Handling

**Verwendung im Festival Planner**:
```javascript
const [sessions, setSessions] = useLocalStorage('festival-sessions-2026', [])
const [locations, setLocations] = useLocalStorage('festival-locations-2026', [/* defaults */])
```

## Code-Patterns & Conventions

### 1. Component Structure

Alle Page-Components folgen diesem Pattern:

```jsx
import { useState } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

function MyComponent() {
  // 1. State Declarations
  const [value, setValue] = useState(initialValue)

  // 2. Event Handlers
  const handleSomething = () => { /* ... */ }

  // 3. Render
  return (
    <div className="container">
      {/* ... */}
    </div>
  )
}

export default MyComponent
```

### 2. Styling

- **Global Styles**: `src/index.css` (Component-Klassen am Ende)
- **Page-Specific CSS**: Separate `.css` Files (z.B. `MeditationTimer.css`)
- **Inline Styles**: Nur für dynamische Werte (Colors, Sizing)

### 3. Modal Pattern

Modals werden conditional gerendert:

```jsx
{(isCreating || isEditing) && (
  <div className="modal-overlay">
    <div className="modal-content">
      {/* Form */}
    </div>
  </div>
)}
```

### 4. LocalStorage Keys

Prefix-Pattern für bessere Organisation:
- `festival-sessions-2026` (Jahr im Key für Versioning)
- `festival-locations-2026`
- `meditation-settings`

### 5. ID Generation

```javascript
const id = `prefix-${Date.now()}`  // Einfache, ausreichend eindeutige IDs
```

## Deployment

### GitHub Pages

- **Branch**: `main` (auto-deploy via GitHub Actions)
- **Base Path**: `/vibeshack/` (siehe `vite.config.js`)
- **Routing**: HashRouter (wegen SPA-Kompatibilität)

### Vite Config

```javascript
// vite.config.js
export default defineConfig({
  base: '/vibeshack/',  // ← Wichtig für GitHub Pages!
  plugins: [react()]
})
```

## Häufige Aufgaben

### Neues Feature hinzufügen

1. **Page erstellen**: `src/pages/NewFeature.jsx`
2. **Route registrieren**: `src/App.jsx` - Route hinzufügen
3. **Navigation**: Link in `<Navigation>` Component
4. **Styles**: CSS-Klassen in `src/index.css` oder separate CSS-Datei
5. **Home-Card**: Card in `src/pages/Home.jsx` hinzufügen

### Festival Planner erweitern

**Session-Schema erweitern**:
1. Neue Felder im Session-Objekt hinzufügen
2. `SessionEditor.jsx` - Formular erweitern
3. `SessionBlock.jsx` oder List View - Anzeige anpassen

**Neue View Mode hinzufügen**:
1. State in `index.jsx` erweitern: `viewMode: 'grid' | 'list' | 'new'`
2. Toggle-Button anpassen
3. Neue View-Logic in JSX implementieren (conditional rendering)

### Bug-Fixing Checklist

1. **LocalStorage löschen**: Bei State-Schema-Änderungen
   ```javascript
   localStorage.removeItem('festival-sessions-2026')
   ```

2. **DnD Issues**:
   - `activeId` und `overId` State prüfen
   - Collision Detection Algorithm anpassen
   - Drop-Handler-Logic debuggen

3. **Zeit-Berechnungen**:
   - Immer `timeHelpers.js` verwenden (keine manuelle String-Manipulation!)
   - Edge Cases: Mitternacht-Überschreitung, negative Dauern

## Testing Tipps

### Manual Testing

**Festival Planner**:
- [ ] Session erstellen → LocalStorage Check
- [ ] Drag & Drop zwischen Locations
- [ ] Drag & Drop über Zeitgrenzen
- [ ] CSV Export → Re-Import
- [ ] List View ↔ Grid View Toggle
- [ ] Multi-Day Navigation

**Ambient Music**:
- [ ] Individual Track Play/Pause
- [ ] Auto Mode
- [ ] Volume Controls
- [ ] Browser Auto-Play Policy (User Interaction erforderlich)

**Meditation Timer**:
- [ ] Countdown funktioniert
- [ ] Sound Play bei Ende
- [ ] Pause/Resume
- [ ] Custom Duration

## Bekannte Limitierungen

1. **Festival Planner**:
   - Keine Überschneidungs-Prüfung (Sessions können sich überlappen)
   - Keine Undo/Redo
   - Keine Multi-Location-Sessions

2. **Ambient Music**:
   - Browser Auto-Play Policy: User muss interagieren
   - Keine Preset-Speicherung
   - Keine Audio-Export-Funktion

3. **General**:
   - Keine Backend-Integration (alles Client-Side)
   - Keine User-Authentication
   - Keine Sharing-Funktionalität

## Weiterentwicklungs-Ideen

### Festival Planner
- [ ] Conflict Detection bei Sessions
- [ ] Undo/Redo Stack
- [ ] Session-Duplikation
- [ ] Bulk-Edit für mehrere Sessions
- [ ] Kalender-Ansicht (Monthly/Weekly)
- [ ] Export als iCal/ICS
- [ ] Multi-User Collaboration (Backend)

### Ambient Music
- [ ] Preset Save/Load
- [ ] MIDI Controller Support
- [ ] Recording/Export als WAV/MP3
- [ ] Visualization (Canvas/WebGL)

### Meditation Timer
- [ ] Guided Meditation Audio
- [ ] Meditation History/Stats
- [ ] Interval Bells (z.B. alle 5 Minuten)

## Kontakt & Contribution

- **Repository**: sheepherder/vibeshack
- **Branch Strategy**: Feature-Branches → `main` (mit PR)
- **Claude Code Branch Pattern**: `claude/*` (automatisch generiert)

---

**Letztes Update**: 2025-11-01
**Dokumentiert von**: Claude Code

Diese Dokumentation sollte regelmäßig aktualisiert werden, wenn neue Features hinzukommen oder sich die Architektur ändert.
