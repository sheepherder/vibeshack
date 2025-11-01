import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import './AmbientMusicGenerator.css'

function AmbientMusicGenerator() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeTracks, setActiveTracks] = useState(new Set())
  const [autoMode, setAutoMode] = useState(false)
  const [timelineProgress, setTimelineProgress] = useState(0)
  const synthsRef = useRef({})
  const sequencesRef = useRef({})
  const volumesRef = useRef({})
  const autoModeTimerRef = useRef(null)

  // Track definitions - verschiedene Night Drive Styles
  const tracks = [
    {
      id: 'deep-bass',
      name: 'Deep Bass',
      color: '#8b5cf6',
      icon: '🔊'
    },
    {
      id: 'kick-pulse',
      name: 'Rhythmic Pulse',
      color: '#ec4899',
      icon: '🥁'
    },
    {
      id: 'ambient-pad',
      name: 'Cosmic Pad',
      color: '#06b6d4',
      icon: '🌌'
    },
    {
      id: 'synth-lead',
      name: 'Melodic Lead',
      color: '#f59e0b',
      icon: '🎹'
    },
    {
      id: 'hats',
      name: 'Hi-Hats',
      color: '#10b981',
      icon: '✨'
    },
    {
      id: 'texture',
      name: 'Ambient Texture',
      color: '#6366f1',
      icon: '🌊'
    }
  ]

  // Initialize Audio Engine
  useEffect(() => {
    // Deep Bass - sehr relaxed und tief
    const bassVol = new Tone.Volume(-8).toDestination()
    volumesRef.current['deep-bass'] = bassVol
    const bassSynth = new Tone.FMSynth({
      harmonicity: 0.5,
      modulationIndex: 2,
      envelope: {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.4,
        release: 1.2
      },
      modulation: {
        type: 'sine'
      }
    }).connect(bassVol)
    synthsRef.current['deep-bass'] = bassSynth

    const bassPattern = new Tone.Sequence(
      (time, note) => {
        bassSynth.triggerAttackRelease(note, '4n', time)
      },
      ['C1', 'C1', 'G0', 'C1', 'Eb1', 'C1', 'G0', 'C1'],
      '2n'
    )
    sequencesRef.current['deep-bass'] = bassPattern

    // Kick Pulse - sanfter rhythmischer Kick
    const kickVol = new Tone.Volume(-12).toDestination()
    volumesRef.current['kick-pulse'] = kickVol
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.08,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.5
      }
    }).connect(kickVol)
    synthsRef.current['kick-pulse'] = kick

    const kickPattern = new Tone.Sequence(
      (time) => {
        kick.triggerAttackRelease('C1', '8n', time)
      },
      [0, null, null, null, 0, null, null, null],
      '8n'
    )
    sequencesRef.current['kick-pulse'] = kickPattern

    // Ambient Pad - weiche, atmosphärische Pads
    const padVol = new Tone.Volume(-18).toDestination()
    volumesRef.current['ambient-pad'] = padVol
    const pad = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.5,
        release: 3
      }
    }).connect(
      new Tone.Reverb({ decay: 4, wet: 0.5 }).toDestination()
    ).connect(padVol)
    synthsRef.current['ambient-pad'] = pad

    const padChords = [
      ['C3', 'Eb3', 'G3', 'Bb3'],
      ['Ab2', 'C3', 'Eb3', 'G3'],
      ['F2', 'Ab2', 'C3', 'Eb3'],
      ['G2', 'Bb2', 'D3', 'F3']
    ]
    let padIndex = 0
    const padPattern = new Tone.Sequence(
      (time) => {
        pad.triggerAttackRelease(padChords[padIndex % 4], '2m', time)
        padIndex++
      },
      [0, null, null, null],
      '1m'
    )
    sequencesRef.current['ambient-pad'] = padPattern

    // Synth Lead - sanfte melodische Linie
    const leadVol = new Tone.Volume(-20).toDestination()
    volumesRef.current['synth-lead'] = leadVol
    const lead = new Tone.MonoSynth({
      oscillator: {
        type: 'triangle'
      },
      filter: {
        Q: 2,
        type: 'lowpass',
        rolloff: -12
      },
      envelope: {
        attack: 0.4,
        decay: 0.3,
        sustain: 0.6,
        release: 2
      },
      filterEnvelope: {
        attack: 0.2,
        decay: 0.2,
        sustain: 0.5,
        release: 1.5,
        baseFrequency: 200,
        octaves: 2.5
      }
    }).connect(
      new Tone.Reverb({ decay: 3, wet: 0.3 }).toDestination()
    ).connect(leadVol)
    synthsRef.current['synth-lead'] = lead

    const melody = ['C4', 'Eb4', 'G4', 'Bb4', 'G4', 'Eb4', 'D4', 'C4']
    const leadPattern = new Tone.Sequence(
      (time, note) => {
        if (note) {
          lead.triggerAttackRelease(note, '4n', time)
        }
      },
      melody,
      '4n'
    )
    sequencesRef.current['synth-lead'] = leadPattern

    // Hi-Hats - subtile rhythmische Elemente
    const hatsVol = new Tone.Volume(-25).toDestination()
    volumesRef.current['hats'] = hatsVol
    const hats = new Tone.MetalSynth({
      frequency: 200,
      envelope: {
        attack: 0.001,
        decay: 0.1,
        release: 0.01
      },
      harmonicity: 3.1,
      modulationIndex: 16,
      resonance: 4000,
      octaves: 1
    }).connect(hatsVol)
    synthsRef.current['hats'] = hats

    const hatsPattern = new Tone.Sequence(
      (time, vel) => {
        if (vel) {
          hats.triggerAttackRelease('16n', time, vel)
        }
      },
      [0.3, null, 0.2, null, 0.3, null, 0.2, 0.1],
      '16n'
    )
    sequencesRef.current['hats'] = hatsPattern

    // Ambient Texture - atmosphärische Klänge
    const textureVol = new Tone.Volume(-22).toDestination()
    volumesRef.current['texture'] = textureVol
    const texture = new Tone.NoiseSynth({
      noise: {
        type: 'pink'
      },
      envelope: {
        attack: 1,
        decay: 2,
        sustain: 0.3,
        release: 3
      }
    }).connect(
      new Tone.Filter({
        frequency: 800,
        type: 'lowpass'
      })
    ).connect(
      new Tone.Reverb({ decay: 5, wet: 0.7 }).toDestination()
    ).connect(textureVol)
    synthsRef.current['texture'] = texture

    const texturePattern = new Tone.Sequence(
      (time) => {
        texture.triggerAttackRelease('4m', time, 0.1)
      },
      [0, null, null, null, null, null, null, 0],
      '2m'
    )
    sequencesRef.current['texture'] = texturePattern

    // Set BPM für relaxte Vibes
    Tone.Transport.bpm.value = 82

    // Timeline update
    const interval = setInterval(() => {
      if (Tone.Transport.state === 'started') {
        const position = Tone.Transport.seconds
        setTimelineProgress(position)
      }
    }, 50)

    return () => {
      clearInterval(interval)
      Tone.Transport.stop()
      Object.values(sequencesRef.current).forEach(seq => seq.dispose())
      Object.values(synthsRef.current).forEach(synth => synth.dispose())
      if (autoModeTimerRef.current) {
        clearTimeout(autoModeTimerRef.current)
      }
    }
  }, [])

  // Auto Mode - automatische Track-Änderungen
  useEffect(() => {
    if (autoMode && isPlaying) {
      const scheduleNextChange = () => {
        const delay = Math.random() * 15000 + 10000 // 10-25 Sekunden
        autoModeTimerRef.current = setTimeout(() => {
          const availableTracks = tracks.map(t => t.id)
          const currentlyActive = Array.from(activeTracks)

          // Entscheide ob Track hinzufügen oder entfernen
          if (Math.random() > 0.5 && currentlyActive.length < tracks.length) {
            // Track hinzufügen
            const inactive = availableTracks.filter(id => !activeTracks.has(id))
            if (inactive.length > 0) {
              const trackToAdd = inactive[Math.floor(Math.random() * inactive.length)]
              toggleTrack(trackToAdd)
            }
          } else if (currentlyActive.length > 1) {
            // Track entfernen
            const trackToRemove = currentlyActive[Math.floor(Math.random() * currentlyActive.length)]
            toggleTrack(trackToRemove)
          }

          scheduleNextChange()
        }, delay)
      }

      scheduleNextChange()
    } else {
      if (autoModeTimerRef.current) {
        clearTimeout(autoModeTimerRef.current)
        autoModeTimerRef.current = null
      }
    }

    return () => {
      if (autoModeTimerRef.current) {
        clearTimeout(autoModeTimerRef.current)
      }
    }
  }, [autoMode, isPlaying, activeTracks])

  const startAudio = async () => {
    await Tone.start()
    Tone.Transport.start()
    setIsPlaying(true)
  }

  const stopAudio = () => {
    Tone.Transport.stop()
    setIsPlaying(false)
    setTimelineProgress(0)
  }

  const toggleTrack = (trackId) => {
    const newActiveTracks = new Set(activeTracks)
    const volume = volumesRef.current[trackId]
    const sequence = sequencesRef.current[trackId]

    if (newActiveTracks.has(trackId)) {
      // Fade out - nahtlos ausmischen
      newActiveTracks.delete(trackId)
      volume.volume.rampTo(-60, 2) // 2 Sekunden Fade-out
      setTimeout(() => {
        sequence.stop()
      }, 2000)
    } else {
      // Fade in - nahtlos einmischen
      newActiveTracks.add(trackId)

      if (Tone.Transport.state === 'started') {
        sequence.start(0)
        volume.volume.setValueAtTime(-60, Tone.now())
        const targetVolume = trackId === 'deep-bass' ? -8 :
                           trackId === 'kick-pulse' ? -12 :
                           trackId === 'ambient-pad' ? -18 :
                           trackId === 'synth-lead' ? -20 :
                           trackId === 'hats' ? -25 : -22
        volume.volume.rampTo(targetVolume, 2) // 2 Sekunden Fade-in
      }
    }

    setActiveTracks(newActiveTracks)
  }

  // Starte alle aktiven Tracks beim Play
  useEffect(() => {
    if (isPlaying) {
      activeTracks.forEach(trackId => {
        const sequence = sequencesRef.current[trackId]
        const volume = volumesRef.current[trackId]
        sequence.start(0)

        const targetVolume = trackId === 'deep-bass' ? -8 :
                           trackId === 'kick-pulse' ? -12 :
                           trackId === 'ambient-pad' ? -18 :
                           trackId === 'synth-lead' ? -20 :
                           trackId === 'hats' ? -25 : -22
        volume.volume.rampTo(targetVolume, 2)
      })
    }
  }, [isPlaying])

  return (
    <div className="ambient-generator">
      <div className="ambient-header">
        <h1 className="ambient-title">🌙 Night Drive Ambient Generator</h1>
        <p className="ambient-subtitle">
          Erstelle deine eigene relaxte elektrische Soundscape - Tracks nahtlos hinzumischen und wieder entfernen
        </p>
      </div>

      {/* Transport Controls */}
      <div className="transport-controls">
        {!isPlaying ? (
          <button className="play-button" onClick={startAudio}>
            ▶️ Start Journey
          </button>
        ) : (
          <button className="stop-button" onClick={stopAudio}>
            ⏹️ Stop
          </button>
        )}

        <button
          className={`auto-mode-button ${autoMode ? 'active' : ''}`}
          onClick={() => setAutoMode(!autoMode)}
          disabled={!isPlaying}
        >
          🤖 Auto Mode {autoMode ? 'ON' : 'OFF'}
        </button>
      </div>

      {/* Timeline */}
      <div className="timeline-container">
        <div className="timeline-label">Timeline</div>
        <div className="timeline">
          <div
            className="timeline-progress"
            style={{
              width: `${(timelineProgress % 16) / 16 * 100}%`
            }}
          />
          <div className="timeline-markers">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="timeline-marker" />
            ))}
          </div>
        </div>
        <div className="timeline-time">
          {Math.floor(timelineProgress / 60)}:{String(Math.floor(timelineProgress % 60)).padStart(2, '0')}
        </div>
      </div>

      {/* Track Grid */}
      <div className="tracks-grid">
        {tracks.map(track => (
          <button
            key={track.id}
            className={`track-card ${activeTracks.has(track.id) ? 'active' : ''}`}
            onClick={() => toggleTrack(track.id)}
            disabled={!isPlaying}
            style={{
              '--track-color': track.color,
              '--glow-opacity': activeTracks.has(track.id) ? 0.4 : 0
            }}
          >
            <div className="track-icon">{track.icon}</div>
            <div className="track-name">{track.name}</div>
            <div className="track-status">
              {activeTracks.has(track.id) ? '● ACTIVE' : '○ Inactive'}
            </div>
          </button>
        ))}
      </div>

      {/* Info */}
      <div className="ambient-info">
        <h3>✨ Features</h3>
        <ul>
          <li><strong>Nahtloses Mixing:</strong> Tracks werden smooth ein- und ausgeblendet (2s Crossfade)</li>
          <li><strong>Auto Mode:</strong> Die Musik entwickelt sich automatisch weiter</li>
          <li><strong>Production Quality:</strong> Hochwertige Synthese mit Tone.js, keine MIDI-Sounds</li>
          <li><strong>Night Drive Vibes:</strong> Relaxte elektrische Sounds mit ordentlichem Bass und sanften Melodien</li>
        </ul>
      </div>
    </div>
  )
}

export default AmbientMusicGenerator
