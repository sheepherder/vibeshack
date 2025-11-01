import { useState, useEffect, useRef } from 'react'
import './MeditationTimer.css'
import { formatTime } from '../utils/timeHelpers'
import { meditationTypes } from '../data/meditationTypes'

// Fallback: Synthetischer Klangschalen-Sound mit Web Audio API
const playSyntheticBowlSound = (audioContext) => {
  if (!audioContext) return

  const now = audioContext.currentTime
  const duration = 3

  // Verbesserte Klangschale mit mehr Obertönen und realistischerer Envelope
  const frequencies = [
    { freq: 432, gain: 0.3, decay: 1.0 },      // Grundton
    { freq: 864, gain: 0.15, decay: 0.8 },     // 1. Oberton
    { freq: 1296, gain: 0.08, decay: 0.6 },    // 2. Oberton
    { freq: 520, gain: 0.12, decay: 0.9 },     // Zusätzlicher Ton
    { freq: 728, gain: 0.06, decay: 0.7 },     // Zusätzlicher Ton
  ]

  frequencies.forEach(({ freq, gain: gainValue, decay }) => {
    const osc = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    // Realistische Envelope mit schnellem Attack und langsamem Decay
    gainNode.gain.setValueAtTime(0, now)
    gainNode.gain.linearRampToValueAtTime(gainValue, now + 0.02) // Schneller Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration * decay)

    osc.connect(gainNode)
    gainNode.connect(audioContext.destination)
    osc.start(now)
    osc.stop(now + duration)
  })
}

// Meditation-Typen werden aus separater Datei importiert
function MeditationTimer() {
  const [selectedType, setSelectedType] = useState(meditationTypes[0])
  const [instructionDetail, setInstructionDetail] = useState('mittel')
  const [duration, setDuration] = useState(selectedType.recommendedTime)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const audioContextRef = useRef(null)
  const bowlAudioRef = useRef(null)
  const [audioLoaded, setAudioLoaded] = useState(false)
  const intervalRef = useRef(null)

  // Audio laden (Sample oder Fallback)
  useEffect(() => {
    // Versuche, die Klangschalen-Audio-Datei zu laden
    const audio = new Audio()
    audio.preload = 'auto'

    // Versuche, die Audio-Datei zu laden
    audio.src = '/vibeshack/sounds/singing-bowl.mp3'

    audio.addEventListener('canplaythrough', () => {
      bowlAudioRef.current = audio
      setAudioLoaded(true)
    })

    audio.addEventListener('error', () => {
      setAudioLoaded(false)
    })

    // Audio Context für Fallback initialisieren
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
      if (bowlAudioRef.current) {
        bowlAudioRef.current = null
      }
    }
  }, [])

  // Haupt-Funktion zum Abspielen des Klangschalen-Sounds
  const playBowlSound = () => {
    if (audioLoaded && bowlAudioRef.current) {
      // Verwende echtes Sample
      bowlAudioRef.current.currentTime = 0
      bowlAudioRef.current.play().catch(() => {
        // Fallback bei Fehler
        playSyntheticBowlSound(audioContextRef.current)
      })
    } else {
      // Verwende synthetischen Sound
      playSyntheticBowlSound(audioContextRef.current)
    }
  }

  // Timer Logik
  useEffect(() => {
    if (isRunning && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerEnd()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, isPaused, timeLeft])

  // Wenn Meditationsart geändert wird, empfohlene Zeit aktualisieren
  useEffect(() => {
    if (!isRunning) {
      setDuration(selectedType.recommendedTime)
    }
  }, [selectedType, isRunning])

  const handleTimerEnd = () => {
    playBowlSound()
    setIsRunning(false)
    setIsPaused(false)
  }

  const startMeditation = () => {
    // Klangschale am Anfang
    playBowlSound()
    setTimeLeft(duration * 60)
    setIsRunning(true)
    setIsPaused(false)
  }

  const pauseMeditation = () => {
    setIsPaused(!isPaused)
  }

  const stopMeditation = () => {
    setIsRunning(false)
    setIsPaused(false)
    setTimeLeft(null)
  }

  const getProgressPercentage = () => {
    if (!isRunning || timeLeft === null) return 0
    return ((duration * 60 - timeLeft) / (duration * 60)) * 100
  }

  return (
    <div className="container">
      <h1 className="page-title">Meditations-Timer</h1>
      <p className="page-subtitle">
        Wähle eine Meditationsart, stelle die Zeit ein und beginne deine Praxis
      </p>

      <div className="meditation-container">
        {/* Meditationsart auswählen */}
        <div className="meditation-section">
          <h2>Meditationsart</h2>
          <div className="meditation-types">
            {meditationTypes.map(type => (
              <button
                key={type.id}
                className={`meditation-type-btn ${selectedType.id === type.id ? 'active' : ''}`}
                onClick={() => !isRunning && setSelectedType(type)}
                disabled={isRunning}
                style={{
                  '--type-color': type.color
                }}
              >
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Instruktionen */}
        <div className="meditation-section">
          <div className="instruction-header">
            <h2>Instruktionen</h2>
            <div className="detail-toggle">
              {['kurz', 'mittel', 'ausführlich'].map(detail => (
                <button
                  key={detail}
                  className={`detail-btn ${instructionDetail === detail ? 'active' : ''}`}
                  onClick={() => setInstructionDetail(detail)}
                >
                  {detail.charAt(0).toUpperCase() + detail.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="instruction-box">
            {selectedType.instructions[instructionDetail]}
          </div>
        </div>

        {/* Timer */}
        <div className="meditation-section">
          <h2>Timer</h2>

          {!isRunning ? (
            <div className="timer-setup">
              <div className="duration-control">
                <label>Dauer (Minuten)</label>
                <div className="duration-inputs">
                  <button
                    onClick={() => setDuration(Math.max(1, duration - 5))}
                    className="duration-btn"
                  >
                    -5
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={duration}
                    onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                    className="duration-input"
                  />
                  <button
                    onClick={() => setDuration(duration + 5)}
                    className="duration-btn"
                  >
                    +5
                  </button>
                </div>
                <div className="recommended-time">
                  Empfohlen: {selectedType.recommendedTime} Minuten
                </div>
              </div>

              <button
                onClick={startMeditation}
                className="start-btn"
                style={{ background: selectedType.color }}
              >
                Meditation beginnen
              </button>
            </div>
          ) : (
            <div className="timer-active">
              <div className="timer-display">
                <div className="time-circle" style={{ '--progress': getProgressPercentage() + '%', '--type-color': selectedType.color }}>
                  <svg className="progress-ring" width="280" height="280">
                    <circle
                      className="progress-ring-bg"
                      cx="140"
                      cy="140"
                      r="120"
                    />
                    <circle
                      className="progress-ring-progress"
                      cx="140"
                      cy="140"
                      r="120"
                      style={{
                        strokeDashoffset: 754 - (754 * getProgressPercentage() / 100),
                        stroke: selectedType.color
                      }}
                    />
                  </svg>
                  <div className="time-text">
                    {formatTime(timeLeft)}
                  </div>
                </div>
              </div>

              <div className="timer-controls">
                <button
                  onClick={pauseMeditation}
                  className="control-btn pause-btn"
                >
                  {isPaused ? '▶ Fortsetzen' : '⏸ Pause'}
                </button>
                <button
                  onClick={stopMeditation}
                  className="control-btn stop-btn"
                >
                  ⏹ Beenden
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MeditationTimer
