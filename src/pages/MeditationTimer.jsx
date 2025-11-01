import { useState, useEffect, useRef } from 'react'

// Klangschalen-Sound Generator mit Web Audio API
const playBowlSound = (audioContext) => {
  if (!audioContext) return

  const now = audioContext.currentTime
  const duration = 3

  // Haupt-Ton (fundamentale Frequenz)
  const osc1 = audioContext.createOscillator()
  const gain1 = audioContext.createGain()
  osc1.type = 'sine'
  osc1.frequency.setValueAtTime(432, now) // A (432 Hz)
  gain1.gain.setValueAtTime(0.3, now)
  gain1.gain.exponentialRampToValueAtTime(0.001, now + duration)
  osc1.connect(gain1)
  gain1.connect(audioContext.destination)
  osc1.start(now)
  osc1.stop(now + duration)

  // Oberton 1
  const osc2 = audioContext.createOscillator()
  const gain2 = audioContext.createGain()
  osc2.type = 'sine'
  osc2.frequency.setValueAtTime(864, now) // 2x fundamental
  gain2.gain.setValueAtTime(0.15, now)
  gain2.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8)
  osc2.connect(gain2)
  gain2.connect(audioContext.destination)
  osc2.start(now)
  osc2.stop(now + duration)

  // Oberton 2
  const osc3 = audioContext.createOscillator()
  const gain3 = audioContext.createGain()
  osc3.type = 'sine'
  osc3.frequency.setValueAtTime(1296, now) // 3x fundamental
  gain3.gain.setValueAtTime(0.08, now)
  gain3.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.6)
  osc3.connect(gain3)
  gain3.connect(audioContext.destination)
  osc3.start(now)
  osc3.stop(now + duration)
}

