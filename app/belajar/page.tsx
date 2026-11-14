import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Gamepad2,
  Leaf,
  Sparkles,
  Sun,
} from "lucide-react";
import { Checkpoint } from "@/components/learning/Checkpoint";
import { EcosystemLearningJourney } from "@/components/learning/EcosystemLearningJourney";
import { FunFactPanel } from "@/components/learning/FunFactPanel";
import { RoleLearningSection } from "@/components/learning/RoleLearningSection";
import { ORGANISM_CARDS } from "@/lib/data/learning";

export const metadata: Metadata = {
  title: "Belajar Materi",
  description:
    "Pelajari rantai makanan, lima peran makhluk hidup, aliran energi, dan peran pengurai.",
};

const HERO_CHAIN = [
  { emoji: "🌿", label: "Rumput", className: "bg-produsen-soft text-produsen-deep" },
  { emoji: "🦗", label: "Belalang", className: "bg-konsumen1-soft text-konsumen1-deep" },
  { emoji: "🐸", label: "Katak", className: "bg-konsumen2-soft text-konsumen2-deep" },
  { emoji: "🐍", label: "Ular", className: "bg-konsumen2-soft text-konsumen2-deep" },
  { emoji: "🦅", label: "Elang", className: "bg-puncak-soft text-puncak-deep" },
];

export default function BelajarPage() {
  return (
    <div>
      <section className="border-b-[3px] border-ink/10 bg-[#FFF9EC]">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:py-14 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rise">
            <p className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
              <Leaf aria-hidden className="h-4 w-4 text-produsen" />
              Harmoni dalam Ekosistem
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              Rantai Makanan
            </h1>
            <p className="mt-3 text-base font-extrabold text-ink sm:text-lg">
              “Rantai makanan adalah proses perpindahan energi dan nutrisi antar makhluk hidup di suatu ekosistem.”
            </p>
            <p className="mt-3 max-w-xl text-sm font-semibold leading-relaxed text-ink/85 sm:text-base">
              Makhluk hidup memerlukan makanan untuk memperoleh energi, tumbuh,
              bergerak, dan berkembang biak. Energi itu berasal dari Matahari,
              lalu berpindah dari satu makhluk hidup ke makhluk hidup lain.
            </p>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border-[3px] border-sun bg-white px-4 py-3">
              <Sun aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-sun-deep" />
              <p className="text-sm font-semibold leading-relaxed text-ink/85">
                <strong className="font-extrabold text-ink">Ingat:</strong>{" "}
                tumbuhan tidak menciptakan energi. Produsen menangkap cahaya
                Matahari dan mengubahnya menjadi energi kimia melalui
                fotosintesis.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="#kartu"
                className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-sun px-4 py-2.5 text-sm font-extrabold text-ink"
              >
                <BookOpenCheck aria-hidden className="h-4 w-4" />
                Mulai dari lima peran
              </Link>
              <Link
                href="/games"
                className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-ink"
              >
                <Gamepad2 aria-hidden className="h-4 w-4" />
                Buka Arena Games
              </Link>
            </div>
          </div>

          <div className="sticker relative rotate-[-1.5deg] rounded-3xl bg-white p-5">
            <p className="flex items-center gap-2 text-sm font-extrabold text-ink-soft">
              <Sparkles aria-hidden className="h-4 w-4 text-sun-deep" />
              Contoh aliran energi
            </p>
            <ol className="mt-3 flex flex-col gap-2">
              {HERO_CHAIN.map((step, index) => (
                <li key={step.label} className="flex items-center gap-3">
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-ink/15 text-2xl ${step.className}`}
                    aria-hidden
                  >
                    {step.emoji}
                  </span>
                  <span className="flex-1 font-display text-lg font-semibold text-ink">
                    {step.label}
                  </span>
                  {index < HERO_CHAIN.length - 1 && (
                    <span aria-hidden className="text-lg font-extrabold text-ink/35">
                      ↓
                    </span>
                  )}
                </li>
              ))}
            </ol>
            <p className="mt-3 rounded-xl bg-cream px-3 py-2 text-xs font-bold leading-relaxed text-ink-soft">
              Pengurai (🍄 jamur & bakteri) menguraikan sisa organisme dari
              semua tingkat, bukan hanya elang.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-12 sm:gap-16">
        <section aria-labelledby="kartu-heading" id="kartu">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-produsen-deep">
                Lima peran
              </p>
              <h2
                id="kartu-heading"
                className="font-display text-3xl font-semibold text-ink sm:text-4xl"
              >
                Siapa saja di rantai makanan?
              </h2>
            </div>
            <p className="max-w-sm text-sm font-semibold text-ink-soft">
              Ketuk kartu untuk membuka contoh, fungsi, dan fakta pentingnya.
            </p>
          </div>
          <RoleLearningSection cards={ORGANISM_CARDS} />
        </section>

        <EcosystemLearningJourney />

        <section aria-labelledby="tahukah-heading" id="tahukah">
          <h2 id="tahukah-heading" className="sr-only">
            Tahukah kamu
          </h2>
          <FunFactPanel />
        </section>

        <section aria-labelledby="checkpoint-heading" id="checkpoint">
          <div className="mb-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-puncak-deep">
              Mini checkpoint
            </p>
            <h2
              id="checkpoint-heading"
              className="font-display text-3xl font-semibold text-ink sm:text-4xl"
            >
              Sudah paham? Uji sebentar, yuk.
            </h2>
          </div>
          <Checkpoint />
        </section>

        <section className="sticker flex flex-col items-start justify-between gap-4 rounded-3xl bg-[#E4F3E2] p-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl font-semibold text-produsen-deep">
              Siap bermain?
            </h2>
            <p className="mt-1 max-w-xl text-sm font-semibold text-ink/80">
              Uji pemahamanmu lewat Duel Ekosistem atau susun rantai makanan
              secepat mungkin.
            </p>
          </div>
          <Link
            href="/games"
            className="sticker sticker-press flex min-h-11 shrink-0 items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-extrabold text-ink"
          >
            Pilih permainan
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
