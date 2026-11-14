"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  Loader2,
  LogIn,
  PlusCircle,
  Radio,
  Snowflake,
  Trophy,
  WifiOff,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import type { DuelSetupValues } from "@/components/games/duel/DuelSetup";
import { useNow } from "@/lib/hooks/use-now";
import {
  createRoom,
  fetchRoomState,
  joinRoom,
  nextRoomRound,
  startRoom,
  submitRoomAnswer,
  type RoomState,
} from "@/lib/game/room";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { FREEZE_MS } from "@/lib/game/duel-engine";
import type { OptionIndex } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D"] as const;
const MAX_ROUNDS = 10;

interface RoomDuelProps {
  setup: DuelSetupValues;
  onBack: () => void;
}

type LobbyMode = "menu" | "host" | "join";

export function RoomDuel({ setup, onBack }: RoomDuelProps) {
  const [mode, setMode] = useState<LobbyMode>("menu");
  const [slot, setSlot] = useState<0 | 1 | null>(null);
  const [room, setRoom] = useState<RoomState | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [offline, setOffline] = useState(false);
  const now = useNow(250);
  const failureCount = useRef(0);
  const { playSfx } = useAudio();

  const refresh = useCallback(async (code: string) => {
    const result = await fetchRoomState(code);
    if (result.error !== null) {
      failureCount.current += 1;
      if (failureCount.current >= 2) setOffline(true);
      return;
    }
    failureCount.current = 0;
    setOffline(false);
    setRoom(result.data);
  }, []);

  useEffect(() => {
    if (!room?.code) return;
    const code = room.code;
    const timer = window.setInterval(() => {
      void refresh(code);
    }, 1500);
    return () => window.clearInterval(timer);
  }, [room?.code, refresh]);

  useEffect(() => {
    if (!room?.code) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const code = room.code;
    const channel = supabase
      .channel(`eco-room-${code}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "eco_rooms",
          filter: `code=eq.${code}`,
        },
        () => {
          void refresh(code);
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [room?.code, refresh]);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const result = await createRoom({
      name: setup.player1Name,
      avatar: setup.player1Avatar,
      roundSeconds: setup.roundSeconds,
      maxRounds: MAX_ROUNDS,
    });
    setBusy(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    setSlot(result.data.slot);
    setRoom(result.data.state);
    setMode("host");
    playSfx("button-click");
  }

  async function handleJoin() {
    const code = codeInput.trim().toUpperCase();
    if (code.length !== 6) {
      setError("Kode ruangan terdiri dari enam karakter.");
      return;
    }
    setBusy(true);
    setError(null);
    const result = await joinRoom({
      code,
      name: setup.player2Name,
      avatar: setup.player2Avatar,
    });
    setBusy(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    setSlot(result.data.slot);
    setRoom(result.data.state);
    setMode("join");
    playSfx("button-click");
  }

  async function handleStart() {
    if (!room || slot === null) return;
    setBusy(true);
    setError(null);
    const result = await startRoom(room.code, slot);
    setBusy(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    setRoom(result.data);
    playSfx("countdown");
  }

  async function handleAnswer(option: OptionIndex) {
    if (!room || slot === null) return;
    setError(null);
    const result = await submitRoomAnswer({
      code: room.code,
      slot,
      option,
    });
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    const next = result.data;
    const solvedBefore = next.players[slot]?.solved;
    const revealNow = next.reveal;
    setRoom(next);
    if (solvedBefore) {
      playSfx("correct");
      if (revealNow?.firstSolver === slot) {
        window.setTimeout(() => playSfx("fastest-bonus"), 160);
      }
    } else {
      playSfx("wrong");
      window.setTimeout(() => playSfx("freeze"), 150);
    }
  }

  async function handleNext() {
    if (!room || slot === null) return;
    setBusy(true);
    setError(null);
    const result = await nextRoomRound({ code: room.code, slot });
    setBusy(false);
    if (result.error !== null) {
      setError(result.error);
      return;
    }
    setRoom(result.data);
    if (result.data.phase === "finished") {
      playSfx("winner");
    } else if (result.data.phase === "playing") {
      playSfx("countdown");
    }
  }

  async function copyCode() {
    if (!room) return;
    try {
      await navigator.clipboard.writeText(room.code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Tidak dapat menyalin otomatis. Tulis kode secara manual.");
    }
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="sticker rounded-3xl bg-white p-6">
          <h1 className="font-display text-2xl font-semibold text-ink">
            Mode kode ruangan belum aktif
          </h1>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink-soft">
            Proyek ini berjalan tanpa Supabase, sehingga duel dua perangkat
            belum tersedia. Duel satu perangkat tetap bisa dimainkan penuh
            dengan soal, timer, bonus tercepat, dan pembahasan.
          </p>
          <button
            type="button"
            onClick={onBack}
            className="sticker sticker-press mt-5 flex min-h-12 items-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-extrabold text-ink"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Kembali ke pengaturan duel
          </button>
        </div>
      </div>
    );
  }

  if (mode === "menu") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <div className="sticker rounded-3xl bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Duel Kode Ruangan
            </h1>
            <button
              type="button"
              onClick={onBack}
              className="flex min-h-11 items-center gap-2 rounded-xl border-[3px] border-ink/20 bg-cream px-3 py-2 text-xs font-extrabold text-ink"
            >
              <ArrowLeft aria-hidden className="h-4 w-4" />
              Kembali
            </button>
          </div>
          <p className="mt-2 text-sm font-semibold leading-relaxed text-ink-soft">
            Satu perangkat membuat ruangan, perangkat lain bergabung dengan kode
            enam karakter. Kedua pemain mendapat urutan soal yang sama dan
            waktu dihitung oleh server.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border-[3px] border-duel-green bg-duel-green-soft p-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-duel-green-deep">
                <PlusCircle aria-hidden className="h-5 w-5" />
                Buat ruangan
              </h2>
              <p className="mt-1 text-xs font-semibold text-ink/80">
                Kamu menjadi pemain pertama: {setup.player1Avatar}{" "}
                {setup.player1Name}.
              </p>
              <button
                type="button"
                onClick={handleCreate}
                disabled={busy}
                className="sticker sticker-press mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-duel-green-deep disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  <Radio aria-hidden className="h-4 w-4" />
                )}
                Buat kode ruangan
              </button>
            </div>

            <div className="rounded-2xl border-[3px] border-duel-orange bg-duel-orange-soft p-4">
              <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-duel-orange-deep">
                <LogIn aria-hidden className="h-5 w-5" />
                Gabung ruangan
              </h2>
              <label className="mt-2 flex flex-col gap-1 text-xs font-extrabold text-ink">
                Kode ruangan
                <input
                  value={codeInput}
                  onChange={(event) =>
                    setCodeInput(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, "")
                        .slice(0, 6),
                    )
                  }
                  placeholder="Contoh: K7M2QP"
                  autoComplete="off"
                  inputMode="text"
                  className="min-h-11 rounded-xl border-[3px] border-ink/25 bg-white px-3 py-2 font-display text-lg font-semibold uppercase tracking-[0.3em] text-ink"
                />
              </label>
              <button
                type="button"
                onClick={handleJoin}
                disabled={busy || codeInput.length !== 6}
                className="sticker sticker-press mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-extrabold text-duel-orange-deep disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                ) : (
                  <LogIn aria-hidden className="h-4 w-4" />
                )}
                Gabung sebagai {setup.player2Name}
              </button>
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-xl border-[3px] border-[#B4567A] bg-pengurai-soft px-3 py-2 text-sm font-bold text-pengurai-deep"
            >
              {error}
            </p>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-xl border-2 border-dashed border-ink/20 bg-cream px-3 py-2 text-xs font-semibold leading-relaxed text-ink-soft">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Jawaban benar dan pembahasan hanya dikirim server setelah ronde
              ditutup. Skor dan bonus tercepat dihitung di server melalui fungsi
              SQL, bukan di browser.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!room || slot === null) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-md items-center justify-center px-4">
        <p className="flex items-center gap-2 text-sm font-bold text-ink-soft">
          <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          Menghubungkan ruangan...
        </p>
      </div>
    );
  }

  const opponentSlot = slot === 0 ? 1 : 0;
  const own = room.players[slot];
  const opponent = room.players[opponentSlot];
  const remainingMs = room.roundDeadline
    ? Math.max(0, new Date(room.roundDeadline).getTime() - now)
    : 0;
  // `now` is 0 until the first client tick, so fall back to the nominal length
  // instead of rendering an epoch-sized countdown.
  const seconds =
    now > 0 ? Math.max(0, Math.ceil(remainingMs / 1000)) : room.roundSeconds;
  const frozenUntil = own.frozenUntil ? new Date(own.frozenUntil).getTime() : 0;
  const frozenMs = now > 0 ? Math.max(0, frozenUntil - now) : 0;
  const canAnswer =
    room.phase === "playing" && !own.solved && frozenMs === 0 && !busy;

  if (room.phase === "finished") {
    const winner =
      own.score === opponent.score
        ? "draw"
        : own.score > opponent.score
          ? "own"
          : "opponent";
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-8">
        <section className="sticker pop-in overflow-hidden rounded-3xl bg-white">
          <div className="bg-sun px-5 py-7 text-center">
            <p aria-hidden className="text-5xl leading-none">
              {winner === "draw" ? "🤝" : "🏆"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
              {winner === "draw"
                ? "Seri! Sama kuat."
                : winner === "own"
                  ? `${own.name} menang!`
                  : `${opponent.name} menang!`}
            </h1>
            <p className="mt-1 text-sm font-bold text-ink/75">
              Ruangan {room.code} · {room.roundIndex + 1} dari {room.totalRounds}{" "}
              ronde
            </p>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2">
            {[own, opponent].map((player, index) => (
              <div
                key={player.slot}
                className={`rounded-2xl border-[3px] p-4 ${
                  index === 0
                    ? "border-duel-green bg-duel-green-soft"
                    : "border-duel-orange bg-duel-orange-soft"
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-extrabold text-ink">
                  <span aria-hidden className="text-2xl">
                    {player.avatar}
                  </span>
                  {player.name}
                  {player.slot === slot && (
                    <span className="rounded-md bg-white px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                      kamu
                    </span>
                  )}
                </p>
                <p className="mt-2 font-display text-4xl font-semibold tabular-nums text-ink">
                  {player.score}
                  <span className="ml-1 text-sm font-bold">poin</span>
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2 border-t-[3px] border-ink/10 bg-cream px-5 py-4 sm:flex-row">
            <Link
              href="/juara"
              className="sticker sticker-press flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-extrabold text-ink"
            >
              <Trophy aria-hidden className="h-4 w-4" />
              Papan juara
            </Link>
            <button
              type="button"
              onClick={onBack}
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

  if (room.phase === "waiting") {
    const host = slot === 0;
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-8">
        <section className="sticker rounded-3xl bg-white p-5 sm:p-6">
          <p className="text-xs font-extrabold uppercase tracking-widest text-ink-soft">
            Ruang tunggu
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold text-ink">
            {host ? "Bagikan kode ini" : "Menunggu pemain pertama"}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="rounded-2xl border-[3px] border-ink bg-cream px-4 py-2 font-display text-3xl font-semibold tracking-[0.35em] text-ink">
              {room.code}
            </p>
            <button
              type="button"
              onClick={copyCode}
              className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-extrabold text-ink"
            >
              <Copy aria-hidden className="h-4 w-4" />
              {copied ? "Tersalin" : "Salin kode"}
            </button>
          </div>

          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {room.players.map((player, index) => (
              <div
                key={player.slot}
                className={`rounded-2xl border-[3px] p-3 ${
                  player.name
                    ? "border-ink/20 bg-cream"
                    : "border-dashed border-ink/25 bg-white"
                }`}
              >
                <p className="flex items-center gap-2 text-sm font-extrabold text-ink">
                  <span aria-hidden className="text-2xl">
                    {player.name ? player.avatar : "⏳"}
                  </span>
                  {player.name || "Menunggu pemain..."}
                  {index === slot && (
                    <span className="rounded-md bg-sun px-1.5 py-0.5 text-[10px] uppercase tracking-wide">
                      kamu
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-2 text-xs font-bold text-ink-soft">
            <Radio aria-hidden className="h-4 w-4" />
            {room.players.every((player) => player.name)
              ? "Dua pemain siap. Pemain pertama dapat memulai duel."
              : "Menunggu perangkat kedua bergabung..."}
          </p>

          {offline && (
            <p className="mt-3 flex items-center gap-2 rounded-xl border-2 border-[#B98A0E] bg-[#FFF3CC] px-3 py-2 text-xs font-bold text-[#7A5A05]">
              <WifiOff aria-hidden className="h-4 w-4" />
              Koneksi ke server terputus. Mencoba menghubungkan ulang secara
              otomatis.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="mt-3 rounded-xl border-[3px] border-[#B4567A] bg-pengurai-soft px-3 py-2 text-sm font-bold text-pengurai-deep"
            >
              {error}
            </p>
          )}

          {host && (
            <button
              type="button"
              onClick={handleStart}
              disabled={busy || !room.players.every((player) => player.name)}
              className="sticker sticker-press mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-extrabold text-ink disabled:opacity-50"
            >
              <Radio aria-hidden className="h-4 w-4" />
              Mulai duel di ruangan ini
            </button>
          )}

          <button
            type="button"
            onClick={onBack}
            className="mt-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-ink/20 bg-white px-4 py-2 text-xs font-extrabold text-ink"
          >
            <ArrowLeft aria-hidden className="h-4 w-4" />
            Keluar dari ruangan
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-3 py-4 sm:px-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="rounded-xl border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          Ruangan {room.code} · Ronde {room.roundIndex + 1} dari{" "}
          {room.totalRounds}
        </p>
        <div className="flex items-center gap-2">
          {offline && (
            <span className="flex items-center gap-1 rounded-lg bg-[#FFF3CC] px-2 py-1 text-[11px] font-extrabold text-[#7A5A05]">
              <WifiOff aria-hidden className="h-3.5 w-3.5" />
              menyambung ulang
            </span>
          )}
          <span
            role="timer"
            aria-label={`Sisa waktu ${seconds} detik`}
            className={`flex items-center gap-1.5 rounded-xl border-[3px] px-3 py-1.5 font-display text-lg font-semibold tabular-nums ${
              seconds <= 10
                ? "border-[#B4567A] bg-pengurai-soft text-pengurai-deep"
                : "border-ink/15 bg-white text-ink"
            }`}
          >
            <Clock aria-hidden className="h-4 w-4" />
            {seconds} dtk
          </span>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {[own, opponent].map((player, index) => (
          <div
            key={player.slot}
            className={`rounded-2xl border-[3px] px-3 py-2 ${
              index === 0
                ? "border-duel-green bg-duel-green-soft"
                : "border-duel-orange bg-duel-orange-soft"
            }`}
          >
            <p className="flex items-center justify-between gap-2 text-xs font-extrabold text-ink">
              <span className="flex items-center gap-1.5 truncate">
                <span aria-hidden className="text-lg">
                  {player.name ? player.avatar : "⏳"}
                </span>
                {player.name || "Menunggu pemain"}
                {player.slot === slot && (
                  <span className="rounded bg-white px-1 py-0.5 text-[10px] uppercase">
                    kamu
                  </span>
                )}
              </span>
              <span className="shrink-0 font-display text-lg tabular-nums">
                {player.score}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-[11px] font-bold text-ink/70">
              {player.solved ? (
                <>
                  <CheckCircle2 aria-hidden className="h-3.5 w-3.5" /> sudah benar
                </>
              ) : player.frozenUntil &&
                new Date(player.frozenUntil).getTime() > now ? (
                <>
                  <Snowflake aria-hidden className="h-3.5 w-3.5" /> dibekukan
                </>
              ) : (
                "masih menjawab"
              )}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border-[3px] border-ink bg-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-lg bg-cream px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
            {room.question?.category ?? "Soal"}
          </span>
          {room.phase === "revealed" && (
            <span className="rounded-lg bg-produsen-soft px-2 py-1 text-[11px] font-extrabold text-produsen-deep">
              Ronde ditutup
            </span>
          )}
        </div>

        <h2 className="mt-3 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
          {room.question?.text ?? "Menunggu soal dari server..."}
        </h2>

        <ol className="mt-3 flex flex-col gap-1.5">
          {room.question?.options.map((option, index) => {
            const correct = room.reveal?.correctIndex === index;
            return (
              <li
                key={`${index}-${option}`}
                className={`flex items-start gap-2 rounded-xl border-2 px-2.5 py-1.5 text-sm font-bold ${
                  room.reveal
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
                {room.reveal && correct && (
                  <CheckCircle2 aria-label="Jawaban benar" className="mt-0.5 h-4 w-4" />
                )}
              </li>
            );
          })}
        </ol>

        {room.phase === "playing" && (
          <div className="mt-3">
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
              Jawaban {own.name}
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {LETTERS.map((letter, index) => (
                <button
                  key={letter}
                  type="button"
                  data-no-click-sfx
                  onClick={() => handleAnswer(index as OptionIndex)}
                  disabled={!canAnswer}
                  aria-label={`Jawab pilihan ${letter}`}
                  className="sticker sticker-press flex min-h-[52px] items-center justify-center rounded-xl border-[3px] border-[#2B6CA3] bg-konsumen2-soft font-display text-2xl font-semibold text-konsumen2-deep disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {letter}
                </button>
              ))}
            </div>
            <p aria-live="polite" className="mt-2 min-h-6 text-xs font-bold text-ink-soft">
              {own.solved
                ? "Kamu sudah benar pada ronde ini. Tunggu lawan atau waktu habis."
                : frozenMs > 0
                  ? `Panelmu dibekukan ${Math.ceil(Math.min(FREEZE_MS, frozenMs) / 1000)} detik setelah jawaban salah.`
                  : "Pilih satu jawaban. Jawaban salah membekukan panelmu dua detik."}
            </p>
          </div>
        )}

        {room.phase === "revealed" && room.reveal && (
          <div className="rise mt-3 rounded-2xl border-[3px] border-[#2F7A45] bg-produsen-soft p-3">
            <p className="flex items-center gap-2 text-sm font-extrabold text-produsen-deep">
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              Jawaban benar: {LETTERS[room.reveal.correctIndex]}.{" "}
              {room.question?.options[room.reveal.correctIndex]}
            </p>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-produsen-deep/90">
              {room.reveal.explanation}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-extrabold">
              {room.players.map((player, index) => (
                <span
                  key={player.slot}
                  className={`rounded-lg px-2 py-1 ${
                    room.reveal?.solved[index]
                      ? "bg-white text-produsen-deep"
                      : "bg-white/70 text-ink-soft"
                  }`}
                >
                  {player.name || `Pemain ${index + 1}`}:{" "}
                  {room.reveal?.solved[index] ? "benar" : "belum benar"}
                </span>
              ))}
              {room.reveal.firstSolver !== null && (
                <span className="rounded-lg bg-sun px-2 py-1 text-ink">
                  Bonus tercepat:{" "}
                  {room.players[room.reveal.firstSolver]?.name ?? "pemain"}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleNext}
              disabled={busy}
              className="sticker sticker-press mt-3 flex min-h-11 items-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-50"
            >
              {room.roundIndex + 1 >= room.totalRounds
                ? "Lihat hasil akhir"
                : "Ronde berikutnya"}
            </button>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="mt-3 flex items-start gap-2 rounded-xl border-[3px] border-[#B4567A] bg-pengurai-soft px-3 py-2 text-sm font-bold text-pengurai-deep"
          >
            <XCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        )}
      </section>
    </div>
  );
}