const meditationTypes = [
  {
    id: 'metta',
    name: 'Metta (Liebende Güte)',
    recommendedTime: 15,
    color: '#f093fb',
    instructions: {
      kurz: 'Richte wohlwollende Gedanken an dich selbst, dann an andere. Wiederhole: "Möge ich glücklich sein, mögen alle Wesen glücklich sein."',
      mittel: 'Beginne mit dir selbst und sende Wünsche des Wohlwollens. Dann erweitere den Kreis: geliebte Menschen, neutrale Personen, schwierige Menschen, alle Lebewesen. Nutze Phrasen wie "Möge ich/du/alle sicher sein, möge ich/du/alle gesund sein, möge ich/du/alle in Frieden leben."',
      ausführlich: 'Metta-Meditation kultiviert liebende Güte. Beginne in einer bequemen Position. Atme einige Male tief ein und aus. Richte liebevolle Wünsche zuerst an dich selbst: "Möge ich glücklich sein, möge ich gesund sein, möge ich in Sicherheit leben, möge ich mit Leichtigkeit leben." Spüre die Wärme dieser Wünsche in deinem Herzen. Dann denke an einen geliebten Menschen und richte diese Wünsche an ihn/sie. Erweitere den Kreis auf neutrale Personen, auf Menschen, mit denen du Schwierigkeiten hast, und schließlich auf alle Lebewesen. Kehre immer wieder zu den Phrasen und dem Gefühl der liebenden Güte zurück.'
    }
  },
  {
    id: 'achtsamkeit',
    name: 'Achtsamkeitsmeditation',
    recommendedTime: 20,
    color: '#4facfe',
    instructions: {
      kurz: 'Konzentriere dich auf deinen Atem. Wenn Gedanken auftauchen, nimm sie wahr und kehre sanft zum Atem zurück.',
      mittel: 'Setze dich bequem hin und schließe die Augen. Richte deine Aufmerksamkeit auf den natürlichen Fluss deines Atems. Beobachte, wie die Luft ein- und ausströmt. Wenn dein Geist abschweift, bemerke es freundlich und lenke die Aufmerksamkeit zurück zum Atem. Bewerte nicht, sei einfach gegenwärtig.',
      ausführlich: 'Achtsamkeitsmeditation ist die Praxis, im gegenwärtigen Moment präsent zu sein. Finde eine aufrechte, aber entspannte Sitzhaltung. Schließe die Augen oder richte den Blick sanft nach unten. Beginne, deinen Atem zu beobachten – spüre, wie die Luft durch die Nase ein- und ausströmt, wie sich der Bauch hebt und senkt. Versuche nicht, den Atem zu kontrollieren, beobachte ihn einfach. Dein Geist wird unweigerlich abschweifen – zu Gedanken, Plänen, Erinnerungen. Das ist normal. Wenn du bemerkst, dass du abgeschweift bist, anerkenne es freundlich ("Denken") und kehre sanft zum Atem zurück. Mit der Zeit entwickelst du eine nicht-wertende Bewusstheit des gegenwärtigen Moments.'
    }
  },
  {
    id: 'bodyscan',
    name: 'Body Scan',
    recommendedTime: 25,
    color: '#43e97b',
    instructions: {
      kurz: 'Lenke deine Aufmerksamkeit systematisch durch deinen Körper, von den Füßen bis zum Kopf. Beobachte Empfindungen ohne zu urteilen.',
      mittel: 'Lege dich bequem hin. Beginne bei den Zehen und wandere langsam durch den Körper nach oben. Beobachte Empfindungen in jedem Bereich: Wärme, Kälte, Spannung, Entspannung. Verweile einige Atemzüge bei jedem Körperteil. Wenn du Anspannung bemerkst, atme hinein und lass los.',
      ausführlich: 'Body Scan ist eine Meditation der körperlichen Achtsamkeit. Lege dich auf den Rücken, Arme seitlich, Handflächen nach oben. Schließe die Augen und atme einige Male tief ein und aus. Bringe deine Aufmerksamkeit zu deinen Füßen – den Zehen, der Fußsohle, der Ferse. Beobachte alle Empfindungen: Kribbeln, Wärme, Druck, oder auch keine Empfindung. Bewerte nicht, sei einfach neugierig. Wandere langsam nach oben: Knöchel, Unterschenkel, Knie, Oberschenkel. Nimm dir Zeit. Wenn du Anspannung bemerkst, stelle dir vor, wie dein Atem in diesen Bereich fließt und die Spannung mit der Ausatmung verlässt. Setze den Scan fort durch Becken, Bauch, Brust, Rücken, Hände, Arme, Schultern, Nacken, Gesicht, bis zum Scheitel. Am Ende spüre deinen ganzen Körper als Einheit, ruhend in der Gegenwart.'
    }
  },
  {
    id: 'zazen',
    name: 'Zazen (Zen-Meditation)',
    recommendedTime: 30,
    color: '#fa709a',
    instructions: {
      kurz: 'Sitze in aufrechter Haltung. Zähle deine Atemzüge von 1 bis 10, dann beginne wieder von vorn. Einfach sitzen, einfach atmen.',
      mittel: 'Nimm eine stabile Sitzhaltung ein (Lotussitz oder auf einem Stuhl). Rücken gerade, Kinn leicht eingezogen, Hände im Schoß (rechte Hand unter der linken, Daumen berühren sich). Augen halb geöffnet, Blick 45° nach unten. Zähle deine Ausatmungen von 1 bis 10, dann wieder von vorn. Wenn Gedanken kommen, kehre einfach zum Zählen zurück.',
      ausführlich: 'Zazen bedeutet "nur sitzen" – die Essenz der Zen-Meditation. Finde eine stabile, aufrechte Sitzhaltung. Im traditionellen Zazen sitzt man im vollen oder halben Lotussitz auf einem Zafu (Meditationskissen), aber ein Stuhl ist ebenso akzeptabel. Wichtig ist eine aufrechte Wirbelsäule, als würde ein Faden dich vom Scheitel nach oben ziehen. Kinn leicht eingezogen, Ohren über den Schultern. Lege die Hände im kosmischen Mudra in den Schoß: rechte Hand liegt in der linken, Handflächen nach oben, Daumenspitzen berühren sich leicht und bilden ein Oval. Augen bleiben halb geöffnet, Blick ruht ohne Fokus etwa einen Meter vor dir auf dem Boden. Atme natürlich. Zähle deine Ausatmungen von eins bis zehn, dann beginne wieder bei eins. Wenn dein Geist abschweift oder du die Zählung verlierst, beginne freundlich wieder bei eins. Zazen ist nicht Entspannung, sondern wache Präsenz. Sitz einfach. Sei einfach. Nichts zu erreichen, nirgendwo hinzugehen.'
    }
  },
  {
    id: 'vipassana',
    name: 'Vipassana (Einsichtsmeditation)',
    recommendedTime: 45,
    color: '#feca57',
    instructions: {
      kurz: 'Beobachte Körperempfindungen und geistige Phänomene mit Gleichmut. Erkenne ihre vergängliche Natur.',
      mittel: 'Setze dich in aufrechter Haltung. Beobachte systematisch Empfindungen im Körper – Kribbeln, Wärme, Druck, Schmerz. Beobachte auch Gedanken und Emotionen als vorüberziehende Phänomene. Bleibe gleichmütig, ohne anzuhaften oder abzulehnen. Erkenne: alles entsteht und vergeht.',
      ausführlich: 'Vipassana bedeutet "Einsicht" oder "klares Sehen" – die Beobachtung der Wirklichkeit wie sie ist. Beginne in einer stabilen Sitzhaltung. Richte die Aufmerksamkeit zunächst auf den Atem an den Nasenflügeln, um den Geist zu sammeln. Wenn Konzentration entsteht, erweitere die Aufmerksamkeit auf den ganzen Körper. Scanne systematisch Empfindungen: Kribbeln, Pulsieren, Wärme, Kälte, Spannung, Druck. Beobachte sie mit nüchternem Interesse, ohne zu reagieren. Wenn eine Empfindung angenehm ist, klammere dich nicht daran. Wenn sie unangenehm ist, versuche nicht, sie zu vermeiden. Gleichmut ist der Schlüssel. Beobachte auch Gedanken, Emotionen, Geräusche – alles, was in deinem Bewusstsein auftaucht. Erkenne ihre grundlegenden Eigenschaften: Anicca (Vergänglichkeit) – alles entsteht und vergeht; Dukkha (Unzulänglichkeit) – Festhalten verursacht Leiden; Anatta (Nicht-Selbst) – es gibt keinen festen Kern. Diese Einsichten entstehen nicht intellektuell, sondern durch direkte Erfahrung in der Meditation.'
    }
  }
]

