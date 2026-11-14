"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, Timer, Trophy } from "lucide-react";
import { BADGE_MAP } from "@/lib/data/badges";
import { getEcosystem } from "@/lib/data/ecosystems";
import { solvedLabel } from "@/lib/game/susun";
import type { BadgeUnlock, MatchRecord } from "@/lib/types";

interface SusunResultProps {
  record: MatchRecord;
  newBadges: BadgeUnlock[];
  onReplay: () => void;
  onExit: () => void;
}

export function SusunResult({
  record,
  newBadges,
  onReplay,
  onExit,
}: SusunResultProps) {
  const detail = record.detail.kind === "susun" ? record.detail : null;
  const chain = detail ? getEcosystem(detail.ecosystem) : null;
  const draw = record.winner === "draw";
  const winnerName =
    record.winner === "p1" ? record.player1.name : record.player2.name;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <section className="sticker pop-in overflow-hidden rounded-3xl bg-white">
        <div className="bg-sun px-5 py-6 text-center sm:py-8">
          <p aria-hidden className="text-5xl leading-none">
            {draw ? "🤝" : "🏆"}
          </p>
          <p className="mt-2 text-xs font-extrabold uppercase tracking-widest text-ink/70">
            Hasil Susun Cepat
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink sm:text-4xl">
            {draw ? "Seri! Sama kuat." : `${winnerName} menang!`}
          </h1>
          {chain && detail && (
            <p className="mt-1 text-sm font-bold text-ink/75">
              Ekosistem {chain.name} · {detail.correctP1 + detail.correctP2}{" "}
              posisi benar
            </p>
          )}
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2">
          {[
            {
              player: record.player1,
              label: "Tim Hijau",
              won: record.winner === "p1",
              completed: detail?.completedP1 ?? false,
              finishMs: detail?.finishMsP1 ?? null,
              correct: detail?.correctP1 ?? 0,
              className: "border-duel-green bg-duel-green-soft",
              accent: "text-duel-green-deep",
            },
            {
              player: record.player2,
              label: "Tim Oranye",
              won: record.winner === "p2",
              completed: detail?.completedP2 ?? false,
              finishMs: detail?.finishMsP2 ?? null,
              correct: detail?.correctP2 ?? 0,
              className: "border-duel-orange bg-duel-orange-soft",
              accent: "text-duel-orange-deep",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border-[3px] p-4 ${item.className}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2">
                  <span aria-hidden className="text-3xl leading-none">
                    {item.player.avatar}
                  </span>
                  <span>
                    <span className="block text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                      {item.label}
                    </span>
                    <span className="block truncate font-display text-xl font-semibold text-ink">
                      {item.player.name}
                    </span>
                  </span>
                </span>
                {item.won && (
                  <Trophy aria-label="Pemenang" className={`h-6 w-6 ${item.accent}`} />
                )}
              </div>
              <p
                className={`mt-3 font-display text-4xl font-semibold tabular-nums ${item.accent}`}
              >
                {item.player.score}
                <span className="ml-1 text-sm font-bold">poin</span>
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-bold text-ink/70">
                <span className="inline-flex items-center gap-1">
                  <Timer aria-hidden className="h-3.5 w-3.5" />
                  {item.finishMs !== null
                    ? `${(item.finishMs / 1000).toFixed(1)} detik`
                    : "belum selesai"}
                </span>
                <span>· {item.correct} posisi benar</span>
                {item.completed && (
                  <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] font-extrabold text-produsen-deep">
                    susunan lengkap
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>

        {chain && (
          <div className="border-t-[3px] border-dashed border-ink/10 px-5 py-4">
            <h2 className="font-display text-lg font-semibold text-ink">
              Susunan yang benar
            </h2>
            <p className="mt-1 rounded-xl bg-produsen-soft px-3 py-2 text-sm font-extrabold text-produsen-deep">
              {solvedLabel(chain)}
            </p>
            <p className="mt-2 text-xs font-semibold leading-relaxed text-ink-soft">
              {chain.summary} {chain.decomposerNote}
            </p>
          </div>
        )}

        <div className="border-t-[3px] border-dashed border-ink/10 px-5 py-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            Lencana baru
          </h2>
          {newBadges.length === 0 ? (
            <p className="mt-1 text-sm font-semibold text-ink-soft">
              Belum ada lencana baru. Coba selesaikan ekosistem lain atau
              selesaikan susunan di bawah 15 detik.
            </p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {newBadges.map((unlock) => {
                const badge = BADGE_MAP[unlock.id];
                if (!badge) return null;
                return (
                  <li
                    key={`${unlock.id}-${unlock.player}`}
                    className="flex items-center gap-3 rounded-xl border-2 border-sun bg-[#FFF8E3] px-3 py-2"
                  >
                    <span aria-hidden className="text-2xl leading-none">
                      {badge.emoji}
                    </span>
                    <span>
                      <span className="block text-sm font-extrabold text-ink">
                        {badge.name}
                      </span>
                      <span className="block text-xs font-semibold text-ink-soft">
                        {unlock.player} · {badge.title}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex flex-col gap-2 border-t-[3px] border-ink/10 bg-cream px-5 py-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onReplay}
            className="sticker sticker-press flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-extrabold text-ink"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            Main lagi
          </button>
          <Link
            href="/juara"
            className="sticker sticker-press flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-ink"
          >
            <Trophy aria-hidden className="h-4 w-4" />
            Papan juara
          </Link>
          <button
            type="button"
            onClick={onExit}
            className="sticker sticker-press flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-ink"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Kembali ke arena
          </button>
        </div>
      </section>
    </div>
  );
}
