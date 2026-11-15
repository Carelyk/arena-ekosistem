"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_AUDIO_PREFERENCES,
  loadAudioPreferences,
  saveAudioPreferences,
} from "@/lib/audio/preferences";
import {
  getSoundManager,
  type SfxName,
  type SoundManager,
} from "@/lib/audio/sound-manager";
import type { AudioPreferences } from "@/lib/types";
import {
  playLearningSound as playLearningSoundEffect,
  stopLearningSound as stopLearningSoundEffect,
  type LearningSoundName,
} from "@/lib/audio/learning-sounds";

interface AudioContextValue {
  preferences: AudioPreferences;
  unlocked: boolean;
  playSfx: (name: SfxName) => void;
  playLearningSound: (name: LearningSoundName) => void;
  stopLearningSound: () => void;
  updatePreferences: (patch: Partial<AudioPreferences>) => void;
  resetPreferences: () => void;
  requestMusic: (enabled: boolean) => void;
}

const fallback: AudioContextValue = {
  preferences: DEFAULT_AUDIO_PREFERENCES,
  unlocked: false,
  playSfx: () => undefined,
  playLearningSound: () => undefined,
  stopLearningSound: () => undefined,
  updatePreferences: () => undefined,
  resetPreferences: () => undefined,
  requestMusic: () => undefined,
};

const AudioContext = createContext<AudioContextValue>(fallback);

export function useAudio(): AudioContextValue {
  return useContext(AudioContext);
}

export function useGameMusic(enabled = true): void {
  const { requestMusic } = useAudio();
  useEffect(() => {
    if (!enabled) return;
    requestMusic(true);
    return () => requestMusic(false);
  }, [enabled, requestMusic]);
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] = useState<AudioPreferences>(
    DEFAULT_AUDIO_PREFERENCES,
  );
  const [unlocked, setUnlocked] = useState(false);
  const preferencesRef = useRef<AudioPreferences>(DEFAULT_AUDIO_PREFERENCES);
  const managerRef = useRef<SoundManager | null>(null);

  useEffect(() => {
    const manager = getSoundManager(preferencesRef.current);
    managerRef.current = manager;
    manager.setPreferences(preferencesRef.current);

    // Read persisted preferences after hydration so the server and first client
    // render stay identical (no localStorage during render).
    const hydration = window.setTimeout(() => {
      const stored = loadAudioPreferences();
      preferencesRef.current = stored;
      setPreferencesState(stored);
      manager.setPreferences(stored);
    }, 0);

    const handleFirstGesture = () => {
      manager.unlock();
      setUnlocked(true);
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("a[href], button");
      if (!control) return;
      if (control.closest("[data-no-click-sfx]")) return;
      if (control instanceof HTMLButtonElement && control.disabled) return;
      manager.play("button-click");
    };

    window.addEventListener("pointerdown", handleFirstGesture, { passive: true });
    window.addEventListener("keydown", handleFirstGesture);
    document.addEventListener("click", handleClick);

    return () => {
      window.clearTimeout(hydration);
      window.removeEventListener("pointerdown", handleFirstGesture);
      window.removeEventListener("keydown", handleFirstGesture);
      document.removeEventListener("click", handleClick);
      manager.requestMusic(false);
    };
  }, []);

  const playSfx = useCallback((name: SfxName) => {
    const manager = managerRef.current ?? getSoundManager(preferencesRef.current);
    managerRef.current = manager;
    manager.play(name);
  }, []);

  const playLearningSound = useCallback((name: LearningSoundName) => {
    const prefs = preferencesRef.current;
    if (prefs.muted) return;
    playLearningSoundEffect(name, prefs.master * prefs.sfx);
  }, []);

  const stopLearningSound = useCallback(() => {
    stopLearningSoundEffect();
  }, []);

  const updatePreferences = useCallback((patch: Partial<AudioPreferences>) => {
    const next: AudioPreferences = {
      ...preferencesRef.current,
      ...patch,
      muted:
        typeof patch.muted === "boolean"
          ? patch.muted
          : preferencesRef.current.muted,
      master:
        typeof patch.master === "number"
          ? Math.min(1, Math.max(0, patch.master))
          : preferencesRef.current.master,
      music:
        typeof patch.music === "number"
          ? Math.min(1, Math.max(0, patch.music))
          : preferencesRef.current.music,
      sfx:
        typeof patch.sfx === "number"
          ? Math.min(1, Math.max(0, patch.sfx))
          : preferencesRef.current.sfx,
    };
    preferencesRef.current = next;
    setPreferencesState(next);
    saveAudioPreferences(next);
    managerRef.current?.setPreferences(next);
  }, []);

  const resetPreferences = useCallback(() => {
    const next = { ...DEFAULT_AUDIO_PREFERENCES };
    preferencesRef.current = next;
    setPreferencesState(next);
    saveAudioPreferences(next);
    managerRef.current?.setPreferences(next);
  }, []);

  const requestMusic = useCallback((enabled: boolean) => {
    const manager = managerRef.current ?? getSoundManager(preferencesRef.current);
    managerRef.current = manager;
    manager.requestMusic(enabled);
  }, []);

  return (
    <AudioContext.Provider
      value={{
        preferences,
        unlocked,
        playSfx,
        playLearningSound,
        stopLearningSound,
        updatePreferences,
        resetPreferences,
        requestMusic,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}