function MeditationTimer() {
  const [selectedType, setSelectedType] = useState(meditationTypes[0])
  const [instructionDetail, setInstructionDetail] = useState('mittel')
  const [duration, setDuration] = useState(selectedType.recommendedTime)
  const [timeLeft, setTimeLeft] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const audioContextRef = useRef(null)
  const intervalRef = useRef(null)

  // Audio Context initialisieren
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

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
    playBowlSound(audioContextRef.current)
    setIsRunning(false)
    setIsPaused(false)
  }

  const startMeditation = () => {
    // Klangschale am Anfang
    playBowlSound(audioContextRef.current)
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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

      <style>{`
        .meditation-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .meditation-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .meditation-section h2 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          color: var(--text);
        }

        .meditation-types {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .meditation-type-btn {
          padding: 1rem;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 1rem;
          font-weight: 500;
        }

        .meditation-type-btn:hover:not(:disabled) {
          border-color: var(--type-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }

        .meditation-type-btn.active {
          border-color: var(--type-color);
          background: linear-gradient(135deg, var(--bg) 0%, var(--bg-secondary) 100%);
          box-shadow: 0 0 20px var(--type-color);
        }

        .meditation-type-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .instruction-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .instruction-header h2 {
          margin: 0;
        }

        .detail-toggle {
          display: flex;
          gap: 0.5rem;
          background: var(--bg);
          padding: 4px;
          border-radius: 8px;
        }

        .detail-btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .detail-btn:hover {
          background: var(--bg-secondary);
          color: var(--text);
        }

        .detail-btn.active {
          background: var(--primary);
          color: white;
        }

        .instruction-box {
          background: var(--bg);
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid var(--primary);
          line-height: 1.7;
          color: var(--text-secondary);
        }

        .timer-setup {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .duration-control {
          width: 100%;
          max-width: 400px;
        }

        .duration-control label {
          display: block;
          margin-bottom: 1rem;
          color: var(--text);
          font-weight: 500;
          text-align: center;
        }

        .duration-inputs {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .duration-btn {
          width: 50px;
          height: 50px;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 1.2rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .duration-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .duration-input {
          width: 100px;
          height: 50px;
          text-align: center;
          font-size: 1.5rem;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          padding: 0.5rem;
        }

        .duration-input:focus {
          outline: none;
          border-color: var(--primary);
        }

        .recommended-time {
          margin-top: 0.5rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .start-btn {
          padding: 1rem 3rem;
          border: none;
          border-radius: 12px;
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
        }

        .start-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
        }

        .timer-active {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }

        .timer-display {
          position: relative;
        }

        .time-circle {
          position: relative;
          width: 280px;
          height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .progress-ring {
          position: absolute;
          transform: rotate(-90deg);
        }

        .progress-ring-bg {
          fill: none;
          stroke: var(--bg);
          stroke-width: 12;
        }

        .progress-ring-progress {
          fill: none;
          stroke-width: 12;
          stroke-dasharray: 754;
          stroke-dashoffset: 754;
          transition: stroke-dashoffset 1s linear;
          stroke-linecap: round;
        }

        .time-text {
          font-size: 3.5rem;
          font-weight: 300;
          color: var(--text);
          font-variant-numeric: tabular-nums;
        }

        .timer-controls {
          display: flex;
          gap: 1rem;
        }

        .control-btn {
          padding: 0.75rem 2rem;
          border: 2px solid var(--border);
          border-radius: 8px;
          background: var(--bg);
          color: var(--text);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .control-btn:hover {
          transform: translateY(-2px);
        }

        .pause-btn:hover {
          background: var(--primary);
          border-color: var(--primary);
          color: white;
        }

        .stop-btn:hover {
          background: #ef4444;
          border-color: #ef4444;
          color: white;
        }

        @media (max-width: 768px) {
          .meditation-section {
            padding: 1.5rem;
          }

          .meditation-types {
            grid-template-columns: 1fr;
          }

          .instruction-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .detail-toggle {
            width: 100%;
          }

          .detail-btn {
            flex: 1;
          }

          .time-circle {
            width: 240px;
            height: 240px;
          }

          .progress-ring {
            width: 240px;
            height: 240px;
          }

          .progress-ring-bg,
          .progress-ring-progress {
            r: 100;
          }

          .time-text {
            font-size: 2.5rem;
          }

          .timer-controls {
            flex-direction: column;
            width: 100%;
          }

          .control-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  )
}

export default MeditationTimer
