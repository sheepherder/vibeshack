import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import './AmbientSoundscape.css'

const STEPS = 16
const DEFAULT_BPM = 90
const PIANO_ROLL_ROWS = 16 // Number of notes in piano roll (C2 to D#3)
const BASE_NOTE = 36 // C2 (MIDI note number)

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

const createInitialBassNotes = () =>
  Array(PIANO_ROLL_ROWS)
    .fill(null)
    .map(() => [])

const getNoteAtPosition = (notes, column) =>
  notes.find((note) => column >= note.start && column < note.end)

const removeNoteAtPosition = (notes, column) =>
  notes.filter((note) => !(column >= note.start && column < note.end))

const notesAreEqual = (a, b) => {
  if (a === b) return true
  if (a.length !== b.length) return false

  for (let index = 0; index < a.length; index += 1) {
    const first = a[index]
    const second = b[index]
    if (first.start !== second.start || first.end !== second.end) {
      return false
    }
  }

  return true
}

const insertOrReplaceNote = (notes, newNote) => {
  const filtered = notes.filter((note) => note.end <= newNote.start || note.start >= newNote.end)
  const updated = [...filtered, newNote].sort((a, b) => a.start - b.start)

  return notesAreEqual(updated, notes) ? notes : updated
}

const applyMonophonicNote = (rows, rowIndex, newNote) => {
  let hasChanged = false

  const updatedRows = rows.map((rowNotes, index) => {
    if (index === rowIndex) {
      const updated = insertOrReplaceNote(rowNotes, newNote)
      const isSame = notesAreEqual(updated, rowNotes)
      if (!isSame) {
        hasChanged = true
      }
      return isSame ? rowNotes : updated
    }

    const filtered = rowNotes.filter(
      (note) => note.end <= newNote.start || note.start >= newNote.end
    )
    const isSame = notesAreEqual(filtered, rowNotes)

    if (!isSame) {
      hasChanged = true
    }

    return isSame ? rowNotes : filtered
  })

  return hasChanged ? updatedRows : rows
}

