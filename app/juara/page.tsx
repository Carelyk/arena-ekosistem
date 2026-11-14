"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  CalendarDays,
  Crown,
  Loader2,
  Medal,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BADGES, BADGE_MAP } from "@/lib/data/badges";
import { CONCLUSION_POINTS } from "@/lib/data/learning";
import {
  badgesForPlayer,
  buildLeaderboard,
  loadHistory,
  syncBadgeUnlocks,
} from "@/lib/game/history";
import type {
  BadgeUnlock,
  LeaderboardEntry,
  LeaderboardFilter,
  MatchRecord,
} from "@/lib/types";

const FILTERS: Array<{ id: LeaderboardFilter; label: string }> = [
  { id: "all", label: "Semua" },
  { id: "duel", label: "Duel" },
  { id: "susun", label: "Susun Cepat" },
];

const RANK_STYLES = [
  "border-[#B98A0E] bg-[#FFF3CC]",
  "border-[#7C8794] bg-[#EEF1F4]",
  "border-[#B06B3A] bg-[#FBE9DC]",
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function ScoreCard({
  entry,
  rank,
  unlocks,
}: {
  entry: LeaderboardEntry;
  rank: number;
  unlocks: BadgeUnlock[];
}) {
  const badges = badgesForPlayer(unlocks, entry.name);
  const style = RANK_STYLES[rank] ?? "border-ink/15 bg-white";

  return (
    <li
      className={`flex flex-col gap-2 rounded-2xl border-[3px] p-4 ${style}`}
    >
      <div className="flex items-start gap-3">
        <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-ink/20 bg-white text-2xl">
          <span aria-hidden>{entry.avatar}</span>
          <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink bg-white text-[11px] font-extrabold text-ink">
            {rank + 1}
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-xl font-semibold text-ink">
            {entry.name}
          </p>
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
            {entry.title}
          </p>
        </div>
        <p className="shrink-0 font-display text-2xl font-semibold tabular-nums text-ink">
          {entry.score}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-bold text-ink/70">
        <span className="inline-flex items-center gap-1">
          <Medal aria-hidden className="h-3.5 w-3.5" />
          {entry.wins} menang
        </span>
        <span className="inline-flex items-center gap-1">
          <Target aria-hidden className="h-3.5 w-3.5" />
          {entry.matches} pertandingan
        </span>
        <span className="inline-flex items-center gap-1">
          <CalendarDays aria-hidden className="h-3.5 w-3.5" />
          {formatDate(entry.date)}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {badges.length === 0 ? (
          <span className="rounded-lg bg-white/70 px-2 py-1 text-[11px] font-bold text-ink-soft">
            Belum ada lencana
          </span>
        ) : (
          badges.map((unlock) => {
            const badge = BADGE_MAP[unlock.id];
            if (!badge) return null;
            return (
              <span
                key={`${unlock.id}-${unlock.unlockedAt}`}
                className="inline-flex items-center gap-1 rounded-lg border-2 border-ink/15 bg-white px-2 py-1 text-[11px] font-extrabold text-ink"
                title={badge.name}
              >
                <span aria-hidden>{badge.emoji}</span>
                {badge.title}
              </span>
            );
          })
        )}
      </div>
    </li>
  );
}

export default function JuaraPage() {
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [unlocks, setUnlocks] = useState<BadgeUnlock[]>([]);
  const [filter, setFilter] = useState<LeaderboardFilter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    // Deferred one task so the local read does not call setState in the effect body.
    const timer = window.setTimeout(() => {
      const local = loadHistory();
      const localUnlocks = syncBadgeUnlocks(local);
      if (!active) return;
      setHistory(local);
      setUnlocks(localUnlocks);
      setLoading(false);
    }, 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, []);

  const entries = useMemo(
    () => buildLeaderboard(history, filter, unlocks),
    [history, filter, unlocks],
  );

  const visibleEntries = entries.slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          <Trophy aria-hidden className="h-4 w-4 text-sun-deep" />
          Papan Juara & Kesimpulan
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          Siapa penjaga ekosistem?
        </h1>
        <p className="mt-3 text-base font-semibold leading-relaxed text-ink/85 sm:text-lg">
          Skor terbaik dari duel dan susun cepat. Setiap pertandingan yang
          selesai otomatis tercatat di perangkat ini.
        </p>
        <p className="mt-2 text-xs font-bold text-ink-soft">
          Sumber data: penyimpanan lokal perangkat ini.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="group" aria-label="Filter papan juara">
        {FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setFilter(item.id)}
            aria-pressed={filter === item.id}
            className={`min-h-11 rounded-xl border-[3px] px-4 py-2 text-sm font-extrabold ${
              filter === item.id
                ? "border-ink bg-sun text-ink"
                : "border-ink/15 bg-white text-ink-soft"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <section aria-labelledby="skor-heading" className="mt-6">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2 id="skor-heading" className="font-display text-2xl font-semibold text-ink">
            Skor terbaik
          </h2>
          <p className="text-xs font-bold text-ink-soft">
            Menampilkan maksimal 10 pemain dengan skor tertinggi.
          </p>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 rounded-2xl border-[3px] border-dashed border-ink/20 bg-white px-4 py-6 text-sm font-bold text-ink-soft">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Memuat riwayat pertandingan...
          </p>
        ) : visibleEntries.length === 0 ? (
          <div className="sticker rounded-3xl bg-white p-6 text-center">
            <p aria-hidden className="text-5xl leading-none">
              🏁
            </p>
            <h3 className="mt-3 font-display text-2xl font-semibold text-ink">
              Belum ada pertandingan
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm font-semibold leading-relaxed text-ink-soft">
              Mainkan Duel Ekosistem atau Susun Cepat sampai selesai. Skor,
              kemenangan, dan lencana akan muncul di sini.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href="/arena"
                className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink"
              >
                Mulai duel
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <Link
                href="/games/susun-cepat"
                className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-ink"
              >
                Susun cepat
              </Link>
            </div>
          </div>
        ) : (
          <ol className="grid gap-3 sm:grid-cols-2">
            {visibleEntries.map((entry, index) => (
              <ScoreCard
                key={entry.key}
                entry={entry}
                rank={index}
                unlocks={unlocks}
              />
            ))}
          </ol>
        )}
      </section>

      <section aria-labelledby="lencana-heading" className="mt-12">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2
            id="lencana-heading"
            className="font-display text-2xl font-semibold text-ink"
          >
            Lencana digital
          </h2>
          <p className="text-xs font-bold text-ink-soft">
            Terbuka otomatis berdasarkan riwayat pertandingan.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BADGES.map((badge) => {
            const holders = unlocks.filter((unlock) => unlock.id === badge.id);
            return (
              <li
                key={badge.id}
                className={`flex flex-col rounded-2xl border-[3px] p-4 ${
                  holders.length > 0
                    ? "border-sun bg-[#FFF8E3]"
                    : "border-ink/15 bg-white"
                }`}
              >
                <div className="flex items-start gap-2">
                  <span aria-hidden className="text-3xl leading-none">
                    {badge.emoji}
                  </span>
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">
                      {badge.title}
                    </p>
                    <p className="text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
                      {badge.name}
                    </p>
                  </div>
                </div>
                <p className="mt-2 flex-1 text-xs font-semibold leading-relaxed text-ink/80">
                  {badge.description}
                </p>
                <p className="mt-3 flex flex-wrap gap-1">
                  {holders.length === 0 ? (
                    <span className="rounded-lg bg-cream px-2 py-1 text-[11px] font-bold text-ink-soft">
                      Belum terbuka
                    </span>
                  ) : (
                    holders.map((unlock) => (
                      <span
                        key={`${unlock.id}-${unlock.player}`}
                        className="inline-flex items-center gap-1 rounded-lg border-2 border-sun bg-white px-2 py-1 text-[11px] font-extrabold text-ink"
                      >
                        <Award aria-hidden className="h-3 w-3" />
                        {unlock.player}
                      </span>
                    ))
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section
        aria-labelledby="kesimpulan-heading"
        className="sticker mt-12 overflow-hidden rounded-3xl bg-white"
      >
        <div className="flex items-center gap-3 border-b-[3px] border-ink/10 bg-produsen-soft px-5 py-4">
          <Crown aria-hidden className="h-6 w-6 text-produsen-deep" />
          <h2
            id="kesimpulan-heading"
            className="font-display text-2xl font-semibold text-produsen-deep"
          >
            Kesimpulan: Harmoni dalam Ekosistem
          </h2>
        </div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <ul className="flex flex-col gap-2">
            {CONCLUSION_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2 rounded-xl bg-cream px-3 py-2 text-sm font-semibold leading-relaxed text-ink/85"
              >
                <Sparkles aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-sun-deep" />
                {point}
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-3">
            <div className="rounded-2xl border-[3px] border-dashed border-ink/20 bg-cream px-4 py-3">
              <p className="font-display text-lg font-semibold text-ink">
                Aliran energi tidak berputar bebas
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/80">
                Energi masuk dari Matahari melalui produsen, berpindah ke
                konsumen, dan sebagian hilang sebagai panas di setiap tingkat.
                Pengurai mengembalikan materi, bukan energi, agar produsen dapat
                tumbuh lagi.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href="/belajar"
                className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink"
              >
                Ulangi materi
                <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
              <Link
                href="/games"
                className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-ink"
              >
                Main lagi
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
