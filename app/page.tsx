import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Gamepad2,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const TABS = [
  {
    href: "/belajar",
    title: "Belajar Materi",
    description:
      "Lima peran makhluk hidup, aliran energi, panel Tahukah Kamu, dan mini checkpoint.",
    icon: BookOpen,
    emoji: "🌿",
    className: "bg-[#E4F3E2]",
    accent: "text-produsen-deep",
    cta: "Mulai belajar",
  },
  {
    href: "/games",
    title: "Arena Games & Duel",
    description:
      "Duel kuis 1 vs 1 dan Susun Cepat Rantai Makanan untuk dua pemain di satu layar.",
    icon: Gamepad2,
    emoji: "⚔️",
    className: "bg-[#FFF3CC]",
    accent: "text-konsumen1-deep",
    cta: "Masuk arena",
  },
  {
    href: "/juara",
    title: "Papan Juara & Kesimpulan",
    description:
      "Skor terbaik, lencana digital, dan rangkuman materi dalam satu halaman.",
    icon: Trophy,
    emoji: "🏆",
    className: "bg-[#EEE7FA]",
    accent: "text-puncak-deep",
    cta: "Lihat juara",
  },
] as const;

const STEPS = [
  {
    title: "Pahami materinya",
    body: "Buka lima kartu peran dan telusuri contoh rantai makanan.",
    emoji: "📖",
  },
  {
    title: "Mainkan berdua",
    body: "Satu perangkat, dua panel. Jawab atau susun lebih cepat dari lawan.",
    emoji: "🎮",
  },
  {
    title: "Kumpulkan lencana",
    body: "Menang berturut-turut, susun kilat, dan kuasai semua ekosistem.",
    emoji: "🏅",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rise">
          <p className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            <Sparkles aria-hidden className="h-4 w-4 text-sun-deep" />
            IPAS Kelas 6 · Kurikulum Merdeka
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.03] tracking-tight text-ink sm:text-6xl">
            Harmoni dalam
            <br />
            <span className="text-produsen-deep">Ekosistem</span>
          </h1>
          <p className="mt-4 max-w-xl text-base font-semibold leading-relaxed text-ink/85 sm:text-lg">
            Belajar rantai makanan sambil bertanding. Kenali produsen, konsumen,
            dan pengurai, lalu buktikan siapa yang paling cepat memahami aliran
            energi.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/belajar"
              className="sticker sticker-press flex min-h-12 items-center gap-2 rounded-2xl bg-sun px-5 py-3 text-base font-extrabold text-ink"
            >
              Belajar materi
              <ArrowRight aria-hidden className="h-5 w-5" />
            </Link>
            <Link
              href="/games"
              className="sticker sticker-press flex min-h-12 items-center gap-2 rounded-2xl bg-white px-5 py-3 text-base font-extrabold text-ink"
            >
              <Gamepad2 aria-hidden className="h-5 w-5" />
              Main sekarang
            </Link>
          </div>
          <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <Users aria-hidden className="h-4 w-4" /> 1 vs 1 di satu perangkat
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap aria-hidden className="h-4 w-4" /> Tanpa instalasi
            </span>
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-md">
          <div
            aria-hidden
            className="float-soft absolute -left-1 -top-4 z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-[3px] border-ink bg-sun text-3xl"
          >
            ☀️
          </div>
          <div className="sticker rotate-[1.5deg] rounded-3xl bg-white p-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-ink-soft">
              Aliran energi
            </p>
            <p className="mt-1 font-display text-2xl font-semibold text-ink">
              Siapa makan siapa?
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {[
                { emoji: "🌾", label: "Padi", role: "Produsen", className: "bg-produsen-soft text-produsen-deep" },
                { emoji: "🦗", label: "Belalang", role: "Konsumen I", className: "bg-konsumen1-soft text-konsumen1-deep" },
                { emoji: "🐸", label: "Katak", role: "Konsumen II", className: "bg-konsumen2-soft text-konsumen2-deep" },
                { emoji: "🐍", label: "Ular", role: "Konsumen III", className: "bg-konsumen2-soft text-konsumen2-deep" },
                { emoji: "🦅", label: "Elang", role: "Konsumen puncak", className: "bg-puncak-soft text-puncak-deep" },
              ].map((item, index, list) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/15 text-2xl ${item.className}`}
                    aria-hidden
                  >
                    {item.emoji}
                  </span>
                  <span className="flex-1 font-extrabold text-ink">{item.label}</span>
                  <span className={`rounded-lg px-2 py-1 text-[11px] font-extrabold ${item.className}`}>
                    {item.role}
                  </span>
                  {index < list.length - 1 && (
                    <span aria-hidden className="text-xs font-extrabold text-ink/30">
                      ↓
                    </span>
                  )}
                </div>
              ))}
            </div>
            <p className="mt-4 rounded-xl bg-cream px-3 py-2 text-xs font-bold leading-relaxed text-ink-soft">
              Pengurai menguraikan sisa dari semua tingkat, lalu mengembalikan
              unsur hara ke tanah.
            </p>
          </div>
          <div
            aria-hidden
            className="absolute -bottom-4 -right-2 z-10 flex h-14 w-14 rotate-6 items-center justify-center rounded-2xl border-[3px] border-ink bg-pengurai-soft text-2xl"
          >
            🍄
          </div>
        </div>
      </section>

      <section className="border-y-[3px] border-ink/10 bg-[#FFF9EC]">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-ink-soft">
                Tiga bagian utama
              </p>
              <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                Mau mulai dari mana?
              </h2>
            </div>
            <p className="max-w-sm text-sm font-semibold text-ink-soft">
              Navigasi yang sama selalu tersedia di bagian atas layar, termasuk
              di ponsel dan tablet.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`sticker sticker-press group flex flex-col rounded-3xl ${tab.className} p-5`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <span
                      aria-hidden
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border-[3px] border-ink bg-white text-2xl"
                    >
                      {tab.emoji}
                    </span>
                    <Icon aria-hidden className={`h-6 w-6 ${tab.accent}`} />
                  </span>
                  <span className="mt-4 font-display text-2xl font-semibold text-ink">
                    {tab.title}
                  </span>
                  <span className="mt-1 flex-1 text-sm font-semibold leading-relaxed text-ink/80">
                    {tab.description}
                  </span>
                  <span className={`mt-4 inline-flex items-center gap-2 text-sm font-extrabold ${tab.accent}`}>
                    {tab.cta}
                    <ArrowRight
                      aria-hidden
                      className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="font-display text-3xl font-semibold text-ink">
          Cara bermain
        </h2>
        <ol className="mt-5 grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="soft-card rounded-3xl bg-white p-5">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-ink bg-cream font-display text-lg font-semibold">
                  {index + 1}
                </span>
                <span aria-hidden className="text-3xl leading-none">
                  {step.emoji}
                </span>
              </span>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">
                {step.title}
              </h3>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/80">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl border-[3px] border-dashed border-ink/25 bg-white/70 px-5 py-4">
          <p className="max-w-2xl text-sm font-semibold leading-relaxed text-ink-soft">
            Semua permainan bisa dimainkan tanpa akun dan tanpa internet.
            Mode kode ruangan untuk dua perangkat aktif jika proyek Supabase
            sudah dihubungkan oleh guru.
          </p>
          <Link
            href="/guru"
            className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-ink"
          >
            <Trophy aria-hidden className="h-4 w-4 text-sun-deep" />
            Panel guru
          </Link>
        </div>
      </section>
    </div>
  );
}
