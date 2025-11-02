import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import './AmbientSoundscape.css'

const STEPS = 16
const DEFAULT_BPM = 90

const INSTRUMENT_CONFIG = {
  kick: {
    label: 'Kick',
    defaultVolume: -10,
    defaultPattern: [true, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false],
    create: () =>
      new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 4,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 }
      }).toDestination(),
    trigger: (synth, time) => synth.triggerAttackRelease('C1', '8n', time)
  },
  snare: {
    label: 'Snare',
    defaultVolume: -12,
    defaultPattern: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
    create: () =>
      new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
      }).toDestination(),
    trigger: (synth, time) => synth.triggerAttackRelease('8n', time)
  },
  hihat: {
    label: 'Hi-Hat',
    defaultVolume: -20,
    defaultPattern: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
    create: () =>
      new Tone.MetalSynth({
        frequency: 200,
        envelope: { attack: 0.001, decay: 0.1, release: 0.05 },
        harmonicity: 5.1,
        modulationIndex: 32,
        resonance: 4000,
        octaves: 1.5
      }).toDestination(),
    trigger: (synth, time) => synth.triggerAttackRelease('C1', '32n', time)
  },
  perc: {
    label: 'Perc',
    defaultVolume: -15,
    defaultPattern: [false, true, false, false, false, true, false, false, false, true, false, false, false, false, false, false],
    create: () =>
      new Tone.MembraneSynth({
        pitchDecay: 0.008,
        octaves: 2,
        oscillator: { type: 'square' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 }
      }).toDestination(),
    trigger: (synth, time) => synth.triggerAttackRelease('G4', '16n', time)
  }
}

const INSTRUMENT_KEYS = Object.keys(INSTRUMENT_CONFIG)

const createInitialVolumes = () =>
  INSTRUMENT_KEYS.reduce((acc, key) => {
    acc[key] = INSTRUMENT_CONFIG[key].defaultVolume
    return acc
  }, {})

const createInitialPatterns = () =>
  INSTRUMENT_KEYS.reduce((acc, key) => {
    acc[key] = [...INSTRUMENT_CONFIG[key].defaultPattern]
    return acc
  }, {})

