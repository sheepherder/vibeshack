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

  // Ref for scheduled event ID
  const scheduleIdRef = useRef(null)
  const stepRef = useRef(0)

  const isInitialized = useRef(false)

  // Initialize Tone.js instruments and sequences
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    // Kick drum - deep bass
    const kick = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
    }).toDestination()
    kickRef.current = kick

    // Snare - with noise
    const snare = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
    }).toDestination()
    snareRef.current = snare

    // Hi-hat - short metallic sound
    const hihat = new Tone.MetalSynth({
      frequency: 200,
      envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5
    }).toDestination()
    hihatRef.current = hihat

    // Percussion - rim shot / click
    const perc = new Tone.MembraneSynth({
      pitchDecay: 0.008,
      octaves: 2,
      oscillator: { type: 'square' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
    }).toDestination()
    percRef.current = perc

    // Set BPM
    Tone.getTransport().bpm.value = bpm

    return () => {
      // Cleanup
      Tone.getTransport().stop()
      Tone.getTransport().cancel()

      if (kickRef.current) kickRef.current.dispose()
      if (snareRef.current) snareRef.current.dispose()
      if (hihatRef.current) hihatRef.current.dispose()
      if (percRef.current) percRef.current.dispose()
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
    // Initialize audio context on user interaction
    await Tone.start()

    // Reset step counter
    stepRef.current = 0

    // Define patterns (16 steps = one bar in 4/4)
    const kickPattern = ['C1', null, null, null, null, null, null, null, 'C1', null, null, null, null, null, null, null]
    const snarePattern = [null, null, null, null, 'C1', null, null, null, null, null, null, null, 'C1', null, null, null]
    const hihatPattern = ['C1', null, 'C1', null, 'C1', null, 'C1', null, 'C1', null, 'C1', null, 'C1', null, 'C1', null]
    const percPattern = [null, 'G4', null, null, null, 'G4', null, null, null, 'G4', null, null, null, null, null, null]

    // Schedule repeating event AFTER Tone.start()
    if (!scheduleIdRef.current) {
      scheduleIdRef.current = Tone.getTransport().scheduleRepeat((time) => {
        const step = stepRef.current % 16

        // Trigger drums for this step using the time parameter from Transport
        if (kickPattern[step]) {
          kickRef.current.triggerAttackRelease(kickPattern[step], '8n', time)
        }
        if (snarePattern[step]) {
          // NoiseSynth only needs duration + scheduled time
          snareRef.current.triggerAttackRelease('8n', time)
        }
        if (hihatPattern[step]) {
          // MetalSynth requires the note and the provided time for accurate scheduling
          hihatRef.current.triggerAttackRelease(hihatPattern[step], '32n', time)
        }
        if (percPattern[step]) {
          percRef.current.triggerAttackRelease(percPattern[step], '16n', time)
        }

        stepRef.current++
      }, '16n')
    }

    // Start transport
    Tone.getTransport().start()
    setIsPlaying(true)
  }

  const stopLoop = () => {
    // Stop transport
    Tone.getTransport().stop()
    stepRef.current = 0
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
