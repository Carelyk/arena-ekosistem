import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";
import type { AudioPreferences } from "@/lib/types";

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = {
  muted: false,
  master: 0.8,
  music: 0.35,
  sfx: 0.8,
};

function unit(value: unknown, fallback: number): number {
  if (typeof value !== "number" || Number.isNaN(value)) return fallback;
  return Math.min(1, Math.max(0, value));
}

export function normalizePreferences(value: unknown): AudioPreferences {
  if (!value || typeof value !== "object") return { ...DEFAULT_AUDIO_PREFERENCES };
  const item = value as Partial<AudioPreferences>;
  return {
    muted: item.muted === true,
    master: unit(item.master, DEFAULT_AUDIO_PREFERENCES.master),
    music: unit(item.music, DEFAULT_AUDIO_PREFERENCES.music),
    sfx: unit(item.sfx, DEFAULT_AUDIO_PREFERENCES.sfx),
  };
}

export function loadAudioPreferences(): AudioPreferences {
  return normalizePreferences(
    readJson<unknown>(STORAGE_KEYS.audio, DEFAULT_AUDIO_PREFERENCES),
  );
}

export function saveAudioPreferences(preferences: AudioPreferences): void {
  writeJson(STORAGE_KEYS.audio, preferences);
}