function AmbientSoundscape() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(DEFAULT_BPM)
  const [volumes, setVolumes] = useState(createInitialVolumes)
  const [patterns, setPatterns] = useState(createInitialPatterns)
  const [currentStep, setCurrentStep] = useState(-1)
  const [playheadProgress, setPlayheadProgress] = useState(0)

  // Piano roll / bassline state
  const [basslineNotes, setBasslineNotes] = useState(createInitialBassNotes)
  const [bassEnabled, setBassEnabled] = useState(true)
  const [bassVolume, setBassVolume] = useState(-12)
  const [glideAmount, setGlideAmount] = useState(0.1) // Portamento time in seconds

  const instrumentRefs = useRef({})
  const bassSynthRef = useRef(null)
  const bassScheduleIdRef = useRef(null)
  const scheduleIdRef = useRef(null)
  const stepRef = useRef(0)
  const patternRef = useRef(patterns)
  const basslineNotesRef = useRef(basslineNotes)
  const bassEnabledRef = useRef(bassEnabled)
  const isPaintingRef = useRef(false)
  const paintValueRef = useRef(false)
  const bassInteractionRef = useRef({
    mode: null,
    row: null,
    anchorCol: null,
    noteStart: null,
    noteEnd: null
  })
  const animationFrameRef = useRef(null)
  const lastProgressRef = useRef(0)
  const sequencerRef = useRef(null)
  const pianoRollRef = useRef(null)
  const playheadGeometryRef = useRef({ offset: 0, width: 0 })
  const [playheadGeometry, setPlayheadGeometry] = useState({ offset: 0, width: 0 })

  const loopTicksRef = useRef(Tone.Time('16n').toTicks() * STEPS)

  const isInitialized = useRef(false)

  useEffect(() => {
    patternRef.current = patterns
  }, [patterns])

  useEffect(() => {
    basslineNotesRef.current = basslineNotes
  }, [basslineNotes])

  useEffect(() => {
    bassEnabledRef.current = bassEnabled
  }, [bassEnabled])

  useEffect(() => {
    const stopPainting = () => {
      isPaintingRef.current = false
      bassInteractionRef.current = {
        mode: null,
        row: null,
        anchorCol: null,
        noteStart: null,
        noteEnd: null
      }
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

    // Monophonen Bass-Synth mit Portamento erstellen
    bassSynthRef.current = new Tone.MonoSynth({
      oscillator: { type: 'sawtooth' },
      filter: {
        Q: 2,
        type: 'lowpass',
        rolloff: -24
      },
      envelope: {
        attack: 0.005,
        decay: 0.3,
        sustain: 0.6,
        release: 0.8
      },
      filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.4,
        release: 0.8,
        baseFrequency: 80,
        octaves: 3
      },
      portamento: glideAmount
    }).toDestination()
    bassSynthRef.current.volume.value = -12

    Tone.getTransport().bpm.value = DEFAULT_BPM

    return () => {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()

      if (scheduleIdRef.current !== null) {
        Tone.getTransport().clear(scheduleIdRef.current)
        scheduleIdRef.current = null
      }

      if (bassScheduleIdRef.current !== null) {
        Tone.getTransport().clear(bassScheduleIdRef.current)
        bassScheduleIdRef.current = null
      }

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      INSTRUMENT_KEYS.forEach((key) => {
        if (instrumentRefs.current[key]) {
          instrumentRefs.current[key].dispose()
        }
      })

      if (bassSynthRef.current) {
        bassSynthRef.current.dispose()
      }
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

  // Update bass volume
  useEffect(() => {
    if (bassSynthRef.current) {
      bassSynthRef.current.volume.value = bassVolume
    }
  }, [bassVolume])

  // Update bass glide amount (portamento)
  useEffect(() => {
    if (bassSynthRef.current) {
      bassSynthRef.current.set({ portamento: glideAmount })
    }
  }, [glideAmount])

  // Update BPM
  useEffect(() => {
    Tone.getTransport().bpm.value = bpm
  }, [bpm])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!sequencerRef.current && !pianoRollRef.current) return

    // Use sequencer or piano roll as reference (both have same layout)
    const referenceElement = sequencerRef.current || pianoRollRef.current
    const stepsElement = referenceElement.querySelector('.sequencer-steps') ||
                        referenceElement.querySelector('.piano-roll-cells')
    if (!stepsElement) return

    const updateGeometry = () => {
      const containerRect = referenceElement.getBoundingClientRect()
      const stepsRect = stepsElement.getBoundingClientRect()

      const offset = stepsRect.left - containerRect.left
      const width = stepsRect.width
      const previous = playheadGeometryRef.current

      if (Math.abs(previous.offset - offset) > 0.5 || Math.abs(previous.width - width) > 0.5) {
        playheadGeometryRef.current = { offset, width }
        setPlayheadGeometry({ offset, width })
      }
    }

    updateGeometry()

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateGeometry) : null
    if (resizeObserver) {
      resizeObserver.observe(stepsElement)
    }

    window.addEventListener('resize', updateGeometry)

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', updateGeometry)
    }
  }, [])

  const startLoop = async () => {
    await Tone.start()

    if (scheduleIdRef.current !== null) {
      Tone.getTransport().clear(scheduleIdRef.current)
      scheduleIdRef.current = null
    }

    if (bassScheduleIdRef.current !== null) {
      Tone.getTransport().clear(bassScheduleIdRef.current)
      bassScheduleIdRef.current = null
    }

    Tone.getTransport().position = 0
    stepRef.current = 0
    setCurrentStep(0)
    setPlayheadProgress(0)
    lastProgressRef.current = 0

    // Schedule drum patterns
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

    // Schedule bassline
    if (!bassScheduleIdRef.current) {
      const stepDurationSeconds = Tone.Time('16n').toSeconds()

      bassScheduleIdRef.current = Tone.getTransport().scheduleRepeat((time) => {
        const step = stepRef.current % STEPS

        if (!bassEnabledRef.current || !bassSynthRef.current) return

        let noteTriggered = false

        for (let row = 0; row < PIANO_ROLL_ROWS && !noteTriggered; row++) {
          const rowNotes = basslineNotesRef.current[row]

          for (let index = 0; index < rowNotes.length; index += 1) {
            const note = rowNotes[index]
            if (note.start !== step) continue

            const noteLength = Math.max(1, note.end - note.start)
            const durationSeconds = stepDurationSeconds * noteLength
            const midiNote = BASE_NOTE + (PIANO_ROLL_ROWS - 1 - row)
            const frequency = Tone.Frequency(midiNote, 'midi').toFrequency()

            bassSynthRef.current.triggerAttackRelease(frequency, durationSeconds, time)
            noteTriggered = true
            break
          }
        }
      }, '16n')
    }

    Tone.getTransport().start()
    setIsPlaying(true)
  }

  const stopLoop = () => {
    Tone.getTransport().stop()
    Tone.getTransport().position = 0
    stepRef.current = 0
    if (scheduleIdRef.current !== null) {
      Tone.getTransport().clear(scheduleIdRef.current)
      scheduleIdRef.current = null
    }
    if (bassScheduleIdRef.current !== null) {
      Tone.getTransport().clear(bassScheduleIdRef.current)
      bassScheduleIdRef.current = null
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsPlaying(false)
    setCurrentStep(-1)
    setPlayheadProgress(0)
    lastProgressRef.current = 0
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

  // Piano Roll / Bassline functions
  const updateRowNotes = (rowIndex, updater) => {
    setBasslineNotes((prev) => {
      const currentRow = prev[rowIndex]
      const nextRow = updater(currentRow)

      if (nextRow === currentRow) {
        return prev
      }

      return prev.map((rowNotes, index) => (index === rowIndex ? nextRow : rowNotes))
    })
  }

  const toggleBassNote = (row, col) => {
    const existingNote = getNoteAtPosition(basslineNotesRef.current[row], col)

    if (existingNote) {
      updateRowNotes(row, (notes) => {
        const updated = removeNoteAtPosition(notes, col)
        return updated.length === notes.length ? notes : updated
      })
    } else {
      const newNote = {
        start: col,
        end: Math.min(STEPS, col + 1)
      }

      setBasslineNotes((prev) => applyMonophonicNote(prev, row, newNote))
    }
  }

  const handleBassNotePointerDown = (event, row, col) => {
    event.preventDefault()

    const rowNotes = basslineNotesRef.current[row]
    const existingNote = getNoteAtPosition(rowNotes, col)

    if (existingNote) {
      bassInteractionRef.current = {
        mode: 'erase',
        row: null,
        anchorCol: null,
        noteStart: null,
        noteEnd: null
      }

      updateRowNotes(row, (notes) => {
        const updated = removeNoteAtPosition(notes, col)
        return updated.length === notes.length ? notes : updated
      })
    } else {
      const start = col
      const end = Math.min(STEPS, col + 1)

      bassInteractionRef.current = {
        mode: 'draw',
        row,
        anchorCol: col,
        noteStart: start,
        noteEnd: end
      }

      setBasslineNotes((prev) => applyMonophonicNote(prev, row, { start, end }))
    }
  }

  const handleBassNotePointerEnter = (event, row, col) => {
    const interaction = bassInteractionRef.current
    if (!interaction.mode) return

    event.preventDefault()

    if (interaction.mode === 'erase') {
      updateRowNotes(row, (notes) => {
        const updated = removeNoteAtPosition(notes, col)
        return updated.length === notes.length ? notes : updated
      })
      return
    }

    if (interaction.mode === 'draw' && interaction.row === row) {
      const anchor = interaction.anchorCol
      const newStart = Math.max(0, Math.min(anchor, col))
      const newEnd = Math.min(STEPS, Math.max(anchor, col) + 1)

      if (newStart === interaction.noteStart && newEnd === interaction.noteEnd) {
        return
      }

      interaction.noteStart = newStart
      interaction.noteEnd = newEnd

      setBasslineNotes((prev) => applyMonophonicNote(prev, row, { start: newStart, end: newEnd }))
    }
  }

  const handleBassVolumeChange = (value) => {
    setBassVolume(parseFloat(value))
  }

  const handleGlideChange = (value) => {
    setGlideAmount(parseFloat(value))
  }

  useEffect(() => {
    if (!isPlaying) return

    const updateProgress = () => {
      const ticks = Tone.getTransport().ticks
      const loopTicks = loopTicksRef.current
      if (loopTicks === 0) {
        if (lastProgressRef.current !== 0) {
          lastProgressRef.current = 0
          setPlayheadProgress(0)
        }
      } else {
        const fraction = (ticks % loopTicks) / loopTicks
        if (Math.abs(fraction - lastProgressRef.current) > 0.001) {
          lastProgressRef.current = fraction
          setPlayheadProgress(fraction)
        }
      }
      animationFrameRef.current = requestAnimationFrame(updateProgress)
    }

    animationFrameRef.current = requestAnimationFrame(updateProgress)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isPlaying])

  const stepCenterOffset = 1 / (STEPS * 2)
  const travelRange = Math.max(0, 1 - stepCenterOffset * 2)
  const playheadOffset = isPlaying
    ? stepCenterOffset + Math.min(playheadProgress, 1) * travelRange
    : stepCenterOffset

  const playheadStyle = {
    '--playhead-progress': playheadOffset,
    '--playhead-opacity': isPlaying ? 1 : 0,
    '--playhead-offset': `${playheadGeometry.offset}px`,
    '--playhead-width': `${playheadGeometry.width}px`
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
      </div>

      <div className="sequencer-section">
        <div className="section-header">
          <h3>Step Sequencer</h3>
        </div>
        <div ref={sequencerRef} className="sequencer" style={playheadStyle}>
          <div className="sequencer-playhead" aria-hidden="true" />
          {INSTRUMENT_KEYS.map((instrument) => (
            <div key={instrument} className="sequencer-row">
              <div className="sequencer-label">
                <span>{INSTRUMENT_CONFIG[instrument].label}</span>
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

      <div className="piano-roll-section">
        <div className="section-header">
          <h3>Bassline Piano Roll</h3>
        </div>
        <div className="piano-roll-controls">
          <div className="bass-control">
            <label>
              <input
                type="checkbox"
                checked={bassEnabled}
                onChange={(e) => setBassEnabled(e.target.checked)}
              />
              <span>Bass aktiviert</span>
            </label>
          </div>
          <div className="bass-control">
            <label>Volume: {bassVolume} dB</label>
            <input
              type="range"
              min="-40"
              max="0"
              step="1"
              value={bassVolume}
              onChange={(e) => handleBassVolumeChange(e.target.value)}
              disabled={!bassEnabled}
            />
          </div>
          <div className="bass-control">
            <label>Glide: {(glideAmount * 1000).toFixed(0)} ms</label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={glideAmount}
              onChange={(e) => handleGlideChange(e.target.value)}
              disabled={!bassEnabled}
            />
          </div>
        </div>
        <div ref={pianoRollRef} className="piano-roll" style={playheadStyle}>
          <div className="piano-roll-playhead" aria-hidden="true" />
          {basslineNotes.map((rowNotes, rowIndex) => {
            const midiNote = BASE_NOTE + (PIANO_ROLL_ROWS - 1 - rowIndex)
            const noteName = Tone.Frequency(midiNote, 'midi').toNote()
            const isBlackKey = noteName.includes('#')

            return (
              <div key={rowIndex} className="piano-roll-row">
                <div className={`piano-roll-label ${isBlackKey ? 'black-key' : 'white-key'}`}>
                  <span>{noteName}</span>
                </div>
                <div className="piano-roll-cells">
                  {Array.from({ length: STEPS }).map((_, colIndex) => {
                    const isAccent = colIndex % 4 === 0
                    const note = getNoteAtPosition(rowNotes, colIndex)
                    const isActive = Boolean(note)
                    const isStart = note ? note.start === colIndex : false
                    const isEnd = note ? note.end - 1 === colIndex : false

                    let notePartClass = ''
                    if (note) {
                      if (isStart && isEnd) {
                        notePartClass = ' note-single'
                      } else if (isStart) {
                        notePartClass = ' note-start'
                      } else if (isEnd) {
                        notePartClass = ' note-end'
                      } else {
                        notePartClass = ' note-middle'
                      }
                    }

                    return (
                      <button
                        key={colIndex}
                        type="button"
                        className={`piano-roll-cell${isActive ? ' active' : ''}${isAccent ? ' accent' : ''}${notePartClass}`}
                        onClick={(event) => {
                          if (event.detail === 0) {
                            toggleBassNote(rowIndex, colIndex)
                          }
                        }}
                        onPointerDown={(event) => handleBassNotePointerDown(event, rowIndex, colIndex)}
                        onPointerEnter={(event) => handleBassNotePointerEnter(event, rowIndex, colIndex)}
                        aria-pressed={isActive}
                        aria-label={`${noteName} Step ${colIndex + 1}`}
                      />
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AmbientSoundscape
