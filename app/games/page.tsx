import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock3,
  Layers,
  Lightbulb,
  Sparkles,
  Swords,
  Trophy,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Arena Games & Duel",
  description:
    "Duel kuis 1 vs 1 dan Susun Cepat Rantai Makanan untuk dua pemain di satu layar.",
};

const GAMES = [
  {
    href: "/arena",
    title: "Duel Ekosistem",
    tagline: "Kuis 1 vs 1",
    description:
      "Soal yang sama untuk kedua pemain. Jawaban benar +100, tercepat +50, jawaban salah membekukan panel dua detik.",
    emoji: "⚔️",
    icon: Swords,
    className: "bg-[#E4F3E2]",
    accent: "text-produsen-deep",
    border: "border-[#2F7A45]",
    meta: ["Maksimal 10 soal", "20–45 detik per soal", "Satu perangkat atau kode ruangan"],
  },
  {
    href: "/games/susun-cepat",
    title: "Susun Cepat",
    tagline: "Drag and drop",
    description:
      "Susun rantai makanan dari kartu yang berserakan. Setiap posisi benar bernilai 100 poin, bonus 250 untuk yang lebih dulu selesai.",
    emoji: "🧩",
    icon: Layers,
    className: "bg-[#FFF3CC]",
    accent: "text-konsumen1-deep",
    border: "border-[#B98A0E]",
    meta: ["Sawah, hutan, laut", "30 detik bawaan", "Pool kartu terpisah"],
  },
] as const;

const TIPS = [
  {
    title: "Baca materinya dulu",
    body: "Lima kartu peran di halaman Belajar menjelaskan produsen sampai pengurai beserta contohnya.",
    emoji: "📖",
    href: "/belajar",
    cta: "Buka materi",
  },
  {
    title: "Main berdua",
    body: "Dua pemain bergiliran menyentuh panelnya masing-masing. Di layar besar, panel kiri untuk Tim Hijau dan panel kanan untuk Tim Oranye.",
    emoji: "👥",
    href: "/juara",
    cta: "Lihat papan juara",
  },
  {
    title: "Cek hasilnya",
    body: "Setiap pertandingan tersimpan di perangkat ini. Skor, kemenangan, dan lencana muncul di halaman Juara.",
    emoji: "🏆",
    href: "/guru",
    cta: "Panel guru",
  },
] as const;

export default function GamesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          <Sparkles aria-hidden className="h-4 w-4 text-sun-deep" />
          Arena Games
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          Pilih permainanmu
        </h1>
        <p className="mt-3 text-base font-semibold leading-relaxed text-ink/85 sm:text-lg">
          Dua permainan, satu tujuan: memahami aliran energi dalam ekosistem.
          Tidak perlu akun, tidak perlu instalasi.
        </p>
      </header>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        {GAMES.map((game) => {
          const Icon = game.icon;
          return (
            <article
              key={game.href}
              className={`sticker flex flex-col rounded-3xl ${game.className} p-5 sm:p-6`}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  aria-hidden
                  className="flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-ink bg-white text-4xl"
                >
                  {game.emoji}
                </span>
                <span className={`inline-flex items-center gap-1.5 rounded-full border-2 ${game.border} bg-white px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${game.accent}`}>
                  <Icon aria-hidden className="h-3.5 w-3.5" />
                  {game.tagline}
                </span>
              </div>

              <h2 className="mt-4 font-display text-3xl font-semibold text-ink">
                {game.title}
              </h2>
              <p className="mt-2 flex-1 text-sm font-semibold leading-relaxed text-ink/80">
                {game.description}
              </p>

              <ul className="mt-4 flex flex-col gap-1.5">
                {game.meta.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs font-bold text-ink/75"
                  >
                    <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ink/40" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href={game.href}
                className="sticker sticker-press mt-5 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-extrabold text-ink"
              >
                Mainkan {game.title}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          Sebelum mulai
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {TIPS.map((tip) => (
            <div key={tip.title} className="soft-card rounded-3xl bg-white p-5">
              <span aria-hidden className="text-3xl leading-none">
                {tip.emoji}
              </span>
              <h3 className="mt-2 font-display text-xl font-semibold text-ink">
                {tip.title}
              </h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/80">
                {tip.body}
              </p>
              <Link
                href={tip.href}
                className="mt-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-extrabold text-produsen-deep underline decoration-2 underline-offset-4"
              >
                {tip.cta}
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-4 rounded-3xl border-[3px] border-dashed border-ink/25 bg-white/70 p-5 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink/20 bg-cream">
            <Users aria-hidden className="h-5 w-5 text-produsen-deep" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Dua pemain, satu layar
            </h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/75">
              Mode utama tidak membutuhkan internet. Cocok untuk laptop,
              proyektor, tablet, dan papan interaktif.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink/20 bg-cream">
            <Clock3 aria-hidden className="h-5 w-5 text-konsumen2-deep" />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Waktu dan skor
            </h2>
            <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/75">
              Timer berjalan per ronde. Setelah ronde ditutup, jawaban benar dan
              pembahasan baru ditampilkan.
            </p>
          </div>
        </div>
      </section>

      <p className="mt-6 flex items-start gap-2 rounded-2xl bg-cream px-4 py-3 text-xs font-semibold leading-relaxed text-ink-soft">
        <Lightbulb aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-sun-deep" />
        Mode kode ruangan untuk dua perangkat tersedia di Duel Ekosistem bila
        guru sudah menghubungkan proyek Supabase. Tanpa Supabase, seluruh
        permainan tetap berjalan di satu perangkat.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/belajar"
          className="flex min-h-11 items-center gap-2 rounded-xl border-[3px] border-ink/20 bg-white px-4 py-2 text-sm font-extrabold text-ink"
        >
          Kembali ke materi
        </Link>
        <Link
          href="/juara"
          className="flex min-h-11 items-center gap-2 rounded-xl border-[3px] border-ink/20 bg-white px-4 py-2 text-sm font-extrabold text-ink"
        >
          <Trophy aria-hidden className="h-4 w-4 text-sun-deep" />
          Papan juara
        </Link>
      </div>
    </div>
  );
}
