import { getSupabase } from "@/lib/supabase";
import type { CategoryId, Difficulty, OptionIndex } from "@/lib/types";

export type RoomPhase = "waiting" | "playing" | "revealed" | "finished";
export type RoomStatus =
  | "waiting"
  | "connected"
  | "playing"
  | "reconnecting"
  | "finished";

export interface RoomQuestion {
  id: string;
  text: string;
  options: [string, string, string, string];
  category: CategoryId;
  difficulty: Difficulty;
}

export interface RoomPlayer {
  slot: 0 | 1;
  name: string;
  avatar: string;
  score: number;
  solved: boolean;
  frozenUntil: string | null;
}

export interface RoomReveal {
  correctIndex: OptionIndex;
  explanation: string;
  firstSolver: 0 | 1 | null;
  solved: [boolean, boolean];
}

export interface RoomState {
  code: string;
  status: RoomStatus;
  phase: RoomPhase;
  roundIndex: number;
  totalRounds: number;
  roundSeconds: number;
  roundDeadline: string | null;
  players: [RoomPlayer, RoomPlayer];
  question: RoomQuestion | null;
  reveal: RoomReveal | null;
}

export interface RoomJoinResult {
  slot: 0 | 1;
  state: RoomState;
}

/**
 * The server returns jsonb, so every field is validated before it reaches the
 * UI. A malformed payload must degrade to a readable error instead of a crash.
 */
function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asBool(value: unknown): boolean {
  return value === true;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function parseOption(value: unknown, index: number): string {
  if (Array.isArray(value)) return asString(value[index]);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return asString(record[String(index)] ?? record[String.fromCharCode(65 + index)]);
  }
  return "";
}

function parseQuestion(value: unknown): RoomQuestion | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.text !== "string") return null;
  const options = item.options;
  return {
    id: item.id,
    text: item.text,
    options: [
      parseOption(options, 0),
      parseOption(options, 1),
      parseOption(options, 2),
      parseOption(options, 3),
    ],
    category: asString(item.category, "definisi") as CategoryId,
    difficulty: asString(item.difficulty, "mudah") as Difficulty,
  };
}

function parsePlayer(value: unknown, slot: 0 | 1): RoomPlayer {
  const item = (value && typeof value === "object" ? value : {}) as Record<
    string,
    unknown
  >;
  return {
    slot,
    name: asString(item.name, slot === 0 ? "Tim Hijau" : "Tim Oranye"),
    avatar: asString(item.avatar, slot === 0 ? "🦁" : "🐸"),
    score: asNumber(item.score),
    solved: asBool(item.solved),
    frozenUntil:
      typeof item.frozenUntil === "string" ? item.frozenUntil : null,
  };
}

function parseReveal(value: unknown): RoomReveal | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const correctIndex = asNumber(item.correctIndex, -1);
  if (correctIndex < 0 || correctIndex > 3) return null;
  const solved = Array.isArray(item.solved) ? item.solved : [];
  return {
    correctIndex: correctIndex as OptionIndex,
    explanation: asString(item.explanation),
    firstSolver:
      item.firstSolver === 0 || item.firstSolver === 1 ? item.firstSolver : null,
    solved: [asBool(solved[0]), asBool(solved[1])],
  };
}

export function normalizeRoomState(value: unknown): RoomState | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  const code = asString(item.code);
  if (!code) return null;

  const phase = asString(item.phase, "waiting");
  const status = asString(item.status, phase === "waiting" ? "waiting" : "playing");
  const players = Array.isArray(item.players) ? item.players : [];

  return {
    code,
    status:
      status === "connected" ||
      status === "playing" ||
      status === "reconnecting" ||
      status === "finished"
        ? status
        : "waiting",
    phase:
      phase === "playing" || phase === "revealed" || phase === "finished"
        ? phase
        : "waiting",
    roundIndex: asNumber(item.roundIndex),
    totalRounds: Math.max(1, asNumber(item.totalRounds, 1)),
    roundSeconds: Math.max(10, asNumber(item.roundSeconds, 30)),
    roundDeadline:
      typeof item.roundDeadline === "string" ? item.roundDeadline : null,
    players: [parsePlayer(players[0], 0), parsePlayer(players[1], 1)],
    question: parseQuestion(item.question),
    reveal: parseReveal(item.reveal),
  };
}

