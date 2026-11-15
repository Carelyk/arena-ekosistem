"use client";

import { CheckCircle2, CircleX, Lock, PauseCircle } from "lucide-react";
import type { DuelPhase } from "@/lib/game/duel-engine";
import type { OptionIndex } from "@/lib/types";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

interface PlayerPanelProps {
  side: 0 | 1;
  name: string;
  avatar: string;
  score: number;
  attempted: boolean;
  solved: boolean;
  phase: DuelPhase;
  paused: boolean;
  onAnswer: (option: OptionIndex) => void;
}

const SIDE_STYLES = [
  {
    label: "Pemain sisi hijau",
    panel: "border-duel-green bg-duel-green-soft",
    header: "bg-duel-green text-white",
    button: "border-duel-green bg-white text-duel-green-deep hover:bg-[#F2FBF4]",
    badge: "bg-duel-green text-white",
  },
  {
    label: "Pemain sisi oranye",
    panel: "border-duel-orange bg-duel-orange-soft",
    header: "bg-duel-orange text-white",
    button: "border-duel-orange bg-white text-duel-orange-deep hover:bg-[#FFF6F0]",
    badge: "bg-duel-orange text-white",
  },
] as const;

export function PlayerPanel({
  side,
  name,
  avatar,
  score,
  attempted,
  solved,
  phase,
  paused,
  onAnswer,
}: PlayerPanelProps) {
  const styles = SIDE_STYLES[side];
  const roundOpen = phase === "playing" && !paused;
  const disabled = !roundOpen || attempted;

  return (
    <section
      aria-label={styles.label}
      className={`sticker flex flex-col overflow-hidden rounded-3xl border-[3px] ${styles.panel} ${
        solved && phase === "playing" ? "glow-correct" : ""
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 ${styles.header}`}>
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/70 bg-white/20 text-2xl"
        >
          {avatar}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold leading-tight">
            {name}
          </p>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/85">
            {side === 0 ? "Tim Hijau" : "Tim Oranye"}
          </p>
        </div>
        <p className="shrink-0 rounded-xl border-2 border-white/60 bg-white/15 px-2.5 py-1 font-display text-xl font-semibold tabular-nums">
          {score}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="grid grid-cols-2 gap-2">
          {OPTION_LETTERS.map((letter, index) => (
            <button
              key={letter}
              type="button"
              data-no-click-sfx
              onClick={() => onAnswer(index as OptionIndex)}
              disabled={disabled}
              aria-label={`${name} menjawab pilihan ${letter}`}
              className={`sticker sticker-press flex min-h-[52px] items-center justify-center rounded-2xl border-[3px] font-display text-2xl font-semibold disabled:cursor-not-allowed disabled:opacity-45 ${styles.button}`}
            >
              {letter}
            </button>
          ))}
        </div>

        <div className="min-h-[44px]" aria-live="polite">
          {attempted && solved && phase !== "revealed" && (
            <p className="flex items-center gap-2 rounded-xl bg-white/80 px-2.5 py-2 text-xs font-extrabold text-ink">
              <CheckCircle2 aria-hidden className="h-4 w-4 text-duel-green" />
              Jawaban benar! Soal berikutnya segera tampil.
            </p>
          )}
          {attempted && !solved && phase !== "revealed" && (
            <p className="flex items-center gap-2 rounded-xl border-2 border-[#B4567A] bg-white px-2.5 py-2 text-xs font-extrabold text-pengurai-deep">
              <CircleX aria-hidden className="h-4 w-4" />
              Jawaban terkunci. Tunggu lawan menyelesaikan ronde.
            </p>
          )}
          {!attempted && paused && phase === "playing" && (
            <p className="flex items-center gap-2 rounded-xl bg-white/80 px-2.5 py-2 text-xs font-extrabold text-ink">
              <PauseCircle aria-hidden className="h-4 w-4" />
              Permainan sedang dijeda.
            </p>
          )}
          {!attempted && !paused && phase === "revealed" && (
            <p className="flex items-center gap-2 rounded-xl bg-white/80 px-2.5 py-2 text-xs font-extrabold text-ink">
              <Lock aria-hidden className="h-4 w-4" />
              Ronde selesai.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
