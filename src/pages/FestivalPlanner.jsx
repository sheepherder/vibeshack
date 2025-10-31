import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { useSortable } from '@dnd-kit/sortable'
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

// Zeitslot Generator (7:00 bis 18:00 in 30-Min-Schritten)
const generateTimeSlots = () => {
  const slots = []
  for (let hour = 7; hour <= 18; hour++) {
    slots.push(`${String(hour).padStart(2, '0')}:00`)
    if (hour < 18) slots.push(`${String(hour).padStart(2, '0')}:30`)
  }
  return slots
}

// Grid Cell mit Droppable
function GridCell({ locationId, timeSlot, sessions, onDrop }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell-${locationId}-${timeSlot}`,
    data: { locationId, timeSlot }
  })

  const cellSessions = sessions.filter(s =>
    s.locationId === locationId &&
    s.startTime <= timeSlot &&
    s.endTime > timeSlot
  )

  return (
    <div
      ref={setNodeRef}
      className={`grid-cell ${isOver ? 'grid-cell-over' : ''}`}
      style={{
        minHeight: cellSessions.length > 0 ? 'auto' : '50px',
        backgroundColor: isOver ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
      }}
    >
      {cellSessions.map(session => (
        <SessionBlock key={session.id} session={session} />
      ))}
    </div>
  )
}

// Draggable Session Block
function SessionBlock({ session }) {
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

  // Berechne Höhe basierend auf Dauer
  const duration = calculateDuration(session.startTime, session.endTime)
  const height = duration * 50 // 50px pro 30 Min

  return (
    <div
      ref={setNodeRef}
      style={{...style, minHeight: `${height}px`}}
      {...attributes}
      {...listeners}
      className="session-block"
    >
      <div className="session-block-time">{session.startTime} - {session.endTime}</div>
      <div className="session-block-title">{session.title}</div>
    </div>
  )
}

// Hilfsfunktion: Berechne Dauer in 30-Min-Slots
function calculateDuration(start, end) {
  const [startH, startM] = start.split(':').map(Number)
  const [endH, endM] = end.split(':').map(Number)
  const startMinutes = startH * 60 + startM
  const endMinutes = endH * 60 + endM
  return (endMinutes - startMinutes) / 30
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
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const days = [
    { number: 1, name: 'Tag 1', date: 'Do. 11.06.2026' },
    { number: 2, name: 'Tag 2', date: 'Fr. 12.06.2026' },
    { number: 3, name: 'Tag 3', date: 'Sa. 13.06.2026' },
    { number: 4, name: 'Tag 4', date: 'So. 14.06.2026' }
  ]

  const timeSlots = generateTimeSlots()

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

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && over.data?.current) {
      const { locationId, timeSlot } = over.data.current
      const sessionId = active.id

      setSessions(sessions.map(s =>
        s.id === sessionId
          ? { ...s, locationId, startTime: timeSlot, endTime: addMinutes(timeSlot, 60) }
          : s
      ))
    }

    setActiveId(null)
  }

  const addMinutes = (time, minutes) => {
    const [h, m] = time.split(':').map(Number)
    const totalMinutes = h * 60 + m + minutes
    const newH = Math.floor(totalMinutes / 60)
    const newM = totalMinutes % 60
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
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
          <button onClick={handleExportCSV} className="btn-primary">
            📊 CSV Export (Wix)
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
        <h3>Locations:</h3>
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
            onDragEnd={handleDragEnd}
          >
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
                    />
                  ))}
                </div>
              ))}
            </div>

            <DragOverlay>
              {activeSession ? (
                <div className="session-block dragging">
                  <div className="session-block-time">{activeSession.startTime} - {activeSession.endTime}</div>
                  <div className="session-block-title">{activeSession.title}</div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
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