function normalizeError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("could not find the function") ||
    lower.includes("does not exist") ||
    lower.includes("schema cache")
  ) {
    return "Fitur ruangan belum aktif di Supabase. Jalankan migrasi eco_init terlebih dahulu, atau gunakan mode satu perangkat.";
  }
  if (lower.includes("room_not_found") || lower.includes("tidak ditemukan")) {
    return "Kode ruangan tidak ditemukan. Periksa kembali kode enam karakter dari temanmu.";
  }
  if (lower.includes("room_full")) {
    return "Ruangan ini sudah terisi dua pemain.";
  }
  return "Koneksi ruangan gagal. Periksa jaringan lalu coba lagi.";
}

export type RoomResult<T> = { data: T; error: null } | { data: null; error: string };

async function callRpc<T>(
  name: string,
  args: Record<string, unknown>,
  pick: (value: unknown) => T | null,
): Promise<RoomResult<T>> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      error:
        "Supabase belum dikonfigurasi. Mode kode ruangan tidak tersedia; duel satu perangkat tetap bisa dimainkan.",
    };
  }
  try {
    const { data, error } = await supabase.rpc(name, args);
    if (error) return { data: null, error: normalizeError(error.message) };
    const parsed = pick(data);
    if (parsed === null) {
      return {
        data: null,
        error: "Server mengirim data ruangan yang tidak dikenali.",
      };
    }
    return { data: parsed, error: null };
  } catch {
    return {
      data: null,
      error: "Tidak dapat menghubungi Supabase. Periksa jaringanmu.",
    };
  }
}

export async function createRoom(input: {
  name: string;
  avatar: string;
  roundSeconds: number;
  maxRounds: number;
}): Promise<RoomResult<RoomJoinResult>> {
  return callRpc(
    "eco_create_room",
    {
      p_name: input.name,
      p_avatar: input.avatar,
      p_round_seconds: input.roundSeconds,
      p_max_rounds: input.maxRounds,
    },
    (value) => {
      if (!value || typeof value !== "object") return null;
      const record = value as Record<string, unknown>;
      const state = normalizeRoomState(record.state);
      if (!state) return null;
      return { slot: 0 as const, state };
    },
  );
}

export async function joinRoom(input: {
  code: string;
  name: string;
  avatar: string;
}): Promise<RoomResult<RoomJoinResult>> {
  return callRpc(
    "eco_join_room",
    {
      p_code: input.code.trim().toUpperCase(),
      p_name: input.name,
      p_avatar: input.avatar,
    },
    (value) => {
      if (!value || typeof value !== "object") return null;
      const record = value as Record<string, unknown>;
      const state = normalizeRoomState(record.state);
      const slot = record.slot === 1 ? 1 : record.slot === 0 ? 0 : null;
      if (!state || slot === null) return null;
      return { slot, state };
    },
  );
}

export async function fetchRoomState(code: string): Promise<RoomResult<RoomState>> {
  return callRpc("eco_room_state", { p_code: code.toUpperCase() }, (value) => {
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    return normalizeRoomState(record.state ?? record);
  });
}

export async function startRoom(code: string, slot: 0 | 1): Promise<RoomResult<RoomState>> {
  return callRpc(
    "eco_start_room",
    { p_code: code.toUpperCase(), p_slot: slot },
    (value) => {
      if (!value || typeof value !== "object") return null;
      return normalizeRoomState((value as Record<string, unknown>).state);
    },
  );
}

export async function submitRoomAnswer(input: {
  code: string;
  slot: 0 | 1;
  option: OptionIndex;
}): Promise<RoomResult<RoomState>> {
  return callRpc(
    "eco_submit_room_answer",
    {
      p_code: input.code.toUpperCase(),
      p_slot: input.slot,
      p_option: input.option,
    },
    (value) => {
      if (!value || typeof value !== "object") return null;
      return normalizeRoomState((value as Record<string, unknown>).state);
    },
  );
}

export async function nextRoomRound(input: {
  code: string;
  slot: 0 | 1;
}): Promise<RoomResult<RoomState>> {
  return callRpc(
    "eco_next_room_round",
    { p_code: input.code.toUpperCase(), p_slot: input.slot },
    (value) => {
      if (!value || typeof value !== "object") return null;
      return normalizeRoomState((value as Record<string, unknown>).state);
    },
  );
}
