import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import './AmbientSoundscape.css'

function AmbientSoundscape() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(90)
  const [volumes, setVolumes] = useState({
    kick: -10,
    snare: -12,
    hihat: -20,
    perc: -15
  })

  // Refs for Tone.js instruments
  const kickRef = useRef(null)
  const snareRef = useRef(null)
  const hihatRef = useRef(null)
  const percRef = useRef(null)
  const loopRef = useRef(null)
  const isInitialized = useRef(false)

  // Initialize Tone.js instruments
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    // Kick drum - deep bass
    kickRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination()

    // Snare - with noise
    snareRef.current = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination()

    // Hi-hat - short metallic sound
    hihatRef.current = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination()

    // Percussion - rim shot / click
    percRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).toDestination()

    // Set BPM
    Tone.getTransport().bpm.value = bpm

    return () => {
      // Cleanup
      if (loopRef.current) loopRef.current.dispose()
      if (kickRef.current) kickRef.current.dispose()
      if (snareRef.current) snareRef.current.dispose()
      if (hihatRef.current) hihatRef.current.dispose()
      if (percRef.current) percRef.current.dispose()
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
    }
  }, [])

  // Update volumes when changed
  useEffect(() => {
    if (kickRef.current) kickRef.current.volume.value = volumes.kick
    if (snareRef.current) snareRef.current.volume.value = volumes.snare
    if (hihatRef.current) hihatRef.current.volume.value = volumes.hihat
    if (percRef.current) percRef.current.volume.value = volumes.perc
  }, [volumes])

  // Update BPM
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm
  }, [bpm])

  const startLoop = async () => {
    await Tone.start()

    // Create a simple drum pattern
    loopRef.current = new Tone.Loop((time) => {
      // Kick on beats 1 and 3 (0 and 2 in 16th notes)
      kickRef.current?.triggerAttackRelease('C1', '8n', time)
      kickRef.current?.triggerAttackRelease('C1', '8n', time + Tone.Time('2n').toSeconds())

      // Snare on beats 2 and 4
      snareRef.current?.triggerAttackRelease('8n', time + Tone.Time('4n').toSeconds())
      snareRef.current?.triggerAttackRelease('8n', time + Tone.Time('2n').toSeconds() + Tone.Time('4n').toSeconds())

      // Hi-hat on every 8th note
      for (let i = 0; i < 8; i++) {
        hihatRef.current?.triggerAttackRelease('32n', time + Tone.Time('8n').toSeconds() * i)
      }

      // Percussion accent on offbeat
      percRef.current?.triggerAttackRelease('G4', '16n', time + Tone.Time('8n').toSeconds())
      percRef.current?.triggerAttackRelease('G4', '16n', time + Tone.Time('4n').toSeconds() + Tone.Time('8n').toSeconds())
      percRef.current?.triggerAttackRelease('G4', '16n', time + Tone.Time('2n').toSeconds() + Tone.Time('8n').toSeconds())

    }, '1m') // Loop every measure (1m = 1 measure)

    loopRef.current.start(0)
    Tone.getTransport().start()
    setIsPlaying(true)
  }

  const stopLoop = () => {
    Tone.getTransport().stop()
    if (loopRef.current) {
      loopRef.current.stop()
      loopRef.current.dispose()
      loopRef.current = null
    }
    setIsPlaying(false)
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopLoop()
    } else {
      startLoop()
    }
  }

  const handleVolumeChange = (instrument, value) => {
    setVolumes(prev => ({
      ...prev,
      [instrument]: parseFloat(value)
    }))
  }

  return (
    <div className="container ambient-soundscape">
      <div className="header">
        <h1>Ambient Soundscape</h1>
        <p className="subtitle">Relax to simple, looping beats</p>
      </div>

      <div className="controls-section">
        <div className="play-controls">
          <button
            className={`btn-play ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>

          <div className="bpm-control">
            <label>BPM: {bpm}</label>
            <input
              type="range"
              min="60"
              max="140"
              value={bpm}
              onChange={(e) => setBpm(parseInt(e.target.value))}
            />
          </div>
        </div>

        <div className="mixer-section">
          <h3>Mix</h3>
          <div className="mixer-controls">
            {Object.entries(volumes).map(([instrument, volume]) => (
              <div key={instrument} className="volume-control">
                <label>{instrument.charAt(0).toUpperCase() + instrument.slice(1)}</label>
                <input
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={volume}
                  onChange={(e) => handleVolumeChange(instrument, e.target.value)}
                  orient="vertical"
                />
                <span className="volume-value">{volume} dB</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="info-section">
        <h3>Pattern</h3>
        <div className="pattern-display">
          <div className="pattern-row">
            <span className="pattern-label">Kick:</span>
            <span className="pattern-beats">● ○ ● ○</span>
          </div>
          <div className="pattern-row">
            <span className="pattern-label">Snare:</span>
            <span className="pattern-beats">○ ● ○ ●</span>
          </div>
          <div className="pattern-row">
            <span className="pattern-label">Hi-Hat:</span>
            <span className="pattern-beats">● ● ● ● ● ● ● ●</span>
          </div>
          <div className="pattern-row">
            <span className="pattern-label">Perc:</span>
            <span className="pattern-beats">○ ● ○ ● ○ ● ○ ○</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AmbientSoundscape
