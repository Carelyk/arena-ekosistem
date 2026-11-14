const hasWindow = () => typeof window !== "undefined";

export function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): boolean {
  if (!hasWindow()) return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage can be disabled (private mode). Ignoring keeps the game playable.
  }
}

export const STORAGE_KEYS = {
  history: "eco.history.v1",
  badges: "eco.badges.v1",
  questions: "eco.questions.v1",
  audio: "eco.audio.v1",
} as const;

export function createId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
