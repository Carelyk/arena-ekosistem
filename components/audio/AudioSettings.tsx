"use client";

import { X, Volume2, VolumeX, Music2, Gamepad2, RotateCcw } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { DEFAULT_AUDIO_PREFERENCES } from "@/lib/audio/preferences";
import type { AudioPreferences } from "@/lib/types";

interface SliderRowProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}

function SliderRow({ icon, label, value, disabled, onChange }: SliderRowProps) {
  const percent = Math.round(value * 100);
  return (
    <label className="flex flex-col gap-1 text-sm font-bold text-ink">
      <span className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="tabular-nums text-ink-soft">{percent}%</span>
      </span>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value) / 100)}
        className="h-11 w-full cursor-pointer accent-[#2F7A45] disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>
  );
}

export function AudioSettings() {
  const { preferences, updatePreferences, resetPreferences } = useAudio();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (panelRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("pointerdown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const set = (patch: Partial<AudioPreferences>) => updatePreferences(patch);
  const muted = preferences.muted || preferences.master === 0;

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Pengaturan suara"
        className="sticker flex h-11 w-11 items-center justify-center rounded-2xl border-[#2E2A26] bg-white text-ink"
      >
        {muted ? (
          <VolumeX aria-hidden className="h-5 w-5" />
        ) : (
          <Volume2 aria-hidden className="h-5 w-5" />
        )}
      </button>

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Pengaturan suara"
          className="sticker absolute right-0 top-[calc(100%+0.6rem)] z-50 w-[min(19rem,calc(100vw-2rem))] rounded-2xl bg-white p-4 text-ink"
        >
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="font-display text-lg font-semibold">Suara</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup pengaturan suara"
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/20 bg-cream text-ink"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => set({ muted: !preferences.muted })}
            aria-pressed={preferences.muted}
            className={`mb-4 flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border-[3px] px-3 py-2 text-sm font-extrabold ${
              preferences.muted
                ? "border-[#B4567A] bg-[#FBE4EC] text-[#863A58]"
                : "border-[#2F7A45] bg-[#E4F3E2] text-[#1F5C33]"
            }`}
          >
            <span>{preferences.muted ? "Suara nonaktif" : "Suara aktif"}</span>
            {preferences.muted ? (
              <VolumeX aria-hidden className="h-5 w-5" />
            ) : (
              <Volume2 aria-hidden className="h-5 w-5" />
            )}
          </button>

          <div className="flex flex-col gap-3">
            <SliderRow
              icon={<Volume2 aria-hidden className="h-4 w-4" />}
              label="Volume utama"
              value={preferences.master}
              disabled={preferences.muted}
              onChange={(value) => set({ master: value })}
            />
            <SliderRow
              icon={<Music2 aria-hidden className="h-4 w-4" />}
              label="Musik latar"
              value={preferences.music}
              disabled={preferences.muted}
              onChange={(value) => set({ music: value })}
            />
            <SliderRow
              icon={<Gamepad2 aria-hidden className="h-4 w-4" />}
              label="Efek suara"
              value={preferences.sfx}
              disabled={preferences.muted}
              onChange={(value) => set({ sfx: value })}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              resetPreferences();
              set({ ...DEFAULT_AUDIO_PREFERENCES });
            }}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-ink/20 bg-cream px-3 py-2 text-sm font-bold text-ink"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            Kembalikan pengaturan awal
          </button>

          <p className="mt-3 text-xs font-semibold leading-relaxed text-ink-soft">
            Preferensi disimpan di perangkat ini. Audio baru berbunyi setelah
            kamu menyentuh layar atau menekan tombol.
          </p>
        </div>
      )}
    </div>
  );
}
