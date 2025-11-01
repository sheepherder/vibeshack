import { useState } from 'react'
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext } from '@dnd-kit/sortable'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { calculateDurationInMinutes, addMinutes, generateTimeSlots } from '../../utils/timeHelpers'
import { exportToCSV, importFromCSV } from '../../utils/csvHelpers'
import { GridCell, SessionEditor, LocationEditor } from './components'

/**
 * Festival Planner - Hauptkomponente
 * Event-Scheduling-Tool mit Drag&Drop, Multi-Day Support und CSV/JSON Import/Export
 */
function FestivalPlanner() {
  // LocalStorage-synchronisierte State mit Custom Hook
  const [sessions, setSessions] = useLocalStorage('festival-sessions-2026', [])
  const [locations, setLocations] = useLocalStorage('festival-locations-2026', [
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
  const [zoomLevel, setZoomLevel] = useState(30) // Zeitintervall in Minuten

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
  const slotHeightPx = 60 // Konstante Slot-Höhe

  const daySessions = sessions.filter(s => s.day === activeDay)
  const activeSession = activeId ? sessions.find(s => s.id === activeId) : null

  // Drag & Drop Handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragOver = (event) => {
    const { over } = event
    setOverId(over ? over.id : null)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && over.data?.current) {
      const { locationId, timeSlot } = over.data.current
      const sessionId = active.id

      setSessions(sessions.map(s => {
        if (s.id === sessionId) {
          const originalDuration = calculateDurationInMinutes(s.startTime, s.endTime)
          const newEndTime = addMinutes(timeSlot, originalDuration)
          return { ...s, locationId, startTime: timeSlot, endTime: newEndTime }
        }
        return s
      }))
    }

    setActiveId(null)
    setOverId(null)
  }

  // Session Handlers
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

  // Location Handlers
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
      setSessions(sessions.filter(s => s.locationId !== id))
    }
  }

  // CSV Import/Export Handlers
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

  // JSON Import/Export Handlers
  const handleImportJSON = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          if (data.sessions && data.locations) {
            setSessions(data.sessions)
            setLocations(data.locations)
          } else if (Array.isArray(data)) {
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

  return (
    <div className="container">
      {/* Header */}
      <div className="festival-header">
        <div>
          <h1 className="page-title">Festival der Zukunft 2026 📅</h1>
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
            <input type="file" accept=".csv" onChange={handleImportCSV} style={{ display: 'none' }} />
          </label>
          <button onClick={handleExportJSON} className="btn-secondary">
            💾 JSON Backup
          </button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            📁 JSON Import
            <input type="file" accept=".json" onChange={handleImportJSON} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* Statistics */}
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

      {/* Day Tabs */}
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

      {/* Locations Bar */}
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
                style={{ width: '180px', cursor: 'pointer' }}
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

      {/* Grid View */}
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

      {/* Modals */}
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
