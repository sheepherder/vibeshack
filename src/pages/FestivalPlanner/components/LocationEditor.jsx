import { useState } from 'react'

/**
 * Location Editor Modal - Formular zum Erstellen/Bearbeiten von Locations
 */
export function LocationEditor({ location, onSave, onCancel }) {
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
