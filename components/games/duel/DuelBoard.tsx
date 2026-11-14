"use client";

import {
  CheckCircle2,
  ArrowRight,
  Clock,
  LogOut,
  Pause,
  Play,
  Sparkles,
} from "lucide-react";
import { EnergyRope } from "@/components/games/duel/EnergyRope";
import { PlayerPanel } from "@/components/games/duel/PlayerPanel";
import { CATEGORY_LABELS } from "@/lib/data/questions";
import type { DuelSnapshot } from "@/lib/game/duel-engine";
import type { OptionIndex, PlayerInfo } from "@/lib/types";

interface DuelBoardProps {
  player1: PlayerInfo;
  player2: PlayerInfo;
  snapshot: DuelSnapshot;
  status: string;
  saving: boolean;
  ropeImpulse: -1 | 0 | 1;
  onAnswer: (player: 0 | 1, option: OptionIndex) => void;
  onNext: () => void;
  onTogglePause: () => void;
  onExit: () => void;
}

const LETTERS = ["A", "B", "C", "D"] as const;

export function DuelBoard({
  player1,
  player2,
  snapshot,
  status,
  saving,
  ropeImpulse,
  onAnswer,
  onNext,
  onTogglePause,
  onExit,
}: DuelBoardProps) {
  const { players, reveal, question, phase, paused } = snapshot;
  const seconds = Math.ceil(snapshot.timeLeftMs / 1000);
  const warning = snapshot.timeLeftMs <= 10000 && phase === "playing";
  const lastRound = snapshot.roundIndex + 1 >= snapshot.totalRounds;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-3 py-4 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="rounded-xl border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          Duel Ekosistem · Ronde {snapshot.roundIndex + 1} dari {snapshot.totalRounds}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTogglePause}
            className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-ink"
          >
            {paused ? (
              <Play aria-hidden className="h-4 w-4" />
            ) : (
              <Pause aria-hidden className="h-4 w-4" />
            )}
            {paused ? "Lanjutkan" : "Jeda"}
          </button>
          <button
            type="button"
            onClick={onExit}
            className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-ink"
          >
            <LogOut aria-hidden className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>

      <EnergyRope
        name1={player1.name}
        name2={player2.name}
        score1={players[0].score}
        score2={players[1].score}
        impulse={ropeImpulse}
      />

      <p
        aria-live="polite"
        className="min-h-10 rounded-xl border-2 border-dashed border-ink/20 bg-white/80 px-3 py-2 text-center text-xs font-extrabold text-ink-soft"
      >
        {status}
      </p>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)_minmax(0,0.9fr)] lg:items-stretch">
        <div className="order-2 lg:order-1">
          <PlayerPanel
            side={0}
            name={player1.name}
            avatar={player1.avatar}
            score={players[0].score}
            attempted={players[0].attempted}
            solved={players[0].solved}
            phase={phase}
            paused={paused}
            onAnswer={(option) => onAnswer(0, option)}
          />
        </div>

        <section
          aria-label="Soal duel"
          className="order-1 flex flex-col rounded-3xl border-[3px] border-ink bg-white p-4 sm:p-5 lg:order-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-lg bg-cream px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
              {question ? CATEGORY_LABELS[question.category] : "Soal"}
            </span>
            <span
              className={`flex items-center gap-1.5 rounded-xl border-[3px] px-2.5 py-1 font-display text-lg font-semibold tabular-nums ${
                warning
                  ? "border-[#B4567A] bg-pengurai-soft text-pengurai-deep"
                  : "border-ink/15 bg-cream text-ink"
              }`}
              role="timer"
              aria-label={`Sisa waktu ${seconds} detik`}
            >
              <Clock aria-hidden className="h-4 w-4" />
              {seconds} dtk
            </span>
          </div>

          <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
            {question?.text}
          </h2>

          <ol className="mt-3 flex flex-col gap-1.5">
            {question?.options.map((option, index) => {
              const correct = reveal?.correctIndex === index;
              return (
                <li
                  key={`${index}-${option}`}
                  className={`flex items-start gap-2 rounded-xl border-2 px-2.5 py-1.5 text-sm font-bold ${
                    reveal
                      ? correct
                        ? "border-[#2F7A45] bg-produsen-soft text-produsen-deep"
                        : "border-ink/10 bg-cream text-ink-soft"
                      : "border-ink/10 bg-cream text-ink"
                  }`}
                >
                  <span
                    aria-hidden
                    className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 border-current text-[11px] font-extrabold"
                  >
                    {LETTERS[index]}
                  </span>
                  <span className="flex-1 leading-snug">{option}</span>
                  {reveal && correct && (
                    <CheckCircle2
                      aria-label="Jawaban benar"
                      className="mt-0.5 h-4 w-4 shrink-0"
                    />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="mt-3 flex-1">
            {paused && (
              <div className="rounded-xl border-[3px] border-dashed border-ink/25 bg-cream px-3 py-4 text-center">
                <p className="font-display text-lg font-semibold text-ink">
                  Permainan dijeda
                </p>
                <p className="mt-1 text-xs font-semibold text-ink-soft">
                  Waktu berhenti. Tekan “Lanjutkan” untuk melanjutkan ronde.
                </p>
              </div>
            )}

            {reveal && !paused && (
              <div className="rise rounded-2xl border-[3px] border-[#2F7A45] bg-produsen-soft p-3">
                <p className="flex items-center gap-2 text-sm font-extrabold text-produsen-deep">
                  <Sparkles aria-hidden className="h-4 w-4" />
                  Jawaban benar: {LETTERS[reveal.correctIndex]}.{" "}
                  {question?.options[reveal.correctIndex]}
                </p>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-produsen-deep/90">
                  {reveal.explanation}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold">
                  <span
                    className={`rounded-lg px-2 py-1 ${
                      reveal.solved[0]
                        ? "bg-duel-green text-white"
                        : "bg-white text-ink-soft"
                    }`}
                  >
                    {player1.name}: {reveal.solved[0] ? "benar" : players[0].attempted ? "salah" : "belum menjawab"}
                  </span>
                  <span
                    className={`rounded-lg px-2 py-1 ${
                      reveal.solved[1]
                        ? "bg-duel-orange text-white"
                        : "bg-white text-ink-soft"
                    }`}
                  >
                    {player2.name}: {reveal.solved[1] ? "benar" : players[1].attempted ? "salah" : "belum menjawab"}
                  </span>
                  {reveal.firstSolver !== null && (
                    <span className="rounded-lg bg-sun px-2 py-1 text-ink">
                      Bonus tercepat: {reveal.firstSolver === 0 ? player1.name : player2.name}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {reveal && !paused && (
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onNext}
                disabled={saving}
                className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-50"
              >
                {lastRound ? "Lihat hasil" : "Ronde berikutnya"}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </button>
            </div>
          )}
        </section>

        <div className="order-3">
          <PlayerPanel
            side={1}
            name={player2.name}
            avatar={player2.avatar}
            score={players[1].score}
            attempted={players[1].attempted}
            solved={players[1].solved}
            phase={phase}
            paused={paused}
            onAnswer={(option) => onAnswer(1, option)}
          />
        </div>
      </div>
    </div>
  );
}
