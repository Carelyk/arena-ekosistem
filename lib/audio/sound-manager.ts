import type { AudioPreferences } from "@/lib/types";

export type SfxName =
  | "button-click"
  | "card-pickup"
  | "card-drop"
  | "card-return"
  | "correct"
  | "wrong"
  | "freeze"
  | "fastest-bonus"
  | "countdown"
  | "time-warning"
  | "time-up"
  | "winner"
  | "badge-unlocked";

const SFX_FILES: Record<SfxName, string> = {
  "button-click": "button-click.wav",
  "card-pickup": "card-pickup.wav",
  "card-drop": "card-drop.wav",
  "card-return": "card-return.wav",
  correct: "correct.wav",
  wrong: "wrong.wav",
  freeze: "freeze.wav",
  "fastest-bonus": "fastest-bonus.wav",
  countdown: "countdown.wav",
  "time-warning": "time-warning.wav",
  "time-up": "time-up.wav",
  winner: "winner.wav",
  "badge-unlocked": "badge-unlocked.wav",
};

const FREQUENT_SFX: SfxName[] = [
  "button-click",
  "card-pickup",
  "card-drop",
  "card-return",
  "correct",
  "wrong",
];

const DUCK_TRIGGERS: SfxName[] = [
  "correct",
  "wrong",
  "winner",
  "badge-unlocked",
  "fastest-bonus",
  "time-up",
];

const POOL_SIZE = 2;
const DEBOUNCE_MS = 45;
const MUSIC_FILE = "/audio/music-loop.wav";

function assetPath(file: string): string {
  return `/audio/${file}`;
}

/**
 * Central audio manager. Audio elements are created once and reused, so rapid
 * taps cannot allocate a new element per render.
 */
export class SoundManager {
  private prefs: AudioPreferences;
  private readonly pools = new Map<SfxName, HTMLAudioElement[]>();
  private readonly cursors = new Map<SfxName, number>();
  private readonly lastPlayed = new Map<SfxName, number>();
  private music: HTMLAudioElement | null = null;
  private musicWanted = false;
  private unlocked = false;
  private duckTimer: number | null = null;

  constructor(preferences: AudioPreferences) {
    this.prefs = preferences;
    if (typeof window !== "undefined") {
      for (const name of FREQUENT_SFX) this.ensurePool(name);
    }
  }

  private get enabled(): boolean {
    return !this.prefs.muted && this.prefs.master > 0;
  }

  private ensurePool(name: SfxName): HTMLAudioElement[] {
    const existing = this.pools.get(name);
    if (existing) return existing;
    const pool: HTMLAudioElement[] = [];
    if (typeof window !== "undefined") {
      for (let i = 0; i < POOL_SIZE; i += 1) {
        const audio = new window.Audio(assetPath(SFX_FILES[name]));
        audio.preload = "auto";
        audio.volume = 0;
        // A missing or blocked file must never break gameplay.
        audio.addEventListener("error", () => undefined);
        pool.push(audio);
      }
    }
    this.pools.set(name, pool);
    this.cursors.set(name, 0);
    return pool;
  }

  unlock(): void {
    this.unlocked = true;
    if (this.musicWanted) this.tryStartMusic();
  }

  setPreferences(preferences: AudioPreferences): void {
    const wasMuted = this.prefs.muted;
    this.prefs = preferences;

    if (preferences.muted && this.music && !this.music.paused) {
      this.music.pause();
    } else if (!preferences.muted && wasMuted && this.musicWanted) {
      this.tryStartMusic();
    } else if (this.music && !this.music.paused) {
      this.music.volume = this.musicBaseVolume();
    }
  }

  play(name: SfxName): void {
    if (typeof window === "undefined" || !this.enabled) return;
    const sfxLevel = this.prefs.master * this.prefs.sfx;
    if (sfxLevel <= 0.001) return;

    const now = window.performance.now();
    const last = this.lastPlayed.get(name) ?? -1000;
    if (now - last < DEBOUNCE_MS) return;
    this.lastPlayed.set(name, now);

    const pool = this.ensurePool(name);
    if (pool.length === 0) return;
    const cursor = this.cursors.get(name) ?? 0;
    const audio = pool[cursor % pool.length];
    this.cursors.set(name, cursor + 1);

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = Math.min(1, sfxLevel);
      void audio.play().catch(() => undefined);
    } catch {
      // Autoplay policies or a decode failure: stay silent.
    }

    if (DUCK_TRIGGERS.includes(name)) this.duckMusic();
  }

  requestMusic(wanted: boolean): void {
    this.musicWanted = wanted;
    if (wanted) {
      this.tryStartMusic();
    } else {
      this.stopMusic();
    }
  }

  private ensureMusic(): HTMLAudioElement | null {
    if (typeof window === "undefined") return null;
    if (!this.music) {
      const audio = new window.Audio(MUSIC_FILE);
      audio.loop = true;
      audio.preload = "auto";
      audio.volume = this.musicBaseVolume();
      audio.addEventListener("error", () => undefined);
      this.music = audio;
    }
    return this.music;
  }

  private musicBaseVolume(): number {
    return Math.min(0.5, Math.max(0, this.prefs.master * this.prefs.music * 0.45));
  }

  private tryStartMusic(): void {
    if (!this.unlocked || !this.musicWanted || !this.enabled) return;
    const audio = this.ensureMusic();
    if (!audio) return;
    audio.volume = this.musicBaseVolume();
    if (!audio.paused) return;
    try {
      void audio.play().catch(() => undefined);
    } catch {
      // Music is optional; gameplay continues without it.
    }
  }

  private stopMusic(): void {
    if (!this.music) return;
    try {
      this.music.pause();
      this.music.currentTime = 0;
    } catch {
      // Ignore teardown races.
    }
  }

  private duckMusic(): void {
    const audio = this.music;
    if (!audio || audio.paused) return;
    if (this.duckTimer !== null) {
      window.clearTimeout(this.duckTimer);
    }
    audio.volume = Math.max(0, this.musicBaseVolume() * 0.25);
    this.duckTimer = window.setTimeout(() => {
      this.duckTimer = null;
      if (this.music && !this.music.paused) {
        this.music.volume = this.musicBaseVolume();
      }
    }, 420);
  }

  dispose(): void {
    if (this.duckTimer !== null) window.clearTimeout(this.duckTimer);
    this.duckTimer = null;
    this.musicWanted = false;
    this.stopMusic();
    for (const pool of this.pools.values()) {
      for (const audio of pool) {
        try {
          audio.pause();
          audio.src = "";
        } catch {
          // Ignore.
        }
      }
    }
    this.pools.clear();
    this.music = null;
  }
}

let manager: SoundManager | null = null;

export function getSoundManager(preferences: AudioPreferences): SoundManager {
  if (!manager) manager = new SoundManager(preferences);
  manager.setPreferences(preferences);
  return manager;
}
