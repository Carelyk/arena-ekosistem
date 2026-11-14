import type { BadgeDefinition, BadgeUnlock, MatchRecord } from "@/lib/types";

export const BADGES: BadgeDefinition[] = [
  {
    id: "tiga-menang",
    name: "Menang 3 duel berturut-turut",
    title: "Penjaga Ekosistem",
    description:
      "Menangkan tiga duel berturut-turut. Konsistensi menjaga keseimbangan ekosistem.",
    emoji: "🛡️",
  },
  {
    id: "semua-kategori",
    name: "Menyelesaikan semua kategori susun cepat",
    title: "Ahli Rantai Makanan",
    description:
      "Selesaikan susunan Sawah, Hutan, dan Laut sampai seluruh posisi benar.",
    emoji: "🧩",
  },
  {
    id: "sempurna",
    name: "Semua jawaban duel benar",
    title: "Master Fotosintesis",
    description:
      "Jawab seluruh soal dalam satu duel dengan benar tanpa satu pun kesalahan.",
    emoji: "☀️",
  },
  {
    id: "kilat",
    name: "Susunan selesai di bawah 15 detik",
    title: "Sang Elang Perkasa",
    description:
      "Selesaikan seluruh susunan rantai makanan dalam waktu kurang dari 15 detik.",
    emoji: "⚡",
  },
  {
    id: "penjelajah",
    name: "Memainkan semua ekosistem",
    title: "Sahabat Pengurai",
    description:
      "Mainkan susun cepat di ketiga ekosistem: Sawah, Hutan, dan Laut.",
    emoji: "🍄",
  },
];

export const BADGE_MAP = Object.fromEntries(
  BADGES.map((badge) => [badge.id, badge]),
) as Record<string, BadgeDefinition>;

function duelWinners(record: MatchRecord): [string, string] | null {
  if (record.game !== "duel") return null;
  return [record.player1.name, record.player2.name];
}

function addWin(streaks: Map<string, number>, winner: string) {
  const next = (streaks.get(winner) ?? 0) + 1;
  streaks.set(winner, next);
  for (const key of streaks.keys()) {
    if (key !== winner) streaks.set(key, 0);
  }
  return next;
}

/**
 * Derive badge unlocks from stored match history. Idempotent: calling it again
 * with the same history yields the same set, so it is safe to run after every
 * saved match.
 */
export function deriveBadgeUnlocks(history: MatchRecord[]): BadgeUnlock[] {
  const unlocks = new Map<string, BadgeUnlock>();
  const ordered = [...history].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const duelStreaks = new Map<string, number>();
  const ecosystemsPlayed = new Map<string, Set<string>>();
  const ecosystemsFinished = new Map<string, Set<string>>();

  for (const record of ordered) {
    const unlockAt = record.createdAt;

    if (record.game === "duel") {
      const names = duelWinners(record);
      if (!names) continue;
      const [p1, p2] = names;

      if (record.winner === "p1" || record.winner === "p2") {
        const winner = record.winner === "p1" ? p1 : p2;
        const streak = addWin(duelStreaks, winner);
        if (streak >= 3 && !unlocks.has(`tiga-menang:${winner}`)) {
          unlocks.set(`tiga-menang:${winner}`, {
            id: "tiga-menang",
            player: winner,
            unlockedAt: unlockAt,
          });
        }
      } else {
        for (const key of duelStreaks.keys()) duelStreaks.set(key, 0);
      }

      if (record.detail.kind === "duel") {
        const p1Perfect = record.detail.rounds > 0 && record.detail.correctP1 === record.detail.rounds;
        const p2Perfect = record.detail.rounds > 0 && record.detail.correctP2 === record.detail.rounds;
        if (p1Perfect && !unlocks.has(`sempurna:${p1}`)) {
          unlocks.set(`sempurna:${p1}`, {
            id: "sempurna",
            player: p1,
            unlockedAt: unlockAt,
          });
        }
        if (p2Perfect && !unlocks.has(`sempurna:${p2}`)) {
          unlocks.set(`sempurna:${p2}`, {
            id: "sempurna",
            player: p2,
            unlockedAt: unlockAt,
          });
        }
      }
    }

    if (record.game === "susun" && record.detail.kind === "susun") {
      const detail = record.detail;
      const players: Array<{ name: string; completed: boolean; finishMs: number | null }> = [
        { name: record.player1.name, completed: detail.completedP1, finishMs: detail.finishMsP1 },
        { name: record.player2.name, completed: detail.completedP2, finishMs: detail.finishMsP2 },
      ];

      for (const player of players) {
        if (!ecosystemsPlayed.has(player.name)) {
          ecosystemsPlayed.set(player.name, new Set());
        }
        if (!ecosystemsFinished.has(player.name)) {
          ecosystemsFinished.set(player.name, new Set());
        }
        ecosystemsPlayed.get(player.name)?.add(detail.ecosystem);
        if (player.completed) {
          ecosystemsFinished.get(player.name)?.add(detail.ecosystem);
        }

        if (player.completed && player.finishMs !== null && player.finishMs < 15000) {
          const key = `kilat:${player.name}`;
          if (!unlocks.has(key)) {
            unlocks.set(key, {
              id: "kilat",
              player: player.name,
              unlockedAt: unlockAt,
            });
          }
        }
      }
    }
  }

  for (const [player, set] of ecosystemsFinished) {
    if (set.size >= 3 && !unlocks.has(`semua-kategori:${player}`)) {
      unlocks.set(`semua-kategori:${player}`, {
        id: "semua-kategori",
        player,
        unlockedAt: new Date().toISOString(),
      });
    }
  }

  for (const [player, set] of ecosystemsPlayed) {
    if (set.size >= 3 && !unlocks.has(`penjelajah:${player}`)) {
      unlocks.set(`penjelajah:${player}`, {
        id: "penjelajah",
        player,
        unlockedAt: new Date().toISOString(),
      });
    }
  }

  return [...unlocks.values()];
}

export function mergeBadgeUnlocks(
  stored: BadgeUnlock[],
  derived: BadgeUnlock[],
): BadgeUnlock[] {
  const merged = new Map<string, BadgeUnlock>();
  for (const unlock of [...stored, ...derived]) {
    merged.set(`${unlock.id}:${unlock.player}`, unlock);
  }
  return [...merged.values()].sort((a, b) =>
    a.unlockedAt.localeCompare(b.unlockedAt),
  );
}
