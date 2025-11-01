import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// CSV Export Funktion
const exportToCSV = (sessions, locations) => {
  const headers = ['Name', 'Event Days', 'Start Time', 'End Time', 'Description', 'Format', 'Location', 'Speakers', 'Language', 'Tracks']
  const rows = sessions.map(session => {
    const location = locations.find(l => l.id === session.locationId)
    return [
      session.title,
      session.day,
      session.startTime,
      session.endTime,
      session.description || '',
      session.format || '',
      location?.name || '',
      session.speakers || '',
      session.language || 'DE',
      session.tracks || ''
    ]
  })

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n')

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `festival-programm-2026-${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

// CSV Import Funktion
const importFromCSV = (csvText, locations) => {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())

  const sessions = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue

    // Einfacher CSV Parser (rudimentär, könnte verbessert werden)
    const values = lines[i].match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || []
    const row = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"').trim())

    if (row.length < 3) continue

    const nameIdx = headers.findIndex(h => h.toLowerCase().includes('name'))
    const startIdx = headers.findIndex(h => h.toLowerCase().includes('start'))
    const endIdx = headers.findIndex(h => h.toLowerCase().includes('end'))
    const locationIdx = headers.findIndex(h => h.toLowerCase().includes('location'))

    const locationName = row[locationIdx] || ''
    const location = locations.find(l => l.name.toLowerCase() === locationName.toLowerCase())

    sessions.push({
      id: `session-${Date.now()}-${i}`,
      title: row[nameIdx] || `Session ${i}`,
      startTime: row[startIdx]?.substring(11, 16) || '10:00',
      endTime: row[endIdx]?.substring(11, 16) || '11:00',
      locationId: location?.id || locations[0]?.id,
      day: 1,
      description: '',
      format: '',
      speakers: '',
      language: 'DE'
    })
  }

  return sessions
}

// Zeitslot Generator mit konfigurierbarem Intervall
const generateTimeSlots = (intervalMinutes = 30) => {
  const slots = []
  const startHour = 7
  const endHour = 18
  const totalMinutes = (endHour - startHour) * 60

  for (let minutes = 0; minutes <= totalMinutes; minutes += intervalMinutes) {
    const hour = startHour + Math.floor(minutes / 60)
    const minute = minutes % 60
    if (hour <= endHour) {
      slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`)
    }
  }
  return slots
}

