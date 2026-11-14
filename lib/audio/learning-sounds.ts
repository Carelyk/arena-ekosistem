export type LearningSoundName =
  | "plant"
  | "grasshopper"
  | "frog"
  | "snake"
  | "eagle"
  | "caterpillar"
  | "bird"
  | "phytoplankton"
  | "zooplankton"
  | "small-fish"
  | "large-fish"
  | "shark"
  | "decomposer";

type AudioWindow = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

class LearningSoundPlayer {
  private context: AudioContext | null = null;
  private active: Array<AudioScheduledSourceNode> = [];

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.context) {
      const AudioContextClass = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return null;
      this.context = new AudioContextClass();
    }
    if (this.context.state === "suspended") void this.context.resume();
    return this.context;
  }

  private stopActive(): void {
    for (const source of this.active) {
      try { source.stop(); } catch { /* source may already be finished */ }
    }
    this.active = [];
  }

  private tone(
    context: AudioContext,
    start: number,
    duration: number,
    fromHz: number,
    toHz: number,
    volume: number,
    type: OscillatorType = "sine",
  ): void {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(fromHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, toHz), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + Math.min(0.035, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
    this.active.push(oscillator);
  }

  private noise(
    context: AudioContext,
    start: number,
    duration: number,
    volume: number,
    highpass = 250,
    lowpass = 5000,
  ): void {
    const frames = Math.ceil(context.sampleRate * duration);
    const buffer = context.createBuffer(1, frames, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) {
      data[index] = (Math.random() * 2 - 1) * (1 - index / frames);
    }
    const source = context.createBufferSource();
    const high = context.createBiquadFilter();
    const low = context.createBiquadFilter();
    const gain = context.createGain();
    high.type = "highpass";
    high.frequency.value = highpass;
    low.type = "lowpass";
    low.frequency.value = lowpass;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.buffer = buffer;
    source.connect(high).connect(low).connect(gain).connect(context.destination);
    source.start(start);
    this.active.push(source);
  }

  play(name: LearningSoundName, level: number): void {
    if (level <= 0.001) return;
    const context = this.getContext();
    if (!context) return;
    this.stopActive();
    const now = context.currentTime + 0.015;
    const volume = Math.min(0.22, level * 0.2);

    switch (name) {
      case "plant":
        this.noise(context, now, 0.75, volume * 0.55, 700, 4300);
        this.tone(context, now + 0.08, 0.55, 520, 690, volume * 0.2);
        break;
      case "grasshopper":
        for (let index = 0; index < 5; index += 1) {
          this.tone(context, now + index * 0.09, 0.055, 3400, 4700, volume * 0.65, "square");
        }
        break;
      case "frog":
        this.tone(context, now, 0.24, 180, 105, volume, "sawtooth");
        this.tone(context, now + 0.29, 0.28, 165, 92, volume * 0.9, "sawtooth");
        break;
      case "snake":
        this.noise(context, now, 0.9, volume * 0.8, 2400, 9000);
        break;
      case "eagle":
        this.tone(context, now, 0.72, 1250, 2100, volume * 0.75, "sine");
        this.noise(context, now + 0.42, 0.35, volume * 0.25, 300, 1800);
        break;
      case "caterpillar":
        for (let index = 0; index < 4; index += 1) {
          this.tone(context, now + index * 0.14, 0.045, 420, 310, volume * 0.35, "triangle");
        }
        break;
      case "bird":
        this.tone(context, now, 0.13, 1450, 2300, volume * 0.7);
        this.tone(context, now + 0.17, 0.16, 1750, 2700, volume * 0.65);
        this.tone(context, now + 0.38, 0.12, 1600, 2200, volume * 0.55);
        break;
      case "phytoplankton":
        [0, 0.16, 0.32].forEach((delay, index) =>
          this.tone(context, now + delay, 0.28, 900 + index * 260, 1450 + index * 280, volume * 0.42),
        );
        break;
      case "zooplankton":
        [0, 0.18, 0.37].forEach((delay, index) =>
          this.tone(context, now + delay, 0.18, 420 + index * 70, 780 + index * 90, volume * 0.4),
        );
        break;
      case "small-fish":
        this.noise(context, now, 0.48, volume * 0.4, 500, 3200);
        this.tone(context, now + 0.08, 0.32, 520, 760, volume * 0.28);
        break;
      case "large-fish":
        this.noise(context, now, 0.75, volume * 0.55, 180, 1800);
        this.tone(context, now + 0.05, 0.58, 220, 135, volume * 0.4, "triangle");
        break;
      case "shark":
        this.noise(context, now, 1.05, volume * 0.6, 70, 1100);
        this.tone(context, now, 0.95, 105, 48, volume * 0.52, "sawtooth");
        break;
      case "decomposer":
        this.tone(context, now, 0.42, 260, 390, volume * 0.32, "triangle");
        this.tone(context, now + 0.18, 0.55, 390, 520, volume * 0.25, "sine");
        this.noise(context, now + 0.08, 0.5, volume * 0.18, 120, 900);
        break;
    }
  }
}

let player: LearningSoundPlayer | null = null;

export function playLearningSound(name: LearningSoundName, level: number): void {
  player ??= new LearningSoundPlayer();
  player.play(name, level);
}

export const LEARNING_SOUND_BY_ORGANISM: Record<string, LearningSoundName> = {
  produsen: "plant",
  konsumen1: "grasshopper",
  konsumen2: "frog",
  puncak: "eagle",
  pengurai: "decomposer",
  rumput: "plant",
  padi: "plant",
  daun: "plant",
  belalang: "grasshopper",
  katak: "frog",
  ular: "snake",
  elang: "eagle",
  "elang-hutan": "eagle",
  ulat: "caterpillar",
  burung: "bird",
  fitoplankton: "phytoplankton",
  zooplankton: "zooplankton",
  "ikan-kecil": "small-fish",
  "ikan-besar": "large-fish",
  hiu: "shark",
};
