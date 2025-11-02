import { useState, useEffect } from 'react'

/**
 * Custom Hook für LocalStorage-Synchronisation
 *
 * @param {string} key - Der LocalStorage Key
 * @param {any} initialValue - Der initiale Wert falls nichts im Storage ist
 * @returns {[any, function]} - [gespeicherter Wert, Setter-Funktion]
 *
 * @example
 * const [sessions, setSessions] = useLocalStorage('festival-sessions', [])
 */
export function useLocalStorage(key, initialValue) {
  // State initialisieren mit Wert aus LocalStorage oder initialValue
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Wert im LocalStorage aktualisieren wenn sich storedValue ändert
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}