function AmbientSoundscape() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [volumes, setVolumes] = useState(createInitialVolumes)
  const [patterns, setPatterns] = useState(createInitialPatterns)
  const [currentStep, setCurrentStep] = useState(-1)

  const instrumentRefs = useRef({})
  const scheduleIdRef = useRef(null)
  const stepRef = useRef(0)
  const patternRef = useRef(patterns)
  const isPaintingRef = useRef(false)
  const paintValueRef = useRef(false)

  const isInitialized = useRef(false)

  useEffect(() => {
    patternRef.current = patterns
  }, [patterns])

  useEffect(() => {
    const stopPainting = () => {
      isPaintingRef.current = false
    }

    window.addEventListener('pointerup', stopPainting)
    window.addEventListener('pointercancel', stopPainting)

    return () => {
      window.removeEventListener('pointerup', stopPainting)
      window.removeEventListener('pointercancel', stopPainting)
    }
  }, [])

  // Initialize Tone.js instruments and sequences
  useEffect(() => {
    if (isInitialized.current) return
    isInitialized.current = true

    INSTRUMENT_KEYS.forEach((key) => {
      instrumentRefs.current[key] = INSTRUMENT_CONFIG[key].create()
    })

    Tone.getTransport().bpm.value = DEFAULT_BPM

    return () => {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()

      if (scheduleIdRef.current !== null) {
        Tone.getTransport().clear(scheduleIdRef.current)
        scheduleIdRef.current = null
      }

      INSTRUMENT_KEYS.forEach((key) => {
        if (instrumentRefs.current[key]) {
          instrumentRefs.current[key].dispose()
        }
      })
    }
  }, [])

  // Update volumes when changed
  useEffect(() => {
    INSTRUMENT_KEYS.forEach((instrument) => {
      const synth = instrumentRefs.current[instrument]
      if (synth) {
        synth.volume.value = volumes[instrument]
      }
    })
  }, [volumes])

  // Update BPM
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm
  }, [bpm])

  const startLoop = async () => {
    await Tone.start()

    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    stepRef.current = 0
    setCurrentStep(0)

    if (!scheduleIdRef.current) {
      scheduleIdRef.current = Tone.getTransport().scheduleRepeat((time) => {
        const step = stepRef.current % STEPS

        INSTRUMENT_KEYS.forEach((instrument) => {
          const synth = instrumentRefs.current[instrument]
          if (!synth) return

          if (patternRef.current[instrument][step]) {
            INSTRUMENT_CONFIG[instrument].trigger(synth, time)
          }
        })

        Tone.Draw.schedule(() => {
          setCurrentStep(step)
        }, time)

        stepRef.current += 1
      }, '16n')
    }

    Tone.getTransport().start(undefined, 0)
    setIsPlaying(true)
  }

  const stopLoop = () => {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    stepRef.current = 0
    setIsPlaying(false)
    setCurrentStep(-1)

    if (scheduleIdRef.current !== null) {
      Tone.getTransport().clear(scheduleIdRef.current)
      scheduleIdRef.current = null
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      stopLoop()
    } else {
      startLoop()
    }
  }

  const handleVolumeChange = (instrument, value) => {
    setVolumes((prev) => ({
      ...prev,
      [instrument]: parseFloat(value)
    }))
  }

  const setStepValue = (instrument, index, value) => {
    setPatterns((prev) => {
      const row = prev[instrument]

      if (row[index] === value) {
        return prev
      }

      const updatedRow = [...row]
      updatedRow[index] = value

      return {
        ...prev,
        [instrument]: updatedRow
      }
    })
  }

  const toggleStep = (instrument, index) => {
    const currentValue = patternRef.current[instrument][index]
    setStepValue(instrument, index, !currentValue)
  }

  const handleStepPointerDown = (event, instrument, index) => {
    event.preventDefault()

    const currentValue = patternRef.current[instrument][index]
    const newValue = !currentValue

    paintValueRef.current = newValue
    isPaintingRef.current = true

    setStepValue(instrument, index, newValue)
  }

  const handleStepPointerEnter = (event, instrument, index) => {
    if (!isPaintingRef.current) return

    event.preventDefault()

    const targetValue = paintValueRef.current
    setStepValue(instrument, index, targetValue)
  }

  const playheadStyle = {
    '--step-fraction': currentStep >= 0 ? (currentStep + 0.5) / STEPS : 0,
    '--playhead-opacity': isPlaying && currentStep >= 0 ? 1 : 0,
    '--step-duration': `${60 / (bpm * 4)}s`
  }

  const sequencerClassName = `sequencer${isPlaying ? ' is-playing' : ''}`

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
      </div>

      <div className="sequencer-section">
        <div className="section-header">
          <h3>Step Sequencer</h3>
          <p>Schalte Schritte ein oder aus und forme dein eigenes Pattern.</p>
        </div>
        <div className={sequencerClassName} style={playheadStyle}>
          <div className="sequencer-playhead" aria-hidden="true" />
          {INSTRUMENT_KEYS.map((instrument) => (
            <div key={instrument} className="sequencer-row">
              <div className="sequencer-info">
                <div className="sequencer-label">{INSTRUMENT_CONFIG[instrument].label}</div>
                <input
                  type="range"
                  min="-40"
                  max="0"
                  step="1"
                  value={volumes[instrument]}
                  onChange={(e) => handleVolumeChange(instrument, e.target.value)}
                  aria-label={`${INSTRUMENT_CONFIG[instrument].label} volume`}
                />
                <span className="volume-value">{volumes[instrument]} dB</span>
              </div>
              <div className="sequencer-steps">
                {patterns[instrument].map((isActive, index) => {
                  const isAccent = index % 4 === 0
                  const isCurrent = currentStep === index

                  return (
                    <button
                      key={index}
                      type="button"
                      className={`sequencer-step${isActive ? ' active' : ''}${isAccent ? ' accent' : ''}${isCurrent ? ' current' : ''}`}
                      onClick={(event) => {
                        if (event.detail === 0) {
                          toggleStep(instrument, index)
                        }
                      }}
                      onPointerDown={(event) => handleStepPointerDown(event, instrument, index)}
                      onPointerEnter={(event) => handleStepPointerEnter(event, instrument, index)}
                      aria-pressed={isActive}
                      aria-label={`${INSTRUMENT_CONFIG[instrument].label} Step ${index + 1}`}
                    />
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AmbientSoundscape
