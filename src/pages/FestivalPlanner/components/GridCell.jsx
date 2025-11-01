import { useDroppable } from '@dnd-kit/core'
import { timeToMinutes, calculateDurationInMinutes } from '../../../utils/timeHelpers'
import { SessionBlock } from './SessionBlock'

/**
 * Grid Cell mit Droppable - Zeigt Sessions, die im Slot-Zeitfenster beginnen
 */
export function GridCell({
  locationId,
  timeSlot,
  sessions,
  onEdit,
  onDelete,
  slotHeightPx,
  activeSession,
  overId,
  timeSlots,
  zoomLevel
}) {
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
