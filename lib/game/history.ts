import {
  BADGE_MAP,
  deriveBadgeUnlocks,
  mergeBadgeUnlocks,
} from "@/lib/data/badges";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";
import type {
  BadgeUnlock,
  LeaderboardEntry,
  LeaderboardFilter,
  MatchRecord,
} from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

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

export function recordMatch(record: MatchRecord): BadgeUnlock[] {
  const history = loadHistory();
  const next = [record, ...history.filter((item) => item.id !== record.id)].slice(
    0,
    MAX_HISTORY,
  );
  saveHistory(next);
  const unlocks = syncBadgeUnlocks(next);
  void recordMatchOnline(record, unlocks);
  return unlocks;
}

async function recordMatchOnline(record: MatchRecord, unlocks: BadgeUnlock[]): Promise<void> {
  const client = getSupabase();
  if (!client) return;
  const { error } = await client.rpc("eco_record_match", {
    p_id: record.id, p_game: record.game,
    p_p1_name: record.player1.name, p_p1_avatar: record.player1.avatar, p_p1_score: record.player1.score,
    p_p2_name: record.player2.name, p_p2_avatar: record.player2.avatar, p_p2_score: record.player2.score,
    p_winner: record.winner, p_detail: record.detail, p_created_at: record.createdAt,
  });
  if (error) return;
  await Promise.all(unlocks.map((unlock) => client.rpc("eco_record_badge", {
    p_player_key: unlock.player.trim().toLowerCase(), p_player_name: unlock.player,
    p_badge_id: unlock.id, p_unlocked_at: unlock.unlockedAt,
  })));
}

export async function loadOnlineHistory(): Promise<MatchRecord[] | null> {
  const client = getSupabase();
  if (!client) return null;
  const { data, error } = await client.from("eco_matches").select("*").order("created_at", { ascending: false }).limit(MAX_HISTORY);
  if (error) return null;
  return (data ?? []).map((row) => ({
    id: row.id, game: row.game, winner: row.winner, createdAt: row.created_at,
    player1: { name: row.player1_name, avatar: row.player1_avatar, score: row.score_p1 },
    player2: { name: row.player2_name, avatar: row.player2_avatar, score: row.score_p2 },
    detail: row.detail,
  } as MatchRecord));
}

export interface MergedHistory {
  records: MatchRecord[];
  online: boolean;
}

export function loadMergedHistory(): MergedHistory {
  const local = loadHistory();
  return { records: local, online: false };
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
