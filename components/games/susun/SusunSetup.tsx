"use client";

import { Layers, Timer, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { ECOSYSTEMS } from "@/lib/data/ecosystems";
import type { EcosystemId } from "@/lib/types";

const AVATARS = ["🦁", "🐸", "🦅", "🐢", "🦊", "🐼", "🐯", "🦉", "🐬", "🐨"];
const DURATIONS = [30, 45, 60];

export interface SusunSetupValues {
  player1Name: string;
  player1Avatar: string;
  player2Name: string;
  player2Avatar: string;
  ecosystem: EcosystemId;
  seconds: number;
}

interface SusunSetupProps {
  onStart: (values: SusunSetupValues) => void;
}

export function SusunSetup({ onStart }: SusunSetupProps) {
  const [player1Name, setPlayer1Name] = useState("Tim Hijau");
  const [player2Name, setPlayer2Name] = useState("Tim Oranye");
  const [player1Avatar, setPlayer1Avatar] = useState(AVATARS[0]);
  const [player2Avatar, setPlayer2Avatar] = useState(AVATARS[1]);
  const [ecosystem, setEcosystem] = useState<EcosystemId>("sawah");
  const [seconds, setSeconds] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const { playSfx } = useAudio();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const eco = new URLSearchParams(window.location.search).get("ekosistem");
      if (eco === "sawah" || eco === "hutan" || eco === "laut") {
        setEcosystem(eco);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function submit() {
    const name1 = player1Name.trim();
    const name2 = player2Name.trim();
    if (name1.length < 2 || name2.length < 2) {
      setError("Nama pemain atau tim minimal 2 karakter.");
      return;
    }
    if (name1.toLowerCase() === name2.toLowerCase()) {
      setError("Nama kedua pemain harus berbeda.");
      return;
    }
    setError(null);
    onStart({
      player1Name: name1,
      player1Avatar,
      player2Name: name2,
      player2Avatar,
      ecosystem,
      seconds,
    });
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-4 px-4 py-8 lg:grid-cols-[1.25fr_0.75fr]">
      <section className="sticker rounded-3xl bg-white p-5 sm:p-6">
        <p className="inline-flex items-center gap-2 rounded-full border-2 border-ink/15 bg-cream px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          <Layers aria-hidden className="h-4 w-4" />
          Susun Cepat
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl">
          Susun Rantai Makanan
        </h1>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-ink-soft">
          Dua area bermain terpisah. Geser kartu makhluk hidup ke posisi yang
          benar, lalu kunci jawaban. Setiap posisi benar bernilai 100 poin dan
          yang lebih dulu selesai mendapat bonus 250.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {[
            {
              title: "Tim Hijau",
              name: player1Name,
              setName: setPlayer1Name,
              avatar: player1Avatar,
              setAvatar: setPlayer1Avatar,
              panel: "border-duel-green bg-duel-green-soft",
              header: "text-duel-green-deep",
            },
            {
              title: "Tim Oranye",
              name: player2Name,
              setName: setPlayer2Name,
              avatar: player2Avatar,
              setAvatar: setPlayer2Avatar,
              panel: "border-duel-orange bg-duel-orange-soft",
              header: "text-duel-orange-deep",
            },
          ].map((player) => (
            <div
              key={player.title}
              className={`rounded-2xl border-[3px] p-4 ${player.panel}`}
            >
              <h2
                className={`text-sm font-extrabold uppercase tracking-wide ${player.header}`}
              >
                {player.title}
              </h2>
              <label className="mt-2 flex flex-col gap-1 text-xs font-extrabold text-ink">
                Nama
                <input
                  value={player.name}
                  onChange={(event) =>
                    player.setName(event.target.value.slice(0, 16))
                  }
                  maxLength={16}
                  autoComplete="off"
                  className="min-h-11 rounded-xl border-[3px] border-ink/25 bg-white px-3 py-2 text-base font-bold text-ink"
                />
              </label>
              <p className="mt-3 text-xs font-extrabold text-ink">Pilih avatar</p>
              <div
                className="mt-1.5 grid grid-cols-5 gap-1.5"
                role="group"
                aria-label={`Avatar ${player.title}`}
              >
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
            <Users aria-hidden className="h-4 w-4" />
            Pilih ekosistem
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {ECOSYSTEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setEcosystem(item.id);
                  playSfx("button-click");
                }}
                aria-pressed={ecosystem === item.id}
                className={`flex min-h-12 items-center gap-2 rounded-xl border-[3px] px-3 py-2 text-left text-sm font-extrabold ${
                  ecosystem === item.id
                    ? "border-ink bg-sun text-ink"
                    : "border-ink/15 bg-cream text-ink-soft"
                }`}
              >
                <span aria-hidden className="text-2xl leading-none">
                  {item.emoji}
                </span>
                {item.name}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-xs font-semibold text-ink-soft">
            Jumlah kartu mengikuti panjang rantai pada ekosistem yang dipilih.
          </p>
        </fieldset>

        <fieldset className="mt-5">
          <legend className="flex items-center gap-2 text-sm font-extrabold text-ink">
            <Timer aria-hidden className="h-4 w-4" />
            Batas waktu
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {DURATIONS.map((duration) => (
              <button
                key={duration}
                type="button"
                onClick={() => {
                  setSeconds(duration);
                  playSfx("button-click");
                }}
                aria-pressed={seconds === duration}
                className={`min-h-11 rounded-xl border-[3px] px-4 py-2 text-sm font-extrabold ${
                  seconds === duration
                    ? "border-ink bg-sun text-ink"
                    : "border-ink/15 bg-cream text-ink-soft"
                }`}
              >
                {duration} detik
              </button>
            ))}
          </div>
        </fieldset>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border-[3px] border-[#B4567A] bg-pengurai-soft px-3 py-2 text-sm font-bold text-pengurai-deep"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          className="sticker sticker-press mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-sun px-5 py-3 font-display text-xl font-semibold text-ink"
        >
          <Layers aria-hidden className="h-5 w-5" />
          Mulai susun cepat
        </button>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="soft-card rounded-3xl bg-white p-5">
          <h2 className="font-display text-xl font-semibold text-ink">
            Cara bermain
          </h2>
          <ol className="mt-3 flex flex-col gap-2 text-sm font-semibold text-ink/85">
            {[
              "Geser kartu dari pool ke posisi, atau ketuk kartu lalu ketuk posisi.",
              "Kartu yang sudah di posisi bisa dipindah dan ditukar.",
              "Kunci jawaban hanya setelah semua posisi terisi.",
              "Jawaban salah membekukan areamu selama 2 detik.",
            ].map((step, index) => (
              <li key={step} className="flex gap-2 rounded-xl bg-cream px-3 py-2">
                <span className="font-extrabold text-ink">{index + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-3xl border-[3px] border-dashed border-ink/25 bg-white/70 p-5">
          <h2 className="font-display text-lg font-semibold text-ink">
            Skor susun
          </h2>
          <ul className="mt-2 flex flex-col gap-1.5 text-sm font-semibold text-ink/85">
            <li className="flex items-center justify-between rounded-lg bg-produsen-soft px-3 py-2">
              <span>Posisi benar</span>
              <span className="font-extrabold text-produsen-deep">+100</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-[#FFF3CC] px-3 py-2">
              <span>Pertama selesai</span>
              <span className="font-extrabold text-[#7A5A05]">+250</span>
            </li>
          </ul>
          <p className="mt-3 text-xs font-semibold leading-relaxed text-ink-soft">
            Skor memakai jumlah posisi benar terbaik pada percobaan terakhir
            yang dikunci.
          </p>
        </div>
      </aside>
    </div>
  );
}
