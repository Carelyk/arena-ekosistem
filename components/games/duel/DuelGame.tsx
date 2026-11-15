"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAudio, useGameMusic } from "@/components/audio/AudioProvider";
import { DuelBoard } from "@/components/games/duel/DuelBoard";
import { DuelResult } from "@/components/games/duel/DuelResult";
import { DuelSetup, type DuelSetupValues } from "@/components/games/duel/DuelSetup";
import { loadQuestionBank } from "@/lib/data/question-bank";
import { loadQuestionBankHybrid } from "@/lib/data/question-bank";
import {
  DuelEngine,
  MAX_ROUNDS,
  pickDuelQuestions,
  winnerOf,
  type DuelSnapshot,
} from "@/lib/game/duel-engine";
import {
  loadBadgeUnlocks,
  recordMatch,
} from "@/lib/game/history";
import { createId } from "@/lib/storage";
import type {
  BadgeUnlock,
  MatchRecord,
  OptionIndex,
  PlayerInfo,
} from "@/lib/types";

type Screen = "setup" | "countdown" | "match" | "result";

export function DuelGame() {
  const [screen, setScreen] = useState<Screen>("setup");
  const [setupValues, setSetupValues] = useState<DuelSetupValues | null>(null);
  const [snapshot, setSnapshot] = useState<DuelSnapshot | null>(null);
  const [countdown, setCountdown] = useState(3);
  const [status, setStatus] = useState(
    "Pilih nama dan avatar, lalu mulai duel. Kedua pemain mendapat soal yang sama.",
  );
  const [error, setError] = useState<string | null>(null);
  const [record, setRecord] = useState<MatchRecord | null>(null);
  const [newBadges, setNewBadges] = useState<BadgeUnlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [bankCount, setBankCount] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [ropeImpulse, setRopeImpulse] = useState<-1 | 0 | 1>(0);

  const engineRef = useRef<DuelEngine | null>(null);
  const playersRef = useRef<{ p1: PlayerInfo; p2: PlayerInfo } | null>(null);
  const savedRef = useRef(false);
  const warnedRoundRef = useRef(-1);
  const ropeTimerRef = useRef<number | null>(null);
  const roundAdvanceTimerRef = useRef<number | null>(null);
  const { playSfx } = useAudio();
  useGameMusic(screen === "match" || screen === "countdown");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const bank = loadQuestionBank();
      setBankCount(bank.filter((question) => question.active && question.reviewed).length);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => () => {
    if (ropeTimerRef.current !== null) window.clearTimeout(ropeTimerRef.current);
    if (roundAdvanceTimerRef.current !== null) window.clearTimeout(roundAdvanceTimerRef.current);
  }, []);

  function kickRope(direction: -1 | 1) {
    setRopeImpulse(direction);
    if (ropeTimerRef.current !== null) window.clearTimeout(ropeTimerRef.current);
    ropeTimerRef.current = window.setTimeout(() => setRopeImpulse(0), 420);
  }

  // Rendering reads player info from state; the ref stays for callbacks that
  // need the latest value without being re-created on every render.
  const players = setupValues
    ? {
        p1: {
          name: setupValues.player1Name,
          avatar: setupValues.player1Avatar,
        },
        p2: {
          name: setupValues.player2Name,
          avatar: setupValues.player2Avatar,
        },
      }
    : null;

  const finishMatch = useCallback(
    (final: DuelSnapshot) => {
      if (savedRef.current) return;
      const info = playersRef.current;
      if (!info) return;
      savedRef.current = true;
      setSaving(true);

      const detail = {
        kind: "duel" as const,
        rounds: final.totalRounds,
        correctP1: final.players[0].correctCount,
        correctP2: final.players[1].correctCount,
        answersP1: final.players[0].answers,
        answersP2: final.players[1].answers,
        fastestBonusP1: final.players[0].fastestBonus,
        fastestBonusP2: final.players[1].fastestBonus,
      };

      const match: MatchRecord = {
        id: createId("duel"),
        game: "duel",
        player1: { ...info.p1, score: final.players[0].score },
        player2: { ...info.p2, score: final.players[1].score },
        winner: winnerOf(final.players[0].score, final.players[1].score),
        createdAt: new Date().toISOString(),
        detail,
      };

      setRecord(match);
      setScreen("result");
      setSnapshot(final);
      playSfx("winner");

      const before = loadBadgeUnlocks();
      const unlocks = recordMatch(match);
      const fresh = unlocks.filter(
        (unlock) =>
          !before.some(
            (existing) =>
              existing.id === unlock.id && existing.player === unlock.player,
          ),
      );
      setNewBadges(fresh);
      if (fresh.length > 0) playSfx("badge-unlocked");
      setSaving(false);
    },
    [playSfx],
  );

  const startCountdown = useCallback(
    async (values: DuelSetupValues) => {
      setStatus("Memuat bank soal Supabase...");
      const loaded = await loadQuestionBankHybrid();
      const questions = pickDuelQuestions(values.difficulty, values.category, MAX_ROUNDS, loaded.questions);
      if (questions.length === 0) {
        setError(
          "Tidak ada soal yang sesuai dengan filter kategori atau tingkat kesulitan tersebut. Coba ubah filter.",
        );
        return;
      }
      engineRef.current = new DuelEngine(questions, {
        roundSeconds: values.roundSeconds,
        maxRounds: MAX_ROUNDS,
      });
      playersRef.current = {
        p1: { name: values.player1Name, avatar: values.player1Avatar },
        p2: { name: values.player2Name, avatar: values.player2Avatar },
      };
      setSetupValues(values);
      setError(null);
      setRecord(null);
      setNewBadges([]);
      setSnapshot(null);
      setRopeImpulse(0);
      savedRef.current = false;
      warnedRoundRef.current = -1;
      setCountdown(3);
      setStatus("Bersiap. Duel dimulai dalam tiga hitungan.");
      setScreen("countdown");
    },
    [],
  );

  function handleStart(values: DuelSetupValues) {
    startCountdown(values);
  }

  useEffect(() => {
    if (screen !== "countdown") return;
    if (countdown <= 0) {
      const engine = engineRef.current;
      if (!engine) return;
      const now = Date.now();
      engine.start(now);
      setSnapshot(engine.getSnapshot(now));
      warnedRoundRef.current = -1;
      setStatus(
        "Ronde 1 dimulai. Jawab benar untuk +100 poin; yang tercepat mendapat +50.",
      );
      setScreen("match");
      return;
    }
    playSfx("countdown");
    const timer = window.setTimeout(() => setCountdown((value) => value - 1), 900);
    return () => window.clearTimeout(timer);
  }, [screen, countdown, playSfx]);

  useEffect(() => {
    if (screen !== "match") return;
    const engine = engineRef.current;
    if (!engine) return;
    const interval = window.setInterval(() => {
      const now = Date.now();
      const tick = engine.tick(now);
      const next = engine.getSnapshot(now);
      setSnapshot(next);

      if (next.paused) return;

      if (
        next.phase === "playing" &&
        next.timeLeftMs <= 10000 &&
        warnedRoundRef.current !== next.roundIndex
      ) {
        warnedRoundRef.current = next.roundIndex;
        playSfx("time-warning");
        setStatus("Waktu tersisa 10 detik. Jawab sekarang!");
      }

      if (tick === "round-ended") {
        playSfx("time-up");
        setStatus("Waktu ronde habis. Jawaban benar dan pembahasan ditampilkan.");
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [screen, playSfx]);

  function handleAnswer(player: 0 | 1, option: OptionIndex) {
    const engine = engineRef.current;
    const info = playersRef.current;
    if (!engine || !info || screen !== "match") return;

    const now = Date.now();
    const event = engine.answer(player, option, now);
    const next = engine.getSnapshot(now);
    setSnapshot(next);
    const name = player === 0 ? info.p1.name : info.p2.name;

    switch (event.kind) {
      case "correct":
        kickRope(player === 0 ? -1 : 1);
        playSfx("correct");
        if (event.bonus) {
          window.setTimeout(() => playSfx("fastest-bonus"), 160);
        }
        setStatus(
          `${name} menjawab benar. +${event.points} poin${
            event.bonus ? " (termasuk bonus tercepat +50)" : ""
          }. Baca jawaban dan pembahasannya; soal berikutnya tampil dalam 4 detik.`,
        );
        break;
      case "wrong":
        kickRope(player === 0 ? 1 : -1);
        playSfx("wrong");
        setStatus(
          `${name} menjawab salah. Perhatikan jawaban benar dan pembahasannya; soal berikutnya tampil dalam 4 detik.`,
        );
        break;
      case "frozen":
        playSfx("freeze");
        setStatus(`${name} masih dibekukan. Tunggu dua detik.`);
        break;
      case "locked":
        setStatus(`${name} sudah memilih jawaban pada ronde ini.`);
        break;
      case "paused":
        setStatus("Permainan sedang dijeda.");
        break;
      case "round-over":
        setStatus("Ronde sudah selesai. Baca pembahasan lalu lanjut.");
        break;
      default:
        setStatus("Soal belum dapat dijawab saat ini.");
    }

    if ((event.kind === "correct" || event.kind === "wrong") && next.phase === "revealed") {
      if (roundAdvanceTimerRef.current !== null) {
        window.clearTimeout(roundAdvanceTimerRef.current);
      }
      roundAdvanceTimerRef.current = window.setTimeout(() => {
        roundAdvanceTimerRef.current = null;
        handleNext();
      }, 4000);
    }
  }

  function handleNext() {
    if (roundAdvanceTimerRef.current !== null) {
      window.clearTimeout(roundAdvanceTimerRef.current);
      roundAdvanceTimerRef.current = null;
    }
    const engine = engineRef.current;
    if (!engine) return;
    const now = Date.now();
    const result = engine.nextRound(now);
    if (result === "finished") {
      finishMatch(engine.getSnapshot(now));
      return;
    }
    if (result === "playing") {
      const next = engine.getSnapshot(now);
      setSnapshot(next);
      warnedRoundRef.current = -1;
      setStatus(
        `Ronde ${next.roundIndex + 1} dimulai. Jawaban benar +100, tercepat +50.`,
      );
    }
  }

  function togglePause() {
    const engine = engineRef.current;
    if (!engine) return;
    const now = Date.now();
    setSnapshot((current) => {
      if (!current) return current;
      const paused = current.paused;
      if (paused) {
        engine.resume(now);
        setStatus("Permainan dilanjutkan. Waktu berjalan kembali.");
      } else {
        engine.pause(now);
        setStatus("Permainan dijeda. Waktu berhenti sementara.");
      }
      return engine.getSnapshot(now);
    });
  }

  function resetToSetup() {
    if (roundAdvanceTimerRef.current !== null) {
      window.clearTimeout(roundAdvanceTimerRef.current);
      roundAdvanceTimerRef.current = null;
    }
    engineRef.current = null;
    playersRef.current = null;
    setScreen("setup");
    setSnapshot(null);
    setRopeImpulse(0);
    setRecord(null);
    setNewBadges([]);
    setStatus(
      "Pilih nama dan avatar, lalu mulai duel. Kedua pemain mendapat soal yang sama.",
    );
  }

  function requestExit() {
    if (screen === "match") {
      setConfirmExit(true);
      return;
    }
    resetToSetup();
  }



  if (screen === "result" && record) {
    return (
      <DuelResult
        record={record}
        newBadges={newBadges}
        onReplay={() => {
          if (setupValues) startCountdown(setupValues);
        }}
        onExit={resetToSetup}
      />
    );
  }

  if (screen === "countdown" && setupValues && players) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-10 text-center">
        <p className="font-display text-2xl font-semibold text-ink">
          {players.p1.avatar} {players.p1.name}
          <span className="mx-3 text-ink/40">vs</span>
          {players.p2.name} {players.p2.avatar}
        </p>
        <p
          key={countdown}
          aria-live="assertive"
          className="pop-in mt-6 font-display text-[7rem] font-semibold leading-none text-produsen-deep sm:text-[9rem]"
        >
          {countdown === 0 ? "Mulai!" : countdown}
        </p>
        <p className="mt-2 max-w-md text-sm font-semibold leading-relaxed text-ink-soft">
          Kedua pemain mendapat soal yang sama. Panel hijau di kiri, panel
          oranye di kanan.
        </p>
        <button
          type="button"
          onClick={resetToSetup}
          className="mt-6 min-h-11 rounded-xl border-[3px] border-ink/20 bg-white px-4 py-2 text-sm font-extrabold text-ink"
        >
          Batalkan
        </button>
      </div>
    );
  }

  if (screen === "match" && snapshot && players) {
    return (
      <>
        <DuelBoard
          player1={players.p1}
          player2={players.p2}
          snapshot={snapshot}
          status={status}
          saving={saving}
          ropeImpulse={ropeImpulse}
          onAnswer={handleAnswer}
          onNext={handleNext}
          onTogglePause={togglePause}
          onExit={requestExit}
        />
        {confirmExit && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
          >
            <div className="w-full max-w-sm rounded-3xl border-[3px] border-ink bg-white p-5">
              <h2 id="exit-title" className="font-display text-xl font-semibold text-ink">
                Keluar dari duel?
              </h2>
              <p className="mt-1 text-sm font-semibold text-ink-soft">
                Hasil duel yang belum selesai tidak disimpan.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setConfirmExit(false)}
                  className="sticker sticker-press min-h-11 flex-1 rounded-xl bg-sun px-3 py-2 text-sm font-extrabold text-ink"
                >
                  Lanjut bermain
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmExit(false);
                    resetToSetup();
                  }}
                  className="min-h-11 flex-1 rounded-xl border-[3px] border-ink/20 bg-white px-3 py-2 text-sm font-extrabold text-ink"
                >
                  Ya, keluar
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return <DuelSetup bankCount={bankCount} onStart={handleStart} error={error} />;
}
