import { useState } from 'react'
import { calculateDurationInMinutes, calculateEndTime } from '../utils/timeHelpers'

// Dauer-Optionen für Session-Länge
const DURATION_OPTIONS = [
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

/**
 * Generiert Zeitoptionen in 5-Minuten-Schritten
 */
function generateTimeOptions() {
  const timeOptions = []
  for (let hour = 7; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      if (hour === 18 && minute > 0) break // Stopp bei 18:00
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
      timeOptions.push(time)
    }
  }
  return timeOptions
}

/**
 * Session Editor Modal - Formular zum Erstellen/Bearbeiten von Sessions
 */
export function SessionEditor({ session, onSave, onCancel, day, locations }) {
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

  const timeOptions = generateTimeOptions()

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
                {DURATION_OPTIONS.map(opt => (
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
