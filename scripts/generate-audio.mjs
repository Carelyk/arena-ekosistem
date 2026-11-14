/**
 * Generates original, royalty-free WAV assets for the game.
 * Run with: node scripts/generate-audio.mjs
 *
 * No third-party samples are used. Every sound is synthesised here from sine,
 * triangle, and square waves, so the repository only ships original audio.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 22050;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");

function clamp(value) {
  return Math.max(-1, Math.min(1, value));
}

function wavBuffer(samples) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples.length; i += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[i]) * 32767), 44 + i * 2);
  }
  return buffer;
}

function envelope(t, duration, attack = 0.006, release = 0.05) {
  if (t < attack) return t / attack;
  if (t > duration - release) return Math.max(0, (duration - t) / release);
  return 1;
}

function wave(kind, phase) {
  if (kind === "square") return Math.sign(Math.sin(phase)) * 0.55;
  if (kind === "triangle") return (2 / Math.PI) * Math.asin(Math.sin(phase));
  return Math.sin(phase);
}

function toneBuffer({ duration, from, to = from, kind = "sine", volume = 0.3, vibrato = 0 }) {
  const length = Math.floor(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);
  let phase = 0;
  for (let i = 0; i < length; i += 1) {
    const t = i / SAMPLE_RATE;
    const progress = t / duration;
    const frequency = from + (to - from) * progress;
    phase += (2 * Math.PI * frequency) / SAMPLE_RATE;
    const mod = vibrato ? 1 + 0.06 * Math.sin(2 * Math.PI * 9 * t) : 1;
    samples[i] = wave(kind, phase) * envelope(t, duration) * volume * mod;
  }
  return samples;
}

function concat(parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const samples = new Float32Array(total);
  let offset = 0;
  for (const part of parts) {
    samples.set(part, offset);
    offset += part.length;
  }
  return samples;
}

function sequence(notes) {
  return concat(notes.map((note) => toneBuffer(note)));
}

function mix(base, overlay, offsetSeconds = 0, gain = 1) {
  const start = Math.floor(offsetSeconds * SAMPLE_RATE);
  const samples = new Float32Array(Math.max(base.length, start + overlay.length));
  samples.set(base, 0);
  for (let i = 0; i < overlay.length; i += 1) {
    samples[start + i] += overlay[i] * gain;
  }
  return samples;
}

function musicLoop() {
  // 100 bpm, 20 beats = 12 s. Chords: C, Am, F, G (5 beats each).
  const beat = 0.6;
  const chords = [
    { root: 130.81, notes: [261.63, 329.63, 392.0] }, // C
    { root: 110.0, notes: [220.0, 261.63, 329.63] }, // Am
    { root: 87.31, notes: [174.61, 220.0, 261.63] }, // F
    { root: 98.0, notes: [196.0, 246.94, 293.66] }, // G
  ];

  let samples = new Float32Array(Math.floor(beat * 20 * SAMPLE_RATE));
  const melody = [0, 2, 1, 2, 0, 2, 1, 2, 0, 1, 2, 1, 0, 2, 1, 2, 0, 2, 1, 2];

  chords.forEach((chord, chordIndex) => {
    const chordStart = chordIndex * 5 * beat;
    for (let b = 0; b < 5; b += 1) {
      const start = chordStart + b * beat;
      const bass = toneBuffer({
        duration: beat * 0.9,
        from: chord.root,
        kind: "triangle",
        volume: 0.12,
      });
      samples = mix(samples, bass, start, 1);
      // Two soft arpeggio notes per beat.
      for (let half = 0; half < 2; half += 1) {
        const noteIndex = (chordIndex * 5 + b) * 2 + half;
        const note = chord.notes[melody[noteIndex % melody.length] % chord.notes.length];
        const pluck = toneBuffer({
          duration: beat * 0.42,
          from: note * 2,
          kind: "sine",
          volume: 0.09,
          vibrato: 0.2,
        });
        samples = mix(samples, pluck, start + half * beat * 0.5, 0.9);
      }
    }
  });

  // Gentle loop-seam fade to avoid clicks.
  const fade = Math.floor(0.05 * SAMPLE_RATE);
  for (let i = 0; i < fade; i += 1) {
    const factor = i / fade;
    samples[i] *= factor;
    samples[samples.length - 1 - i] *= factor;
  }
  return samples;
}

const assets = {
  "button-click": sequence([
    { duration: 0.055, from: 660, to: 620, kind: "triangle", volume: 0.22 },
  ]),
  "card-pickup": toneBuffer({
    duration: 0.11,
    from: 420,
    to: 760,
    kind: "sine",
    volume: 0.26,
  }),
  "card-drop": sequence([
    { duration: 0.07, from: 520, kind: "triangle", volume: 0.24 },
    { duration: 0.09, from: 780, to: 700, kind: "sine", volume: 0.22 },
  ]),
  "card-return": toneBuffer({
    duration: 0.16,
    from: 520,
    to: 280,
    kind: "triangle",
    volume: 0.2,
  }),
  correct: sequence([
    { duration: 0.09, from: 523.25, kind: "triangle", volume: 0.28 },
    { duration: 0.09, from: 659.25, kind: "triangle", volume: 0.28 },
    { duration: 0.16, from: 783.99, kind: "triangle", volume: 0.3 },
  ]),
  wrong: sequence([
    { duration: 0.14, from: 190, to: 170, kind: "square", volume: 0.18 },
    { duration: 0.16, from: 150, to: 120, kind: "square", volume: 0.16 },
  ]),
  freeze: toneBuffer({
    duration: 0.32,
    from: 640,
    to: 180,
    kind: "sine",
    volume: 0.22,
    vibrato: 1,
  }),
  "fastest-bonus": sequence([
    { duration: 0.07, from: 1046.5, kind: "sine", volume: 0.22 },
    { duration: 0.07, from: 1318.5, kind: "sine", volume: 0.22 },
    { duration: 0.07, from: 1568, kind: "sine", volume: 0.22 },
    { duration: 0.14, from: 2093, kind: "sine", volume: 0.2 },
  ]),
  countdown: sequence([
    { duration: 0.1, from: 880, kind: "triangle", volume: 0.25 },
    { duration: 0.04, from: 660, kind: "triangle", volume: 0.12 },
  ]),
  "time-warning": sequence([
    { duration: 0.1, from: 1046.5, kind: "square", volume: 0.16 },
    { duration: 0.06, from: 0, kind: "sine", volume: 0 },
    { duration: 0.1, from: 880, kind: "square", volume: 0.16 },
  ]),
  "time-up": toneBuffer({
    duration: 0.6,
    from: 330,
    to: 150,
    kind: "triangle",
    volume: 0.3,
  }),
  winner: sequence([
    { duration: 0.14, from: 523.25, kind: "triangle", volume: 0.28 },
    { duration: 0.14, from: 659.25, kind: "triangle", volume: 0.28 },
    { duration: 0.14, from: 783.99, kind: "triangle", volume: 0.28 },
    { duration: 0.36, from: 1046.5, kind: "triangle", volume: 0.3 },
  ]),
  "badge-unlocked": sequence([
    { duration: 0.1, from: 783.99, kind: "sine", volume: 0.22 },
    { duration: 0.1, from: 1046.5, kind: "sine", volume: 0.22 },
    { duration: 0.22, from: 1318.5, kind: "sine", volume: 0.24 },
  ]),
  "music-loop": musicLoop(),
};

mkdirSync(OUT_DIR, { recursive: true });

for (const [name, samples] of Object.entries(assets)) {
  const file = join(OUT_DIR, `${name}.wav`);
  writeFileSync(file, wavBuffer(samples));
  const size = (samples.length * 2 + 44) / 1024;
  console.log(`wrote ${name}.wav (${size.toFixed(1)} KB)`);
}
