import {
  BADGE_MAP,
  deriveBadgeUnlocks,
  mergeBadgeUnlocks,
} from "@/lib/data/badges";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type {
  BadgeUnlock,
  LeaderboardEntry,
  LeaderboardFilter,
  MatchRecord,
} from "@/lib/types";

const MAX_HISTORY = 200;

export function loadHistory(): MatchRecord[] {
  const stored = readJson<unknown>(STORAGE_KEYS.history, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (row): row is MatchRecord =>
      !!row &&
      typeof row === "object" &&
      typeof (row as MatchRecord).id === "string" &&
      typeof (row as MatchRecord).createdAt === "string" &&
      ((row as MatchRecord).game === "duel" || (row as MatchRecord).game === "susun"),
  );
}

export function saveHistory(history: MatchRecord[]): void {
  writeJson(STORAGE_KEYS.history, history.slice(0, MAX_HISTORY));
}

export function loadBadgeUnlocks(): BadgeUnlock[] {
  const stored = readJson<unknown>(STORAGE_KEYS.badges, []);
  if (!Array.isArray(stored)) return [];
  return stored.filter(
    (row): row is BadgeUnlock =>
      !!row &&
      typeof (row as BadgeUnlock).id === "string" &&
      typeof (row as BadgeUnlock).player === "string",
  );
}

export function saveBadgeUnlocks(unlocks: BadgeUnlock[]): void {
  writeJson(STORAGE_KEYS.badges, unlocks);
}

export function syncBadgeUnlocks(history: MatchRecord[]): BadgeUnlock[] {
  const derived = deriveBadgeUnlocks(history);
  const merged = mergeBadgeUnlocks(loadBadgeUnlocks(), derived);
  saveBadgeUnlocks(merged);
  return merged;
}

interface RemoteMatchRow {
  id: string;
  game: string;
  player1_name: string;
  player1_avatar: string;
  score_p1: number;
  player2_name: string;
  player2_avatar: string;
  score_p2: number;
  winner: string;
  detail: unknown;
  created_at: string;
}

function toRecord(row: RemoteMatchRow): MatchRecord {
  const detail =
    row.detail && typeof row.detail === "object"
      ? (row.detail as MatchRecord["detail"])
      : row.game === "duel"
        ? {
            kind: "duel" as const,
            rounds: 0,
            correctP1: 0,
            correctP2: 0,
            answersP1: 0,
            answersP2: 0,
            fastestBonusP1: 0,
            fastestBonusP2: 0,
          }
        : {
            kind: "susun" as const,
            ecosystem: "sawah" as const,
            completedP1: false,
            completedP2: false,
            finishMsP1: null,
            finishMsP2: null,
            correctP1: 0,
            correctP2: 0,
          };

  return {
    id: row.id,
    game: row.game === "susun" ? "susun" : "duel",
    player1: {
      name: row.player1_name,
      avatar: row.player1_avatar,
      score: Number(row.score_p1) || 0,
    },
    player2: {
      name: row.player2_name,
      avatar: row.player2_avatar,
      score: Number(row.score_p2) || 0,
    },
    winner:
      row.winner === "p1" || row.winner === "p2" || row.winner === "draw"
        ? row.winner
        : "draw",
    createdAt: row.created_at,
    detail,
  };
}

async function withTimeout<T>(promise: PromiseLike<T>, ms: number): Promise<T | null> {
  return await Promise.race([
    Promise.resolve(promise),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), ms);
    }),
  ]);
}

/**
 * `null` means the remote read failed (offline, blocked, or the migration is not
 * applied), which is different from a reachable but empty leaderboard.
 */
export async function fetchRemoteHistory(
  limit = 100,
): Promise<MatchRecord[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const query = supabase
      .from("eco_matches")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);
    const result = await withTimeout(query, 5000);
    if (!result || result.error || !Array.isArray(result.data)) return null;
    return (result.data as RemoteMatchRow[]).map(toRecord);
  } catch {
    return null;
  }
}

