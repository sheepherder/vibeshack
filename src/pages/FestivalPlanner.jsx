import { useState, useEffect } from 'react'
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// Hilfsfunktion für CSV Export
const exportToCSV = (sessions) => {
  const headers = ['Tag', 'Startzeit', 'Endzeit', 'Titel', 'Beschreibung', 'Ort', 'Speaker', 'Kategorie']
  const rows = sessions.map(session => [
    session.day,
    session.startTime,
    session.endTime,
    session.title,
    session.description || '',
    session.location || '',
    session.speaker || '',
    session.category || ''
  ])

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

// Session Karte Komponente mit Drag & Drop
function SessionCard({ session, onEdit, onDelete }) {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="session-card"
    >
      <div className="session-drag-handle" {...attributes} {...listeners}>
        ⋮⋮
      </div>
      <div className="session-content">
        <div className="session-time">
          {session.startTime} - {session.endTime}
        </div>
        <div className="session-title">{session.title}</div>
        {session.speaker && <div className="session-speaker">🎤 {session.speaker}</div>}
        {session.location && <div className="session-location">📍 {session.location}</div>}
        {session.category && <div className="session-category">{session.category}</div>}
      </div>
      <div className="session-actions">
        <button onClick={() => onEdit(session)} className="btn-icon" title="Bearbeiten">
          ✏️
        </button>
        <button onClick={() => onDelete(session.id)} className="btn-icon" title="Löschen">
          🗑️
        </button>
      </div>
    </div>
  )
}

// Session Editor Modal
function SessionEditor({ session, onSave, onCancel, day }) {
  const [formData, setFormData] = useState(
    session || {
      day: day,
      startTime: '10:00',
      endTime: '11:00',
      title: '',
      description: '',
      location: '',
      speaker: '',
      category: ''
    }
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...formData,
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
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Endzeit *</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Speaker</label>
            <input
              type="text"
              value={formData.speaker}
              onChange={(e) => setFormData({ ...formData, speaker: e.target.value })}
              placeholder="z.B. Dr. Anna Schmidt"
            />
          </div>

          <div className="form-group">
            <label>Ort</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="z.B. Hauptbühne, Workshop-Raum 1"
            />
          </div>

          <div className="form-group">
            <label>Kategorie</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="">Keine Kategorie</option>
              <option value="Keynote">Keynote</option>
              <option value="Workshop">Workshop</option>
              <option value="Panel">Panel</option>
              <option value="Performance">Performance</option>
              <option value="Networking">Networking</option>
              <option value="Pause">Pause</option>
            </select>
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

// Hauptkomponente
function FestivalPlanner() {
  const [sessions, setSessions] = useState([])
  const [activeDay, setActiveDay] = useState(1)
  const [editingSession, setEditingSession] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
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

  // LocalStorage laden
  useEffect(() => {
    const saved = localStorage.getItem('festival-sessions-2026')
    if (saved) {
      setSessions(JSON.parse(saved))
    }
  }, [])

  // LocalStorage speichern
  useEffect(() => {
    localStorage.setItem('festival-sessions-2026', JSON.stringify(sessions))
  }, [sessions])

  const daySessions = sessions
    .filter(s => s.day === activeDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const handleDragStart = (event) => {
    setActiveId(event.active.id)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSessions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)

        const newItems = [...items]
        const [movedItem] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, movedItem)

        return newItems
      })
    }

    setActiveId(null)
  }

  const handleSaveSession = (sessionData) => {
    if (editingSession) {
      setSessions(sessions.map(s => s.id === sessionData.id ? sessionData : s))
      setEditingSession(null)
    } else {
      setSessions([...sessions, sessionData])
      setIsCreating(false)
    }
  }

  const handleDeleteSession = (id) => {
    if (confirm('Session wirklich löschen?')) {
      setSessions(sessions.filter(s => s.id !== id))
    }
  }

  const handleExportCSV = () => {
    exportToCSV(sessions)
  }

  const handleImportJSON = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result)
          setSessions(data)
          alert('Daten erfolgreich importiert!')
        } catch (error) {
          alert('Fehler beim Import: Ungültiges JSON-Format')
        }
      }
      reader.readAsText(file)
    }
  }

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(sessions, null, 2)
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
            Programmplanung für das Festival - Drag & Drop zum Verschieben
          </p>
        </div>
        <div className="festival-actions">
          <button onClick={handleExportCSV} className="btn-primary">
            📊 CSV Export (Wix)
          </button>
          <button onClick={handleExportJSON} className="btn-secondary">
            💾 Backup (JSON)
          </button>
          <label className="btn-secondary" style={{ cursor: 'pointer' }}>
            📁 Import (JSON)
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

      <div className="festival-day-view">
        <div className="day-header">
          <h2>{days[activeDay - 1].name} - {days[activeDay - 1].date}</h2>
          <button onClick={() => setIsCreating(true)} className="btn-primary">
            ➕ Session hinzufügen
          </button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="sessions-list">
            {daySessions.length === 0 ? (
              <div className="empty-state">
                <p>🎭 Noch keine Sessions für diesen Tag</p>
                <button onClick={() => setIsCreating(true)} className="btn-primary">
                  Erste Session erstellen
                </button>
              </div>
            ) : (
              <SortableContext
                items={daySessions.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {daySessions.map(session => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    onEdit={setEditingSession}
                    onDelete={handleDeleteSession}
                  />
                ))}
              </SortableContext>
            )}
          </div>

          <DragOverlay>
            {activeSession ? (
              <div className="session-card dragging">
                <div className="session-drag-handle">⋮⋮</div>
                <div className="session-content">
                  <div className="session-time">
                    {activeSession.startTime} - {activeSession.endTime}
                  </div>
                  <div className="session-title">{activeSession.title}</div>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {(isCreating || editingSession) && (
        <SessionEditor
          session={editingSession}
          day={activeDay}
          onSave={handleSaveSession}
          onCancel={() => {
            setIsCreating(false)
            setEditingSession(null)
          }}
        />
      )}
    </div>
  )
}

export default FestivalPlanner