// Grid Cell mit Droppable - Zeigt Sessions, die im Slot-Zeitfenster beginnen
function GridCell({ locationId, timeSlot, sessions, onEdit, onDelete, slotHeightPx, activeSession, overId, timeSlots, zoomLevel }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${locationId}-${timeSlot}`,
    data: { locationId, timeSlot }
  })

  // Sessions anzeigen, die im Zeitfenster dieses Slots beginnen
  // Z.B. bei 30-Min-Zoom zeigt Slot "10:00" alle Sessions zwischen 10:00 und 10:29:59
  const slotStartMinutes = timeToMinutes(timeSlot)
  const slotEndMinutes = slotStartMinutes + zoomLevel

  const cellSessions = sessions.filter(s => {
    if (s.locationId !== locationId) return false
    const sessionStartMinutes = timeToMinutes(s.startTime)
    return sessionStartMinutes >= slotStartMinutes && sessionStartMinutes < slotEndMinutes
  })

  // Berechne Spalten für parallele Events
  // Finde alle Sessions, die sich zeitlich überschneiden
  const sessionsWithColumns = cellSessions.map(session => {
    const sessionStart = timeToMinutes(session.startTime)
    const sessionEnd = timeToMinutes(session.endTime)

    // Finde überlappende Sessions an dieser Location
    const overlapping = sessions.filter(s => {
      if (s.locationId !== locationId) return false
      const sStart = timeToMinutes(s.startTime)
      const sEnd = timeToMinutes(s.endTime)
      // Prüfe auf zeitliche Überschneidung
      return sStart < sessionEnd && sEnd > sessionStart
    })

    // Sortiere nach Startzeit, dann nach ID für konsistente Reihenfolge
    overlapping.sort((a, b) => {
      const aStart = timeToMinutes(a.startTime)
      const bStart = timeToMinutes(b.startTime)
      if (aStart !== bStart) return aStart - bStart
      return a.id.localeCompare(b.id)
    })

    const totalColumns = overlapping.length
    const columnIndex = overlapping.findIndex(s => s.id === session.id)

    return { session, columnIndex, totalColumns }
  })

  // Prüfen, ob diese Zelle gehighlightet werden sollte
  let shouldHighlight = isOver
  if (activeSession && overId) {
    // Extrahiere locationId und timeSlot aus overId
    const overCellMatch = overId.match(/^cell-(.+)-(\d{2}:\d{2})$/)
    if (overCellMatch) {
      const [, overLocationId, overTimeSlot] = overCellMatch

      // Highlight nur wenn gleiche Location
      if (overLocationId === locationId) {
        // Berechne ob diese Zelle innerhalb der Event-Dauer liegt
        const durationMinutes = calculateDurationInMinutes(activeSession.startTime, activeSession.endTime)
        const overTimeMinutes = timeToMinutes(overTimeSlot)
        const thisTimeMinutes = timeToMinutes(timeSlot)
        const endTimeMinutes = overTimeMinutes + durationMinutes

        if (thisTimeMinutes >= overTimeMinutes && thisTimeMinutes < endTimeMinutes) {
          shouldHighlight = true
        }
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={`grid-cell ${shouldHighlight ? 'grid-cell-over' : ''}`}
      style={{
        height: `${slotHeightPx}px`,
        minHeight: `${slotHeightPx}px`,
        backgroundColor: shouldHighlight ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
        position: 'relative'
      }}
    >
      {sessionsWithColumns.map(({ session, columnIndex, totalColumns }) => (
        <SessionBlock
          key={session.id}
          session={session}
          onEdit={onEdit}
          onDelete={onDelete}
          slotHeightPx={slotHeightPx}
          zoomLevel={zoomLevel}
          columnIndex={columnIndex}
          totalColumns={totalColumns}
          slotStartTime={timeSlot}
        />
      ))}
    </div>
  )
}

// Hilfsfunktion: Konvertiere Zeit zu Minuten seit Mitternacht
function timeToMinutes(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

// Draggable Session Block mit variabler Höhe basierend auf Dauer
function SessionBlock({ session, onEdit, onDelete, slotHeightPx, zoomLevel, columnIndex = 0, totalColumns = 1, slotStartTime }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: session.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Berechne Höhe basierend auf Dauer in Minuten und aktuellem Zoom-Level
  const durationMinutes = calculateDurationInMinutes(session.startTime, session.endTime)
  const height = (durationMinutes / zoomLevel) * slotHeightPx // Höhe = Anzahl Slots * Slot-Höhe

  // Berechne horizontale Position für parallele Events
  const widthPercent = 100 / totalColumns
  const leftPercent = widthPercent * columnIndex

  // Berechne vertikalen Offset innerhalb des Slots
  const slotStartMinutes = timeToMinutes(slotStartTime)
  const sessionStartMinutes = timeToMinutes(session.startTime)
  const offsetMinutes = sessionStartMinutes - slotStartMinutes
  const topOffset = (offsetMinutes / zoomLevel) * slotHeightPx

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        height: `${height}px`,
        minHeight: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
        position: 'absolute',
        top: `${topOffset}px`,
        left: `${leftPercent}%`,
        width: `${widthPercent}%`,
        zIndex: 5
      }}
      className="session-block"
      onDoubleClick={(e) => {
        e.stopPropagation();
        onEdit(session);
      }}
    >
      <div
        {...attributes}
        {...listeners}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          flex: 1,
          paddingRight: '60px',
          position: 'relative'
        }}
      >
        <div className="session-block-time">{session.startTime} - {session.endTime}</div>
        <div className="session-block-title">{session.title}</div>
      </div>
      <div className="session-actions" style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '4px', zIndex: 10 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(session); }}
          className="btn-icon"
          style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          ✏️
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
          className="btn-icon"
          style={{ fontSize: '0.8rem', padding: '4px 8px', background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          🗑️
        </button>
      </div>
    </div>
  )
}

// Hilfsfunktion: Berechne Dauer in Minuten
function calculateDurationInMinutes(start, end) {
  if (!start || !end) return 60 // Fallback: 60 Minuten
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return endMinutes - startMinutes
}

// Hilfsfunktion: Berechne Dauer in 30-Min-Slots
function calculateDuration(start, end) {
  if (!start || !end) return 2 // Fallback: 2 Slots = 1 Stunde
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return (endMinutes - startMinutes) / 30
}

// Session Editor Modal
function SessionEditor({ session, onSave, onCancel, day, locations }) {
  // Berechne initiale Dauer aus bestehender Session
  const initialDuration = session
    ? calculateDurationInMinutes(session.startTime, session.endTime)
    : 60

  const [formData, setFormData] = useState(
    session || {
      day: day,
      startTime: '10:00',
      title: '',
      description: '',
      locationId: locations[0]?.id || '',
      speakers: '',
      format: '',
      language: 'DE',
      tracks: ''
    }
  )

  const [duration, setDuration] = useState(initialDuration)

  // Generiere Zeitoptionen in 5-Minuten-Schritten von 7:00 bis 18:00
  const timeOptions = []
  for (let hour = 7; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      if (hour === 18 && minute > 0) break // Stopp bei 18:00
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      timeOptions.push(time)
    }
  }

  // Dauer-Optionen
  const durationOptions = [
    { value: 5, label: '5 Minuten' },
    { value: 10, label: '10 Minuten' },
    { value: 15, label: '15 Minuten' },
    { value: 20, label: '20 Minuten' },
    { value: 30, label: '30 Minuten' },
    { value: 45, label: '45 Minuten' },
    { value: 60, label: '1 Stunde' },
    { value: 75, label: '1h 15min' },
    { value: 90, label: '1h 30min' },
    { value: 105, label: '1h 45min' },
    { value: 120, label: '2 Stunden' },
    { value: 150, label: '2h 30min' },
    { value: 180, label: '3 Stunden' },
    { value: 240, label: '4 Stunden' },
  ]

  // Berechne Endzeit aus Startzeit und Dauer
  const calculateEndTime = (startTime, durationMinutes) => {
    const [h, m] = startTime.split(':').map(Number)
    const totalMinutes = h * 60 + m + durationMinutes
    const endH = Math.floor(totalMinutes / 60)
    const endM = totalMinutes % 60
    return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const endTime = calculateEndTime(formData.startTime, duration)
    onSave({
      ...formData,
      endTime,
      id: session?.id || `session-${Date.now()}`
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{session ? 'Session bearbeiten' : 'Neue Session erstellen'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Titel *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="z.B. Keynote: Die Zukunft der KI"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Startzeit *</label>
              <select
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                style={{ fontSize: '0.95rem' }}
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time} Uhr</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Dauer *</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                required
                style={{ fontSize: '0.95rem' }}
              >
                {durationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                Endet um: {calculateEndTime(formData.startTime, duration)} Uhr
              </div>
            </div>
          </div>

          <div className="form-group">
            <label>Location *</label>
            <select
              value={formData.locationId}
              onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
              required
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Speaker</label>
            <input
              type="text"
              value={formData.speakers}
              onChange={(e) => setFormData({ ...formData, speakers: e.target.value })}
              placeholder="z.B. Dr. Anna Schmidt"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Format</label>
              <select
                value={formData.format}
                onChange={(e) => setFormData({ ...formData, format: e.target.value })}
              >
                <option value="">Kein Format</option>
                <option value="Keynote">Keynote</option>
                <option value="Workshop">Workshop</option>
                <option value="Panel">Panel</option>
                <option value="Performance">Performance</option>
                <option value="Networking">Networking</option>
                <option value="Pause">Pause</option>
              </select>
            </div>
            <div className="form-group">
              <label>Sprache</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              >
                <option value="DE">Deutsch</option>
                <option value="EN">English</option>
                <option value="DE/EN">DE/EN</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
              placeholder="Kurze Beschreibung der Session..."
            />
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Location Editor Modal
function LocationEditor({ location, onSave, onCancel }) {
  const [name, setName] = useState(location?.name || '')
  const [color, setColor] = useState(location?.color || '#6366f1')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      id: location?.id || `loc-${Date.now()}`,
      name,
      color
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{location ? 'Location bearbeiten' : 'Neue Location'}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="z.B. Hauptbühne, Workshop-Raum 1"
            />
          </div>
          <div className="form-group">
            <label>Farbe</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onCancel} className="btn-secondary">
              Abbrechen
            </button>
            <button type="submit" className="btn-primary">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Hauptkomponente
function FestivalPlanner() {
  const [sessions, setSessions] = useState([])
  const [locations, setLocations] = useState([
    { id: 'loc-1', name: 'Hauptbühne', color: '#6366f1' },
    { id: 'loc-2', name: 'Workshop-Raum 1', color: '#10b981' },
    { id: 'loc-3', name: 'Experience Area', color: '#f59e0b' },
  ])
  const [activeDay, setActiveDay] = useState(1)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [editingLocation, setEditingLocation] = useState(null)
  const [isCreatingLocation, setIsCreatingLocation] = useState(false)
  const [editingSession, setEditingSession] = useState(null)
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  const [activeId, setActiveId] = useState(null)
  const [overId, setOverId] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(30) // Zeitintervall in Minuten: 15, 30, 60

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  )

  const days = [
    { number: 1, name: 'Tag 1', date: 'Do. 11.06.2026' },
    { number: 2, name: 'Tag 2', date: 'Fr. 12.06.2026' },
    { number: 3, name: 'Tag 3', date: 'Sa. 13.06.2026' },
    { number: 4, name: 'Tag 4', date: 'So. 14.06.2026' }
  ]

  const timeSlots = generateTimeSlots(zoomLevel)
  // Konstante Slot-Höhe unabhängig vom Zoom-Level
  const slotHeightPx = 60

  // LocalStorage laden
  useEffect(() => {
    const savedSessions = localStorage.getItem('festival-sessions-2026')
    const savedLocations = localStorage.getItem('festival-locations-2026')
    if (savedSessions) setSessions(JSON.parse(savedSessions))
    if (savedLocations) setLocations(JSON.parse(savedLocations))
  }, [])

  // LocalStorage speichern
  useEffect(() => {
    localStorage.setItem('festival-sessions-2026', JSON.stringify(sessions))
    localStorage.setItem('festival-locations-2026', JSON.stringify(locations))
  }, [sessions, locations])

  const daySessions = sessions.filter(s => s.day === activeDay)

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event) => {
    const { over } = event
    if (over) {
      setOverId(over.id)
    } else {
      setOverId(null)
    }
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && over.data?.current) {
      const { locationId, timeSlot } = over.data.current
      const sessionId = active.id

      setSessions(sessions.map(s => {
        if (s.id === sessionId) {
          // Berechne die ursprüngliche Dauer der Session
          const originalDuration = calculateDurationInMinutes(s.startTime, s.endTime)
          // Wende diese Dauer auf die neue Startzeit an
          const newEndTime = addMinutes(timeSlot, originalDuration)
          return { ...s, locationId, startTime: timeSlot, endTime: newEndTime }
        }
        return s
      }))
    }

    setActiveId(null)
    setOverId(null)
  }

  const addMinutes = (time, minutes) => {
    const [h, m] = time.split(':').map(Number)
    const totalMinutes = h * 60 + m + minutes
    const newH = Math.floor(totalMinutes / 60)
    const newM = totalMinutes % 60
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
  }

  const handleSaveSession = (sessionData) => {
    if (editingSession) {
      setSessions(sessions.map(s => s.id === sessionData.id ? sessionData : s))
      setEditingSession(null)
    } else {
      setSessions([...sessions, sessionData])
      setIsCreatingSession(false)
    }
  }

  const handleDeleteSession = (id) => {
    if (confirm('Session wirklich löschen?')) {
      setSessions(sessions.filter(s => s.id !== id))
    }
  }

  const handleSaveLocation = (locationData) => {
    if (editingLocation) {
      setLocations(locations.map(l => l.id === locationData.id ? locationData : l))
      setEditingLocation(null)
    } else {
      setLocations([...locations, locationData])
      setIsCreatingLocation(false)
    }
  }

  const handleDeleteLocation = (id) => {
    if (confirm('Location wirklich löschen?')) {
      setLocations(locations.filter(l => l.id !== id))
      // Entferne Sessions dieser Location
      setSessions(sessions.filter(s => s.locationId !== id))
    }
  }

  const handleExportCSV = () => {
    exportToCSV(sessions, locations)
  }

  const handleImportCSV = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const importedSessions = importFromCSV(event.target.result, locations)
          setSessions([...sessions, ...importedSessions])
          alert(`${importedSessions.length} Sessions erfolgreich importiert!`)
        } catch (error) {
          alert('Fehler beim CSV-Import: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleImportJSON = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (data.sessions && data.locations) {
            // Neues Format mit sessions und locations
            setSessions(data.sessions)
            setLocations(data.locations)
          } else if (Array.isArray(data)) {
            // Altes Format - nur Sessions
            setSessions(data)
          }
          alert('Daten erfolgreich importiert!')
        } catch (error) {
          alert('Fehler beim JSON-Import: ' + error.message)
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExportJSON = () => {
    const data = { sessions, locations }
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `festival-backup-${new Date().toISOString().split('T')[0]}.json`
    link.click()
  }

  const activeSession = activeId ? sessions.find(s => s.id === activeId) : null

  return (
    <div className="container">
      <div className="festival-header">
        <div>
          <h1 className="page-title">Festival der Zukunft 2026 📅</h1>
          <p className="page-subtitle">
            Grid-Programmplanung - Locations horizontal, Zeit vertikal
          </p>
        </div>
        <div className="festival-actions">
          <button onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')} className="btn-secondary">
            {viewMode === 'grid' ? '📋 Listen-Ansicht' : '📊 Grid-Ansicht'}
          </button>
          <button onClick={handleExportCSV} className="btn-secondary">
            📊 CSV Export
          </button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            📁 CSV Import
            <input
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              style={{ display: 'none' }}
            />
          </label>
          <button onClick={handleExportJSON} className="btn-secondary">
            💾 JSON Backup
          </button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            📁 JSON Import
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      </div>

      <div className="festival-stats">
        <div className="stat-card">
          <div className="stat-number">{sessions.length}</div>
          <div className="stat-label">Gesamt Sessions</div>
        </div>
        {days.map(day => (
          <div key={day.number} className="stat-card">
            <div className="stat-number">
              {sessions.filter(s => s.day === day.number).length}
            </div>
            <div className="stat-label">{day.name}</div>
          </div>
        ))}
      </div>

      <div className="festival-days-tabs">
        {days.map(day => (
          <button
            key={day.number}
            className={`day-tab ${activeDay === day.number ? 'active' : ''}`}
            onClick={() => setActiveDay(day.number)}
          >
            <div className="day-tab-name">{day.name}</div>
            <div className="day-tab-date">{day.date}</div>
          </button>
        ))}
      </div>

      <div className="festival-locations-bar">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Locations:</h3>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Zoom:</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '180px' }}>
              <input
                type="range"
                min="0"
                max="4"
                step="1"
                value={[5, 15, 30, 60, 120].indexOf(zoomLevel)}
                onChange={(e) => {
                  const levels = [5, 15, 30, 60, 120]
                  setZoomLevel(levels[parseInt(e.target.value)])
                }}
                style={{
                  width: '180px',
                  cursor: 'pointer'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '180px', fontSize: '0.7rem', color: '#666', marginTop: '2px' }}>
                <span>5min</span>
                <span>15min</span>
                <span>30min</span>
                <span>1h</span>
                <span>2h</span>
              </div>
            </div>
            <button onClick={() => setIsCreatingSession(true)} className="btn-primary" style={{ marginLeft: '1rem' }}>
              ➕ Session hinzufügen
            </button>
          </div>
        </div>
        <div className="locations-list">
          {locations.map(loc => (
            <div key={loc.id} className="location-tag" style={{ borderLeft: `4px solid ${loc.color}` }}>
              {loc.name}
              <button onClick={() => setEditingLocation(loc)} className="btn-icon">✏️</button>
              <button onClick={() => handleDeleteLocation(loc.id)} className="btn-icon">🗑️</button>
            </div>
          ))}
          <button onClick={() => setIsCreatingLocation(true)} className="btn-primary btn-small">
            ➕ Neue Location
          </button>
        </div>
      </div>

      {viewMode === 'grid' && (
        <div className="festival-grid-container">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={daySessions.map(s => s.id)}>
              <div className="festival-grid">
                <div className="grid-header">
                  <div className="grid-time-header">Zeit</div>
                  {locations.map(loc => (
                    <div key={loc.id} className="grid-location-header" style={{ borderBottom: `3px solid ${loc.color}` }}>
                      {loc.name}
                    </div>
                  ))}
                </div>

                {timeSlots.map(slot => (
                  <div key={slot} className="grid-row">
                    <div className="grid-time-cell">{slot}</div>
                    {locations.map(loc => (
                      <GridCell
                        key={`${loc.id}-${slot}`}
                        locationId={loc.id}
                        timeSlot={slot}
                        sessions={daySessions}
                        onEdit={setEditingSession}
                        onDelete={handleDeleteSession}
                        slotHeightPx={slotHeightPx}
                        activeSession={activeSession}
                        overId={overId}
                        timeSlots={timeSlots}
                        zoomLevel={zoomLevel}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeSession ? (() => {
                const durationMinutes = calculateDurationInMinutes(activeSession.startTime, activeSession.endTime)
                const height = (durationMinutes / zoomLevel) * slotHeightPx
                return (
                  <div
                    className="session-block dragging"
                    style={{
                      height: `${height}px`,
                      minHeight: `${height}px`,
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <div className="session-block-time">{activeSession.startTime} - {activeSession.endTime}</div>
                    <div className="session-block-title">{activeSession.title}</div>
                  </div>
                )
              })() : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {(isCreatingSession || editingSession) && (
        <SessionEditor
          session={editingSession}
          day={activeDay}
          locations={locations}
          onSave={handleSaveSession}
          onCancel={() => {
            setIsCreatingSession(false)
            setEditingSession(null)
          }}
        />
      )}

      {(isCreatingLocation || editingLocation) && (
        <LocationEditor
          location={editingLocation}
          onSave={handleSaveLocation}
          onCancel={() => {
            setIsCreatingLocation(false)
            setEditingLocation(null)
          }}
        />
      )}
    </div>
  )
}

export default FestivalPlanner
