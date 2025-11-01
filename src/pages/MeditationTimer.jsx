import { useState, useEffect, useRef } from 'react'
import './MeditationTimer.css'
import { formatTime } from '../utils/timeHelpers'

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

const meditationTypes = [
  {
    id: 'metta',
    name: 'Metta (Liebende Güte)',
    recommendedTime: 15,
    color: '#f093fb',
    instructions: {
      kurz: (
        <>
          <p>Richte wohlwollende Gedanken an dich selbst, dann an andere. Wiederhole innerlich liebevolle Phrasen:</p>
          <div className="metta-phrases">
            <div className="phrase-group">
              <strong>Klassische Phrasen:</strong>
              <ul>
                <li>Möge ich glücklich sein</li>
                <li>Möge ich gesund sein</li>
                <li>Möge ich in Sicherheit leben</li>
                <li>Möge ich mit Leichtigkeit leben</li>
              </ul>
            </div>
          </div>
        </>
      ),
      mittel: (
        <>
          <p>Beginne mit dir selbst und sende Wünsche des Wohlwollens. Dann erweitere den Kreis: geliebte Menschen, neutrale Personen, schwierige Menschen, alle Lebewesen.</p>
          <div className="metta-phrases">
            <div className="phrase-group">
              <strong>Traditionelle Phrasen:</strong>
              <ul>
                <li>Möge ich/du/alle sicher sein</li>
                <li>Möge ich/du/alle glücklich sein</li>
                <li>Möge ich/du/alle gesund sein</li>
                <li>Möge ich/du/alle in Frieden leben</li>
              </ul>
            </div>
            <div className="phrase-group">
              <strong>Erweiterte Phrasen:</strong>
              <ul>
                <li>Möge ich/du/alle mit Leichtigkeit leben</li>
                <li>Möge ich/du/alle frei von Leid sein</li>
                <li>Möge ich/du/alle Freude erfahren</li>
                <li>Möge ich/du/alle in Harmonie sein</li>
              </ul>
            </div>
          </div>
        </>
      ),
      ausführlich: (
        <>
          <p>Metta-Meditation kultiviert liebende Güte und Mitgefühl. Beginne in einer bequemen Position. Atme einige Male tief ein und aus. Richte liebevolle Wünsche zuerst an dich selbst, dann erweitere den Kreis auf andere.</p>

          <div className="metta-phrases">
            <div className="phrase-group">
              <strong>Klassische Metta-Phrasen:</strong>
              <ul>
                <li>Möge ich glücklich sein</li>
                <li>Möge ich gesund sein</li>
                <li>Möge ich in Sicherheit leben</li>
                <li>Möge ich mit Leichtigkeit leben</li>
              </ul>
            </div>

            <div className="phrase-group">
              <strong>Erweiterte Variationen:</strong>
              <ul>
                <li>Möge ich frei von Leid sein</li>
                <li>Möge ich in Frieden leben</li>
                <li>Möge ich Freude erfahren</li>
                <li>Möge ich geliebt sein</li>
                <li>Möge ich mich selbst annehmen</li>
                <li>Möge ich in Harmonie sein</li>
              </ul>
            </div>

            <div className="phrase-group">
              <strong>Körperliche Variationen:</strong>
              <ul>
                <li>Möge mein Körper stark und gesund sein</li>
                <li>Möge mein Geist ruhig und klar sein</li>
                <li>Möge mein Herz offen und liebevoll sein</li>
              </ul>
            </div>

            <div className="phrase-group">
              <strong>Alternative Formulierungen:</strong>
              <ul>
                <li>Ich wünsche mir Glück und Wohlbefinden</li>
                <li>Ich bin würdig, geliebt zu werden</li>
                <li>Ich erlaube mir, in Frieden zu sein</li>
                <li>Ich öffne mein Herz für Freude</li>
              </ul>
            </div>
          </div>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Spüre die Wärme dieser Wünsche in deinem Herzen. Dann denke an einen geliebten Menschen und richte diese Wünsche an ihn/sie. Erweitere den Kreis auf neutrale Personen, auf Menschen, mit denen du Schwierigkeiten hast, und schließlich auf alle Lebewesen. Kehre immer wieder zu den Phrasen und dem Gefühl der liebenden Güte zurück.
          </p>
        </>
      )
    }
  },
  {
    id: 'achtsamkeit',
    name: 'Achtsamkeitsmeditation',
    recommendedTime: 20,
    color: '#4facfe',
    instructions: {
      kurz: (
        <>
          <p>Konzentriere dich auf deinen Atem. Wenn Gedanken auftauchen, nimm sie wahr und kehre sanft zum Atem zurück.</p>
          <ul>
            <li>Beobachte den natürlichen Atemfluss</li>
            <li>Bewerte nicht, sei präsent</li>
            <li>Kehre sanft zum Atem zurück</li>
          </ul>
        </>
      ),
      mittel: (
        <>
          <p><strong>Grundhaltung:</strong> Setze dich bequem hin und schließe die Augen.</p>

          <p><strong>Die Praxis:</strong></p>
          <ul>
            <li>Richte deine Aufmerksamkeit auf den natürlichen Fluss deines Atems</li>
            <li>Beobachte, wie die Luft ein- und ausströmt</li>
            <li>Wenn dein Geist abschweift, bemerke es freundlich</li>
            <li>Lenke die Aufmerksamkeit sanft zurück zum Atem</li>
          </ul>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Bewerte nicht, sei einfach gegenwärtig.
          </p>
        </>
      ),
      ausführlich: (
        <>
          <p><strong>Was ist Achtsamkeitsmeditation?</strong></p>
          <p>Achtsamkeitsmeditation ist die Praxis, im gegenwärtigen Moment präsent zu sein.</p>

          <p><strong>Vorbereitung:</strong></p>
          <ul>
            <li>Finde eine aufrechte, aber entspannte Sitzhaltung</li>
            <li>Schließe die Augen oder richte den Blick sanft nach unten</li>
            <li>Atme einige Male bewusst ein und aus</li>
          </ul>

          <p><strong>Die Praxis:</strong></p>
          <ul>
            <li>Beginne, deinen Atem zu beobachten</li>
            <li>Spüre, wie die Luft durch die Nase ein- und ausströmt</li>
            <li>Bemerke, wie sich der Bauch hebt und senkt</li>
            <li>Versuche nicht, den Atem zu kontrollieren – beobachte ihn einfach</li>
          </ul>

          <p><strong>Umgang mit Gedanken:</strong></p>
          <ul>
            <li>Dein Geist wird unweigerlich abschweifen – zu Gedanken, Plänen, Erinnerungen</li>
            <li>Das ist <em>völlig normal</em></li>
            <li>Wenn du bemerkst, dass du abgeschweift bist, anerkenne es freundlich ("Denken")</li>
            <li>Kehre sanft zum Atem zurück, ohne dich zu kritisieren</li>
          </ul>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Mit der Zeit entwickelst du eine nicht-wertende Bewusstheit des gegenwärtigen Moments.
          </p>
        </>
      )
    }
  },
  {
    id: 'bodyscan',
    name: 'Body Scan',
    recommendedTime: 25,
    color: '#43e97b',
    instructions: {
      kurz: (
        <>
          <p>Lenke deine Aufmerksamkeit systematisch durch deinen Körper, von den Füßen bis zum Kopf.</p>
          <ul>
            <li>Beobachte Empfindungen ohne zu urteilen</li>
            <li>Wandere langsam durch jeden Bereich</li>
            <li>Atme in Anspannungen hinein</li>
          </ul>
        </>
      ),
      mittel: (
        <>
          <p><strong>Position:</strong> Lege dich bequem hin.</p>

          <p><strong>Der Ablauf:</strong></p>
          <ul>
            <li>Beginne bei den Zehen</li>
            <li>Wandere langsam durch den Körper nach oben</li>
            <li>Beobachte Empfindungen in jedem Bereich: Wärme, Kälte, Spannung, Entspannung</li>
            <li>Verweile einige Atemzüge bei jedem Körperteil</li>
          </ul>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Wenn du Anspannung bemerkst, atme hinein und lass los.
          </p>
        </>
      ),
      ausführlich: (
        <>
          <p><strong>Was ist Body Scan?</strong></p>
          <p>Body Scan ist eine Meditation der körperlichen Achtsamkeit – eine Reise durch deinen Körper.</p>

          <p><strong>Vorbereitung:</strong></p>
          <ul>
            <li>Lege dich auf den Rücken, Arme seitlich, Handflächen nach oben</li>
            <li>Schließe die Augen</li>
            <li>Atme einige Male tief ein und aus</li>
          </ul>

          <p><strong>Die Reise durch den Körper:</strong></p>
          <ul>
            <li><strong>Füße:</strong> Bringe deine Aufmerksamkeit zu den Zehen, der Fußsohle, der Ferse</li>
            <li><strong>Beine:</strong> Wandere zu Knöcheln, Unterschenkeln, Knien, Oberschenkeln</li>
            <li><strong>Rumpf:</strong> Setze fort durch Becken, Bauch, Brust, Rücken</li>
            <li><strong>Arme:</strong> Spüre Hände, Unterarme, Ellbogen, Oberarme</li>
            <li><strong>Kopf:</strong> Schultern, Nacken, Gesicht, bis zum Scheitel</li>
          </ul>

          <p><strong>Was beobachten?</strong></p>
          <ul>
            <li>Alle Empfindungen: Kribbeln, Wärme, Druck</li>
            <li>Auch keine Empfindung ist eine Beobachtung</li>
            <li>Bewerte nicht, sei einfach neugierig</li>
            <li>Nimm dir Zeit für jeden Bereich</li>
          </ul>

          <p><strong>Umgang mit Anspannung:</strong></p>
          <p>Wenn du Anspannung bemerkst, stelle dir vor, wie dein Atem in diesen Bereich fließt und die Spannung mit der Ausatmung verlässt.</p>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Am Ende spüre deinen ganzen Körper als Einheit, ruhend in der Gegenwart.
          </p>
        </>
      )
    }
  },
  {
    id: 'zazen',
    name: 'Zazen (Zen-Meditation)',
    recommendedTime: 30,
    color: '#fa709a',
    instructions: {
      kurz: (
        <>
          <p><em>"Nur sitzen"</em> – die Essenz von Zazen.</p>
          <ul>
            <li>Sitze in aufrechter Haltung</li>
            <li>Zähle deine Atemzüge von 1 bis 10</li>
            <li>Beginne wieder von vorn</li>
          </ul>
          <p style={{ fontStyle: 'italic' }}>Einfach sitzen, einfach atmen.</p>
        </>
      ),
      mittel: (
        <>
          <p><strong>Die Haltung:</strong></p>
          <ul>
            <li>Nimm eine stabile Sitzhaltung ein (Lotussitz oder auf einem Stuhl)</li>
            <li>Rücken gerade, Kinn leicht eingezogen</li>
            <li>Hände im Schoß: rechte Hand unter der linken, Daumen berühren sich</li>
            <li>Augen halb geöffnet, Blick 45° nach unten</li>
          </ul>

          <p><strong>Die Praxis:</strong></p>
          <ul>
            <li>Zähle deine Ausatmungen von 1 bis 10</li>
            <li>Dann wieder von vorn</li>
            <li>Wenn Gedanken kommen, kehre einfach zum Zählen zurück</li>
          </ul>
        </>
      ),
      ausführlich: (
        <>
          <p><strong>Was ist Zazen?</strong></p>
          <p>Zazen bedeutet <em>"nur sitzen"</em> – die Essenz der Zen-Meditation. Nichts zu erreichen, nirgendwo hinzugehen.</p>

          <p><strong>Die Sitzhaltung:</strong></p>
          <ul>
            <li><strong>Position:</strong> Voller oder halber Lotussitz auf einem Zafu (Meditationskissen), oder auf einem Stuhl</li>
            <li><strong>Wirbelsäule:</strong> Aufrecht, als würde ein Faden dich vom Scheitel nach oben ziehen</li>
            <li><strong>Kopf:</strong> Kinn leicht eingezogen, Ohren über den Schultern</li>
            <li><strong>Hände:</strong> Im kosmischen Mudra – rechte Hand liegt in der linken, Handflächen nach oben, Daumenspitzen berühren sich leicht und bilden ein Oval</li>
            <li><strong>Augen:</strong> Halb geöffnet, Blick ruht ohne Fokus etwa einen Meter vor dir auf dem Boden</li>
          </ul>

          <p><strong>Die Atempraxis:</strong></p>
          <ul>
            <li>Atme natürlich, ohne zu kontrollieren</li>
            <li>Zähle deine Ausatmungen von eins bis zehn</li>
            <li>Dann beginne wieder bei eins</li>
            <li>Wenn dein Geist abschweift oder du die Zählung verlierst, beginne freundlich wieder bei eins</li>
          </ul>

          <p><strong>Die Haltung des Geistes:</strong></p>
          <ul>
            <li>Zazen ist nicht Entspannung, sondern <em>wache Präsenz</em></li>
            <li>Sitz einfach. Sei einfach.</li>
            <li>Nichts zu erreichen, nirgendwo hinzugehen</li>
          </ul>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Im Zen sagt man: "Du bist bereits Buddha. Sitz einfach und erkenne es."
          </p>
        </>
      )
    }
  },
  {
    id: 'vipassana',
    name: 'Vipassana (Einsichtsmeditation)',
    recommendedTime: 45,
    color: '#feca57',
    instructions: {
      kurz: (
        <>
          <p><em>"Klares Sehen"</em> – Beobachte die Wirklichkeit wie sie ist.</p>
          <ul>
            <li>Beobachte Körperempfindungen mit Gleichmut</li>
            <li>Erkenne geistige Phänomene</li>
            <li>Alles entsteht und vergeht</li>
          </ul>
        </>
      ),
      mittel: (
        <>
          <p><strong>Die Haltung:</strong> Setze dich in aufrechter Haltung.</p>

          <p><strong>Die Beobachtung:</strong></p>
          <ul>
            <li>Beobachte systematisch Empfindungen im Körper – Kribbeln, Wärme, Druck, Schmerz</li>
            <li>Beobachte auch Gedanken und Emotionen als vorüberziehende Phänomene</li>
            <li>Bleibe gleichmütig, ohne anzuhaften oder abzulehnen</li>
          </ul>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Erkenne: Alles entsteht und vergeht.
          </p>
        </>
      ),
      ausführlich: (
        <>
          <p><strong>Was ist Vipassana?</strong></p>
          <p>Vipassana bedeutet <em>"Einsicht"</em> oder <em>"klares Sehen"</em> – die Beobachtung der Wirklichkeit wie sie ist.</p>

          <p><strong>Der Einstieg:</strong></p>
          <ul>
            <li>Beginne in einer stabilen Sitzhaltung</li>
            <li>Richte die Aufmerksamkeit zunächst auf den Atem an den Nasenflügeln</li>
            <li>Sammle den Geist durch diese Konzentration</li>
          </ul>

          <p><strong>Die Körper-Beobachtung:</strong></p>
          <ul>
            <li>Erweitere die Aufmerksamkeit auf den ganzen Körper</li>
            <li>Scanne systematisch alle Empfindungen: Kribbeln, Pulsieren, Wärme, Kälte, Spannung, Druck</li>
            <li>Beobachte sie mit nüchternem Interesse, ohne zu reagieren</li>
          </ul>

          <p><strong>Der Schlüssel: Gleichmut</strong></p>
          <ul>
            <li>Wenn eine Empfindung angenehm ist, klammere dich nicht daran</li>
            <li>Wenn sie unangenehm ist, versuche nicht, sie zu vermeiden</li>
            <li>Beobachte auch Gedanken, Emotionen, Geräusche – alles, was in deinem Bewusstsein auftaucht</li>
          </ul>

          <p><strong>Die drei Daseinmerkmale:</strong></p>
          <ul>
            <li><strong>Anicca (Vergänglichkeit):</strong> Alles entsteht und vergeht</li>
            <li><strong>Dukkha (Unzulänglichkeit):</strong> Festhalten verursacht Leiden</li>
            <li><strong>Anatta (Nicht-Selbst):</strong> Es gibt keinen festen Kern</li>
          </ul>

          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Diese Einsichten entstehen nicht intellektuell, sondern durch direkte Erfahrung in der Meditation.
          </p>
        </>
      )
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
