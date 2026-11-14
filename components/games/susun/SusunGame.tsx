"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudio, useGameMusic } from "@/components/audio/AudioProvider";
import { SusunPanel } from "@/components/games/susun/SusunPanel";
import { SusunResult } from "@/components/games/susun/SusunResult";
import {
  SusunSetup,
  type SusunSetupValues,
} from "@/components/games/susun/SusunSetup";
import { getEcosystem } from "@/lib/data/ecosystems";
import {
  boardScore,
  createBoard,
  placeCard,
  returnCard,
  selectCard,
  submitBoard,
  totalPositions,
  type SusunBoard,
} from "@/lib/game/susun";
import { loadBadgeUnlocks, recordMatch } from "@/lib/game/history";
import { nowMs } from "@/lib/game/utils";
import { createId } from "@/lib/storage";
import type { BadgeUnlock, MatchRecord } from "@/lib/types";

type Phase = "setup" | "countdown" | "playing" | "result";

const EMPTY_BOARD: SusunBoard = {
  cards: [],
  slots: {},
  selectedCardId: null,
  frozenUntil: 0,
  bestCorrect: 0,
  bonusEarned: false,
  finishMs: null,
  wrongCount: 0,
  submissions: 0,
};

export function SusunGame() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [values, setValues] = useState<SusunSetupValues | null>(null);
  const [boards, setBoards] = useState<[SusunBoard, SusunBoard]>([
    EMPTY_BOARD,
    EMPTY_BOARD,
  ]);
  const [countdown, setCountdown] = useState(3);
  const [now, setNow] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [status, setStatus] = useState(
    "Geser kartu ke posisi yang benar, lalu kunci jawaban.",
  );
  const [shake, setShake] = useState<[boolean, boolean]>([false, false]);
  const [celebrate, setCelebrate] = useState<[boolean, boolean]>([false, false]);
  const [record, setRecord] = useState<MatchRecord | null>(null);
  const [newBadges, setNewBadges] = useState<BadgeUnlock[]>([]);

  const boardsRef = useRef<[SusunBoard, SusunBoard]>([EMPTY_BOARD, EMPTY_BOARD]);
  const chainRef = useRef(getEcosystem("sawah"));
  const startAtRef = useRef(0);
  const deadlineRef = useRef(0);
  const finishedRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);
  const warnedRef = useRef(false);
  const shakeTimersRef = useRef<[number | null, number | null]>([null, null]);
  const { playSfx } = useAudio();
  useGameMusic(phase === "playing" || phase === "countdown");

  const applyBoards = useCallback(
    (next: [SusunBoard, SusunBoard]) => {
      boardsRef.current = next;
      setBoards(next);
    },
    [],
  );

  const finish = useCallback(
    (reason: "solved" | "time") => {
      if (finishedRef.current) return;
      const info = values;
      if (!info) return;
      finishedRef.current = true;

      const [board1, board2] = boardsRef.current;
      const score1 = boardScore(board1);
      const score2 = boardScore(board2);
      const winner =
        score1 === score2 ? "draw" : score1 > score2 ? "p1" : "p2";
      const chain = chainRef.current;

      const match: MatchRecord = {
        id: createId("susun"),
        game: "susun",
        player1: {
          name: info.player1Name,
          avatar: info.player1Avatar,
          score: score1,
        },
        player2: {
          name: info.player2Name,
          avatar: info.player2Avatar,
          score: score2,
        },
        winner,
        createdAt: new Date().toISOString(),
        detail: {
          kind: "susun",
          ecosystem: chain.id,
          completedP1: board1.finishMs !== null,
          completedP2: board2.finishMs !== null,
          finishMsP1: board1.finishMs,
          finishMsP2: board2.finishMs,
          correctP1: board1.bestCorrect,
          correctP2: board2.bestCorrect,
        },
      };

      playSfx(reason === "time" ? "time-up" : "winner");
      setRecord(match);
      setPhase("result");

      const before = loadBadgeUnlocks();
      void recordMatch(match)
        .then((unlocks) => {
          const fresh = unlocks.filter(
            (unlock) =>
              !before.some(
                (existing) =>
                  existing.id === unlock.id &&
                  existing.player === unlock.player,
              ),
          );
          setNewBadges(fresh);
          if (fresh.length > 0) playSfx("badge-unlocked");
        })
        .catch(() => undefined);
    },
    [playSfx, values],
  );

  const start = useCallback(
    (nextValues: SusunSetupValues) => {
      const chain = getEcosystem(nextValues.ecosystem);
      chainRef.current = chain;
      const seed = nowMs() % 2147483647;
      const first = createBoard(chain, seed);
      const second = createBoard(chain, seed + 7919);
      applyBoards([first, second]);
      setValues(nextValues);
      setRecord(null);
      setNewBadges([]);
      setShake([false, false]);
      setCelebrate([false, false]);
      setStatus("Bersiap. Permainan dimulai dalam tiga hitungan.");
      finishedRef.current = false;
      warnedRef.current = false;
      setCountdown(3);
      setPhase("countdown");
    },
    [applyBoards],
  );

  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdown > 0) {
      playSfx("countdown");
      const timer = window.setTimeout(
        () => setCountdown((value) => value - 1),
        900,
      );
      return () => window.clearTimeout(timer);
    }
    // Countdown reached "Mulai!". Starting the round inside the timeout keeps
    // setState out of the effect body, so the transition is not a cascading render.
    const timer = window.setTimeout(() => {
      const timestamp = nowMs();
      const chain = getEcosystem(values?.ecosystem ?? "sawah");
      startAtRef.current = timestamp;
      deadlineRef.current = timestamp + (values?.seconds ?? 30) * 1000;
      setDeadline(deadlineRef.current);
      setNow(timestamp);
      setStatus(
        `Susun rantai makanan ${chain.name}. ${totalPositions(chain)} posisi menunggu.`,
      );
      setPhase("playing");
    }, 550);
    return () => window.clearTimeout(timer);
  }, [phase, countdown, playSfx, values]);

  useEffect(() => {
    if (phase !== "playing") return;
    const interval = window.setInterval(() => {
      const timestamp = nowMs();
      setNow(timestamp);
      if (finishedRef.current) return;
      const bothDone =
        boardsRef.current[0].finishMs !== null &&
        boardsRef.current[1].finishMs !== null;
      if (bothDone) {
        if (finishTimerRef.current === null) {
          finishTimerRef.current = window.setTimeout(() => finish("solved"), 900);
        }
        return;
      }
      if (timestamp >= deadlineRef.current) {
        const summary =
          "Waktu habis. Susunan yang benar ditampilkan beserta penjelasannya.";
        setStatus(summary);
        finish("time");
        return;
      }
      const remaining = deadlineRef.current - timestamp;
      if (remaining <= 10000 && !warnedRef.current) {
        warnedRef.current = true;
        playSfx("time-warning");
      }
    }, 150);
    return () => window.clearInterval(interval);
  }, [phase, finish, playSfx, values]);

  useEffect(() => {
    // The tuple itself never changes identity; copying it here keeps the cleanup
    // reading the same array the effect captured.
    const shakeTimers = shakeTimersRef.current;
    return () => {
      if (finishTimerRef.current !== null) {
        window.clearTimeout(finishTimerRef.current);
      }
      for (const timer of shakeTimers) {
        if (timer !== null) window.clearTimeout(timer);
      }
    };
  }, []);

  function triggerShake(player: 0 | 1) {
    setShake((current) => {
      const next: [boolean, boolean] = [current[0], current[1]];
      next[player] = true;
      return next;
    });
    const existing = shakeTimersRef.current[player];
    if (existing !== null) window.clearTimeout(existing);
    shakeTimersRef.current[player] = window.setTimeout(() => {
      shakeTimersRef.current[player] = null;
      setShake((current) => {
        const next: [boolean, boolean] = [current[0], current[1]];
        next[player] = false;
        return next;
      });
    }, 420);
  }

  function updateBoard(player: 0 | 1, updater: (board: SusunBoard) => SusunBoard) {
    if (finishedRef.current) return;
    const current = boardsRef.current;
    const updated = updater(current[player]);
    if (updated === current[player]) return;
    const next: [SusunBoard, SusunBoard] =
      player === 0 ? [updated, current[1]] : [current[0], updated];
    applyBoards(next);
  }

  function handlePlace(player: 0 | 1, cardId: string, slotId: string) {
    updateBoard(player, (board) => placeCard(board, cardId, slotId));
  }

  function handleSelect(player: 0 | 1, cardId: string) {
    updateBoard(player, (board) => selectCard(board, cardId));
  }

  function handleReturn(player: 0 | 1, cardId: string) {
    updateBoard(player, (board) => returnCard(board, cardId));
  }

  function handleSubmit(player: 0 | 1) {
    if (phase !== "playing" || finishedRef.current) return;
    const chain = chainRef.current;
    const current = boardsRef.current;
    const timestamp = nowMs();
    const elapsed = timestamp - startAtRef.current;
    const opponentFinished = current[1 - player].finishMs !== null;
    const { board: nextBoard, outcome } = submitBoard(
      current[player],
      chain,
      timestamp,
      elapsed,
      opponentFinished,
    );

    if (outcome.kind === "ignored") return;

    const next: [SusunBoard, SusunBoard] =
      player === 0 ? [nextBoard, current[1]] : [current[0], nextBoard];
    applyBoards(next);

    const name =
      player === 0
        ? values?.player1Name ?? "Tim Hijau"
        : values?.player2Name ?? "Tim Oranye";

    if (outcome.kind === "frozen") {
      playSfx("freeze");
      setStatus(`${name} masih dibekukan. Tunggu sebentar.`);
      return;
    }

    if (outcome.kind === "wrong") {
      playSfx("wrong");
      triggerShake(player);
      window.setTimeout(() => playSfx("freeze"), 150);
      setStatus(
        `${name}: ${outcome.correct} dari ${outcome.total} posisi benar. Area dibekukan 2 detik.`,
      );
      return;
    }

    playSfx("correct");
    setCelebrate((current) => {
      const flags: [boolean, boolean] = [current[0], current[1]];
      flags[player] = true;
      return flags;
    });
    if (outcome.firstToFinish) {
      window.setTimeout(() => playSfx("fastest-bonus"), 160);
      setStatus(
        `${name} menyelesaikan susunan lebih dulu dan mendapat bonus 250!`,
      );
    } else {
      setStatus(`${name} menyelesaikan susunan dengan benar.`);
    }

    const bothDone =
      next[0].finishMs !== null && next[1].finishMs !== null;
    if (bothDone && finishTimerRef.current === null) {
      finishTimerRef.current = window.setTimeout(() => finish("solved"), 900);
    }
  }

  function reset() {
    if (finishTimerRef.current !== null) {
      window.clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
    finishedRef.current = false;
    chainRef.current = getEcosystem("sawah");
    deadlineRef.current = 0;
    setDeadline(0);
    applyBoards([EMPTY_BOARD, EMPTY_BOARD]);
    setValues(null);
    setRecord(null);
    setNewBadges([]);
    setShake([false, false]);
    setCelebrate([false, false]);
    setStatus("Geser kartu ke posisi yang benar, lalu kunci jawaban.");
    setPhase("setup");
  }

  if (phase === "result" && record) {
    return (
      <SusunResult
        record={record}
        newBadges={newBadges}
        onReplay={() => {
          if (values) {
            setRecord(null);
            start(values);
          }
        }}
        onExit={reset}
      />
    );
  }

  if (phase === "countdown" && values) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-10 text-center">
        <p className="font-display text-2xl font-semibold text-ink">
          {values.player1Avatar} {values.player1Name}
          <span className="mx-3 text-ink/40">vs</span>
          {values.player2Name} {values.player2Avatar}
        </p>
        <p
          key={countdown}
          aria-live="assertive"
          className="pop-in mt-6 font-display text-[7rem] font-semibold leading-none text-produsen-deep sm:text-[9rem]"
        >
          {countdown === 0 ? "Mulai!" : countdown}
        </p>
        <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-ink-soft">
          Ekosistem {getEcosystem(values.ecosystem).name}. Setiap pemain punya
          pool kartu sendiri.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 min-h-11 rounded-xl border-[3px] border-ink/20 bg-white px-4 py-2 text-sm font-extrabold text-ink"
        >
          Batalkan
        </button>
      </div>
    );
  }

  if (phase === "playing" && values) {
    const chain = getEcosystem(values.ecosystem);
    const remaining = Math.max(0, deadline - now);
    const seconds = Math.ceil(remaining / 1000);
    const warning = remaining <= 10000;
    const frozenMs = [0, 1].map((index) =>
      Math.max(0, boards[index as 0 | 1].frozenUntil - now),
    ) as [number, number];
    const solved = [boards[0].finishMs !== null, boards[1].finishMs !== null];

    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-4 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="rounded-xl border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            {chain.emoji} Susun Cepat · {chain.name}
          </p>
          <div className="flex items-center gap-2">
            <span
              role="timer"
              aria-label={`Sisa waktu ${seconds} detik`}
              className={`rounded-xl border-[3px] px-3 py-1.5 font-display text-lg font-semibold tabular-nums ${
                warning
                  ? "border-[#B4567A] bg-pengurai-soft text-pengurai-deep"
                  : "border-ink/15 bg-white text-ink"
              }`}
            >
              {seconds} dtk
            </span>
            <button
              type="button"
              onClick={() => finish("time")}
              className="min-h-11 rounded-xl border-[3px] border-ink/20 bg-white px-3 py-2 text-xs font-extrabold text-ink"
            >
              Akhiri ronde
            </button>
          </div>
        </div>

        <p
          aria-live="polite"
          className="min-h-10 rounded-xl border-2 border-dashed border-ink/20 bg-white/80 px-3 py-2 text-center text-xs font-extrabold text-ink-soft"
        >
          {status}
        </p>

        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1].map((index) => {
            const player = index as 0 | 1;
            const board = boards[player];
            return (
              <SusunPanel
                key={player}
                playerIndex={player}
                name={player === 0 ? values.player1Name : values.player2Name}
                avatar={player === 0 ? values.player1Avatar : values.player2Avatar}
                chain={chain}
                board={board}
                frozenMs={frozenMs[player]}
                disabled={solved[player] || frozenMs[player] > 0}
                shake={shake[player]}
                celebrate={celebrate[player]}
                score={boardScore(board)}
                onPlace={(cardId, slotId) => handlePlace(player, cardId, slotId)}
                onSelect={(cardId) => handleSelect(player, cardId)}
                onReturn={(cardId) => handleReturn(player, cardId)}
                onSubmit={() => handleSubmit(player)}
                onStatus={(message) => setStatus(message)}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <SusunSetup
      onStart={start}
    />
  );
}
