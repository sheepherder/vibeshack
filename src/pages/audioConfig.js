// Audio Configuration für den Ambient Music Generator

export const BPM = 82

// Track Volume Mapping (in dB)
export const TRACK_VOLUMES = {
  'deep-bass': -8,
  'kick-pulse': -12,
  'ambient-pad': -18,
  'synth-lead': -20,
  'hats': -25,
  'texture': -22
}

// Track Definitionen
export const TRACK_DEFINITIONS = [
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

// Synth Konfigurationen
export const SYNTH_CONFIGS = {
  'deep-bass': {
    type: 'FMSynth',
    options: {
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
    },
    pattern: ['C1', 'C1', 'G0', 'C1', 'Eb1', 'C1', 'G0', 'C1'],
    noteLength: '4n',
    subdivision: '2n'
  },
  'kick-pulse': {
    type: 'MembraneSynth',
    options: {
      pitchDecay: 0.08,
      octaves: 4,
      envelope: {
        attack: 0.001,
        decay: 0.3,
        sustain: 0,
        release: 0.5
      }
    },
    pattern: [0, null, null, null, 0, null, null, null],
    noteValue: 'C1',
    noteLength: '8n',
    subdivision: '8n'
  },
  'ambient-pad': {
    type: 'PolySynth',
    options: {
      oscillator: {
        type: 'sine'
      },
      envelope: {
        attack: 2,
        decay: 1,
        sustain: 0.5,
        release: 3
      }
    },
    chords: [
      ['C3', 'Eb3', 'G3', 'Bb3'],
      ['Ab2', 'C3', 'Eb3', 'G3'],
      ['F2', 'Ab2', 'C3', 'Eb3'],
      ['G2', 'Bb2', 'D3', 'F3']
    ],
    noteLength: '2m',
    subdivision: '1m',
    effects: {
      reverb: {
        decay: 4,
        wet: 0.5
      }
    }
  },
  'synth-lead': {
    type: 'MonoSynth',
    options: {
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
    },
    pattern: ['C4', 'Eb4', 'G4', 'Bb4', 'G4', 'Eb4', 'D4', 'C4'],
    noteLength: '4n',
    subdivision: '4n',
    effects: {
      reverb: {
        decay: 3,
        wet: 0.3
      }
    }
  },
  'hats': {
    type: 'MetalSynth',
    options: {
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
    },
    pattern: [0.3, null, 0.2, null, 0.3, null, 0.2, 0.1],
    noteLength: '16n',
    subdivision: '16n'
  },
  'texture': {
    type: 'NoiseSynth',
    options: {
      noise: {
        type: 'pink'
      },
      envelope: {
        attack: 1,
        decay: 2,
        sustain: 0.3,
        release: 3
      }
    },
    pattern: [0, null, null, null, null, null, null, 0],
    noteLength: '4m',
    subdivision: '2m',
    effects: {
      filter: {
        frequency: 800,
        type: 'lowpass'
      },
      reverb: {
        decay: 5,
        wet: 0.7
      }
    }
  }
}
