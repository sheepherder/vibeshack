/**
 * CSV Export und Import Funktionen für Festival-Sessions
 */

/**
 * Exportiert Sessions als CSV-Datei
 * @param {Array} sessions - Array von Session-Objekten
 * @param {Array} locations - Array von Location-Objekten
 */
export function exportToCSV(sessions, locations) {
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

/**
 * Importiert Sessions aus CSV-Text
 * @param {string} csvText - CSV-Inhalt als String
 * @param {Array} locations - Array von verfügbaren Locations
 * @returns {Array} - Array von importierten Session-Objekten
 */
export function importFromCSV(csvText, locations) {
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
