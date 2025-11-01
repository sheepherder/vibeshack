import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { timeToMinutes, calculateDurationInMinutes } from '../../../utils/timeHelpers'

/**
 * Draggable Session Block mit variabler Höhe basierend auf Dauer
 */
export function SessionBlock({
  session,
  onEdit,
  onDelete,
  slotHeightPx,
  zoomLevel,
  columnIndex = 0,
  totalColumns = 1,
  slotStartTime
}) {
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