async function pushRemote(record: MatchRecord): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;
  try {
    // The RPC validates the score/winner pair server-side before publishing the
    // match to the shared leaderboard. Direct table inserts are not permitted.
    await withTimeout(
      supabase.rpc("eco_record_match", {
        p_id: record.id,
        p_game: record.game,
        p_p1_name: record.player1.name,
        p_p1_avatar: record.player1.avatar,
        p_p1_score: record.player1.score,
        p_p2_name: record.player2.name,
        p_p2_avatar: record.player2.avatar,
        p_p2_score: record.player2.score,
        p_winner: record.winner,
        p_detail: record.detail,
        p_created_at: record.createdAt,
      }),
      5000,
    );
  } catch {
    // Offline or migration not applied: the local record is already saved.
  }
}

/**
 * Persist locally first, then best-effort to Supabase. Local storage is the
 * source of truth so a missing migration can never break gameplay.
 */
export async function recordMatch(record: MatchRecord): Promise<BadgeUnlock[]> {
  const history = loadHistory();
  const next = [record, ...history.filter((item) => item.id !== record.id)].slice(
    0,
    MAX_HISTORY,
  );
  saveHistory(next);
  const unlocks = syncBadgeUnlocks(next);
  // The remote write is best-effort and must not delay the badge report: an
  // unreachable Supabase project would otherwise leave the result screen
  // showing "no new badges" forever.
  void pushRemote(record);
  return unlocks;
}

export interface MergedHistory {
  records: MatchRecord[];
  online: boolean;
}

export async function loadMergedHistory(): Promise<MergedHistory> {
  const local = loadHistory();
  if (!isSupabaseConfigured) return { records: local, online: false };
  const remote = await fetchRemoteHistory();
  const byId = new Map<string, MatchRecord>();
  for (const record of [...(remote ?? []), ...local]) {
    byId.set(record.id, record);
  }
  const records = [...byId.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  // Only claim the shared leaderboard when the remote read actually succeeded.
  return { records, online: remote !== null };
}

export function buildLeaderboard(
  history: MatchRecord[],
  filter: LeaderboardFilter,
  unlocks: BadgeUnlock[],
): LeaderboardEntry[] {
  const filtered = history.filter(
    (record) => filter === "all" || record.game === filter,
  );

  const aggregates = new Map<
    string,
    { name: string; avatar: string; score: number; wins: number; matches: number; date: string }
  >();

  for (const record of filtered) {
    const players: Array<{ player: MatchRecord["player1"]; won: boolean }> = [
      { player: record.player1, won: record.winner === "p1" },
      { player: record.player2, won: record.winner === "p2" },
    ];
    for (const { player, won } of players) {
      if (!player.name.trim()) continue;
      const key = `${player.name.trim().toLowerCase()}|${player.avatar}`;
      const current = aggregates.get(key) ?? {
        name: player.name.trim(),
        avatar: player.avatar,
        score: 0,
        wins: 0,
        matches: 0,
        date: record.createdAt,
      };
      current.score += player.score;
      current.wins += won ? 1 : 0;
      current.matches += 1;
      if (record.createdAt > current.date) current.date = record.createdAt;
      aggregates.set(key, current);
    }
  }

  const badgePriority = [
    "sempurna",
    "tiga-menang",
    "kilat",
    "semua-kategori",
    "penjelajah",
  ];

  return [...aggregates.entries()]
    .map(([key, value]) => {
      const playerBadges = unlocks.filter(
        (unlock) => unlock.player.trim().toLowerCase() === value.name.toLowerCase(),
      );
      const badgeIds = playerBadges.map((unlock) => unlock.id);
      const primary = badgePriority.find((id) => badgeIds.includes(id));
      const title = primary
        ? BADGE_MAP[primary]?.title ?? "Penjelajah Ekosistem"
        : value.wins > 0
          ? "Penjelajah Ekosistem"
          : "Siswa Peneliti";
      return {
        key,
        name: value.name,
        avatar: value.avatar,
        score: value.score,
        wins: value.wins,
        matches: value.matches,
        date: value.date,
        title,
        badges: badgeIds,
      };
    })
    .filter((entry) => entry.matches > 0)
    .sort((a, b) => b.score - a.score || b.wins - a.wins)
    .slice(0, 12);
}

export function badgesForPlayer(
  unlocks: BadgeUnlock[],
  player: string,
): BadgeUnlock[] {
  return unlocks.filter(
    (unlock) => unlock.player.trim().toLowerCase() === player.trim().toLowerCase(),
  );
}
