"use client";

import { Gamepad2, Timer, Users, HelpCircle, Layers, Sliders } from "lucide-react";
import { useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { loadQuestionBank } from "@/lib/data/question-bank";
import { CATEGORY_LABELS, isUsableQuestion } from "@/lib/data/questions";
import type { CategoryId } from "@/lib/types";
import { GameTutorial } from "@/components/games/GameTutorial";

export interface DuelSetupValues {
  player1Name: string;
  player1Avatar: string;
  player2Name: string;
  player2Avatar: string;
  roundSeconds: number;
  mode: "individu" | "tim";
  difficulty: "mudah" | "sedang" | "sulit" | "campuran";
  category: "all" | CategoryId;
}

const AVATARS = ["🦁", "🐸", "🦅", "🐢", "🦊", "🐼", "🐯", "🦉", "🐬", "🐨"];

const DURATIONS = [20, 30, 45];

interface DuelSetupProps {
  bankCount: number;
  onStart: (values: DuelSetupValues) => void;
  error: string | null;
}

export function DuelSetup({ bankCount, onStart, error }: DuelSetupProps) {
  const [mode, setMode] = useState<"individu" | "tim">("tim");
  const [player1Name, setPlayer1Name] = useState("Tim Hijau");
  const [player2Name, setPlayer2Name] = useState("Tim Oranye");
  const [player1Avatar, setPlayer1Avatar] = useState(AVATARS[0]);
  const [player2Avatar, setPlayer2Avatar] = useState(AVATARS[1]);
  const [roundSeconds, setRoundSeconds] = useState(30);
  const [difficulty, setDifficulty] = useState<"mudah" | "sedang" | "sulit" | "campuran">("campuran");
  const [category, setCategory] = useState<"all" | CategoryId>("all");
  const [showTutorial, setShowTutorial] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { playSfx } = useAudio();

  function switchMode(next: "individu" | "tim") {
    playSfx("button-click");
    if (next === "tim") {
      if (player1Name === "Pemain 1" || player1Name === "Tim Hijau") {
        setPlayer1Name("Tim Hijau");
      }
      if (player2Name === "Pemain 2" || player2Name === "Tim Oranye") {
        setPlayer2Name("Tim Oranye");
      }
    } else {
      if (player1Name === "Tim Hijau" || player1Name === "Pemain 1") {
        setPlayer1Name("Pemain 1");
      }
      if (player2Name === "Tim Oranye" || player2Name === "Pemain 2") {
        setPlayer2Name("Pemain 2");
      }
    }
    setMode(next);
  }

  function submit() {
    const name1 = player1Name.trim();
    const name2 = player2Name.trim();
    if (name1.length < 2 || name2.length < 2) {
      setLocalError("Nama pemain atau tim minimal 2 karakter.");
      return;
    }
    if (name1.toLowerCase() === name2.toLowerCase()) {
      setLocalError("Nama kedua pemain harus berbeda.");
      return;
    }
    // Read the bank at click time: the displayed `bankCount` arrives after a
    // deferred read, and a fast click would otherwise be rejected with a
    // misleading "no questions yet" error.
    const available = loadQuestionBank().filter(isUsableQuestion).length;
    if (available < 1) {
      setLocalError("Belum ada soal aktif dan ditinjau di bank soal.");
      return;
    }
    setLocalError(null);
    onStart({
      player1Name: name1,
      player1Avatar,
      player2Name: name2,
      player2Avatar,
      roundSeconds,
      mode,
      difficulty,
      category,
    });
  }

  const message = localError ?? error;

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="sticker rounded-3xl bg-white p-5 sm:p-6">
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Arena Duel Ekosistem
        </h1>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold leading-relaxed text-ink-soft">
            Dua pemain, satu soal, satu layar. Jawab lebih cepat dari lawan untuk
            mendapat bonus, tetapi jawaban salah membuat panelmu dibekukan dua
            detik.
          </p>
          <button
            type="button"
            onClick={() => {
              playSfx("button-click");
              setShowTutorial(true);
            }}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[3px] border-ink/20 bg-sun/40 px-3 py-2 text-xs font-extrabold text-ink hover:bg-sun"
          >
            <HelpCircle className="h-4 w-4" />
            Panduan Bermain
          </button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Mode bermain">
          <button
            type="button"
            onClick={() => switchMode("individu")}
            aria-pressed={mode === "individu"}
            className={`flex min-h-11 items-center gap-2 rounded-xl border-[3px] px-3 py-2 text-sm font-extrabold ${
              mode === "individu"
                ? "border-ink bg-sun text-ink"
                : "border-ink/15 bg-cream text-ink-soft"
            }`}
          >
            <Users aria-hidden className="h-4 w-4" />
            Individu
          </button>
          <button
            type="button"
            onClick={() => switchMode("tim")}
            aria-pressed={mode === "tim"}
            className={`flex min-h-11 items-center gap-2 rounded-xl border-[3px] px-3 py-2 text-sm font-extrabold ${
              mode === "tim"
                ? "border-ink bg-sun text-ink"
                : "border-ink/15 bg-cream text-ink-soft"
            }`}
          >
            <Users aria-hidden className="h-4 w-4" />
            Tim
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            {
              side: "green" as const,
              title: mode === "tim" ? "Tim Hijau" : "Pemain 1",
              name: player1Name,
              setName: setPlayer1Name,
              avatar: player1Avatar,
              setAvatar: setPlayer1Avatar,
              panel: "border-duel-green bg-duel-green-soft",
              header: "text-duel-green-deep",
            },
            {
              side: "orange" as const,
              title: mode === "tim" ? "Tim Oranye" : "Pemain 2",
              name: player2Name,
              setName: setPlayer2Name,
              avatar: player2Avatar,
              setAvatar: setPlayer2Avatar,
              panel: "border-duel-orange bg-duel-orange-soft",
              header: "text-duel-orange-deep",
            },
          ].map((player) => (
            <div
              key={player.side}
              className={`rounded-2xl border-[3px] p-4 ${player.panel}`}
            >
              <h2 className={`text-sm font-extrabold uppercase tracking-wide ${player.header}`}>
                {player.title}
              </h2>
              <label className="mt-2 flex flex-col gap-1 text-xs font-extrabold text-ink">
                Nama
                <input
                  value={player.name}
                  onChange={(event) => player.setName(event.target.value.slice(0, 16))}
                  maxLength={16}
                  autoComplete="off"
                  className="min-h-11 rounded-xl border-[3px] border-ink/25 bg-white px-3 py-2 text-base font-bold text-ink"
                  placeholder={player.title}
                />
              </label>
              <p className="mt-3 text-xs font-extrabold text-ink">Pilih avatar</p>
              <div className="mt-1.5 grid grid-cols-5 gap-1.5" role="group" aria-label={`Avatar ${player.title}`}>
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => {
                      player.setAvatar(avatar);
                      playSfx("card-pickup");
                    }}
                    aria-pressed={player.avatar === avatar}
                    aria-label={`Avatar ${avatar}`}
                    className={`flex h-11 items-center justify-center rounded-xl border-2 text-xl ${
                      player.avatar === avatar
                        ? "border-ink bg-sun"
                        : "border-ink/15 bg-white/80"
                    }`}
                  >
                    {avatar}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <fieldset className="mt-5">
          <legend className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Sliders aria-hidden className="h-4 w-4" />
            Tingkat kesulitan
          </legend>
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "campuran" as const, label: "Campuran" },
              { id: "mudah" as const, label: "Mudah" },
              { id: "sedang" as const, label: "Sedang" },
              { id: "sulit" as const, label: "Sulit" },
            ].map((diff) => (
              <button
                key={diff.id}
                type="button"
                onClick={() => {
                  setDifficulty(diff.id);
                  playSfx("button-click");
                }}
                aria-pressed={difficulty === diff.id}
                className={`min-h-11 rounded-xl border-[3px] px-3 py-2 text-sm font-extrabold ${
                  difficulty === diff.id
                    ? "border-ink bg-sun text-ink"
                    : "border-ink/15 bg-cream text-ink-soft"
                }`}
              >
                {diff.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Layers aria-hidden className="h-4 w-4" />
            Kategori soal
          </legend>
          <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                playSfx("button-click");
              }}
              aria-pressed={category === "all"}
              className={`min-h-10 rounded-xl border-[3px] px-3 py-1.5 text-xs font-extrabold ${
                category === "all"
                  ? "border-ink bg-sun text-ink"
                  : "border-ink/15 bg-cream text-ink-soft"
              }`}
            >
              Semua Kategori (Umum)
            </button>
            {Object.entries(CATEGORY_LABELS).map(([catId, label]) => (
              <button
                key={catId}
                type="button"
                onClick={() => {
                  setCategory(catId as CategoryId);
                  playSfx("button-click");
                }}
                aria-pressed={category === catId}
                className={`min-h-10 rounded-xl border-[3px] px-3 py-1.5 text-xs font-extrabold ${
                  category === catId
                    ? "border-ink bg-sun text-ink"
                    : "border-ink/15 bg-cream text-ink-soft"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Timer aria-hidden className="h-4 w-4" />
            Durasi tiap soal
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DURATIONS.map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => {
                  setRoundSeconds(seconds);
                  playSfx("button-click");
                }}
                aria-pressed={roundSeconds === seconds}
                className={`min-h-11 rounded-xl border-[3px] px-4 py-2 text-sm font-extrabold ${
                  roundSeconds === seconds
                    ? "border-ink bg-sun text-ink"
                    : "border-ink/15 bg-cream text-ink-soft"
                }`}
              >
                {seconds} detik
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs font-semibold text-ink-soft">
            Maksimal 10 soal. Setiap soal punya waktu sendiri dan tidak berulang.
          </p>
        </fieldset>

        {message && (
          <p
            role="alert"
            className="mt-3 rounded-xl border-[3px] border-[#B4567A] bg-pengurai-soft px-3 py-2 text-sm font-bold text-pengurai-deep"
          >
            {message}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={bankCount < 1}
          className="sticker sticker-press mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sun px-5 py-3 font-display text-xl font-semibold text-ink disabled:opacity-50"
        >
          <Gamepad2 aria-hidden className="h-5 w-5" />
          Mulai Duel Ekosistem
        </button>
        <p className="mt-2 text-center text-xs font-semibold text-ink-soft">
          {bankCount} soal aktif dan sudah ditinjau tersedia di bank soal.
        </p>

        {showTutorial && (
          <GameTutorial
            gameKey="duel"
            title="Panduan Duel Ekosistem"
            steps={[
              { emoji: "⚔️", title: "Satu Perangkat 2 Pemain", desc: "Pemain 1 di sisi kiri, Pemain 2 di sisi kanan. Jawab soal yang sama secepat mungkin." },
              { emoji: "⚡", title: "Poin & Bonus", desc: "Jawaban benar mendapat +100 poin, dan siapa yang paling cepat menjawab benar mendapat bonus +50 poin." },
              { emoji: "❄️", title: "Hukuman Beku", desc: "Jika jawaban salah, panel pemain akan dibekukan selama 2 detik tidak bisa memilih jawaban." },
              { emoji: "🪢", title: "Tali Tambang Energi", desc: "Pantau posisi dominasi skor melalui tali tambang energi di tengah layar." }
            ]}
            onClose={() => setShowTutorial(false)}
          />
        )}
      </section>

      <aside className="flex flex-col gap-4">
        <div className="soft-card rounded-3xl bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-ink">
            Aturan skor
          </h2>
          <ul className="mt-3 flex flex-col gap-2 text-sm font-semibold text-ink/85">
            <li className="flex items-center justify-between gap-2 rounded-xl bg-produsen-soft px-3 py-2">
              <span>Jawaban benar</span>
              <span className="font-extrabold text-produsen-deep">+100</span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-xl bg-[#FFF3CC] px-3 py-2">
              <span>Tercepat menjawab benar</span>
              <span className="font-extrabold text-[#7A5A05]">+50</span>
            </li>
            <li className="flex items-center justify-between gap-2 rounded-xl bg-konsumen2-soft px-3 py-2">
              <span>Jawaban salah</span>
              <span className="font-extrabold text-konsumen2-deep">beku 2 detik</span>
            </li>
          </ul>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-ink-soft">
            Siapa pun yang lebih dulu memilih jawaban akan menutup ronde,
            baik jawabannya benar maupun salah. Jawaban benar dan pembahasan
            ditampilkan singkat sebelum soal berikutnya.
          </p>
        </div>

        <div className="rounded-3xl border-[3px] border-dashed border-ink/25 bg-white/70 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Butuh soal baru?
          </h2>
          <p className="mt-1 text-sm font-semibold text-ink/75">
            Guru dapat menambah, mengedit, dan meninjau soal di panel guru.
            Soal yang belum ditinjau tidak dipakai di arena.
          </p>
          <a
            href="/guru"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border-[3px] border-ink/20 bg-white px-3 py-2 text-sm font-extrabold text-ink"
          >
            Buka panel guru
          </a>
        </div>
      </aside>
    </div>
  );
}
