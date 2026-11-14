"use client";

import { Zap } from "lucide-react";
import { clamp } from "@/lib/game/utils";

interface EnergyRopeProps {
  name1: string;
  name2: string;
  score1: number;
  score2: number;
  /** -1 menarik sesaat ke kiri, 1 menarik sesaat ke kanan. */
  impulse: -1 | 0 | 1;
}

export function EnergyRope({ name1, name2, score1, score2, impulse }: EnergyRopeProps) {
  const diff = score1 - score2;
  const scorePosition = 50 - clamp((diff / 600) * 40, -40, 40);
  const position = clamp(scorePosition + impulse * 7, 5, 95);
  const leading = diff === 0 ? null : diff > 0 ? name1 : name2;
  const summary =
    diff === 0
      ? `Tali tambang energi seimbang. ${name1} ${score1}, ${name2} ${score2}.`
      : `${leading} memimpin dengan selisih ${Math.abs(diff)} poin. ${name1} ${score1}, ${name2} ${score2}.`;

  return (
    <div className="rounded-2xl border-[3px] border-ink/15 bg-white px-4 py-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-extrabold uppercase tracking-widest text-ink-soft">
          🪢 Tali Tambang Energi
        </p>
        <p className="text-xs font-bold text-ink-soft" aria-live="polite">
          {diff === 0
            ? "Seimbang"
            : `${leading} unggul ${Math.abs(diff)} poin`}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="w-20 shrink-0 truncate text-right text-sm font-extrabold text-duel-green-deep sm:w-28">
          {name1}
        </span>
        <div
          role="img"
          aria-label={summary}
          className="relative h-8 flex-1 overflow-hidden rounded-full border-[3px] border-ink bg-gradient-to-r from-duel-green-soft via-cream to-duel-orange-soft"
        >
          <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 border-y-2 border-ink/25 bg-[#D8C49A]" />
          <div
            className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-ink bg-sun text-xs shadow transition-[left] duration-500 ease-out"
            style={{ left: `${position}%` }}
          >
            <Zap aria-hidden className="h-4 w-4 text-ink" />
          </div>
        </div>
        <span className="w-20 shrink-0 truncate text-sm font-extrabold text-duel-orange-deep sm:w-28">
          {name2}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs font-extrabold">
        <span className="text-duel-green-deep tabular-nums">{score1} poin</span>
        <span aria-hidden className="text-ink/30">
          | | | | |
        </span>
        <span className="text-duel-orange-deep tabular-nums">{score2} poin</span>
      </div>
    </div>
  );
}
