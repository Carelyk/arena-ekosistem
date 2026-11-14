export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Deterministic shuffle so both drag-and-drop players get equally hard pools. */
export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const copy = [...items];
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;
  const next = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Reading the clock is impure, so the React Compiler rejects `Date.now()`
 * inside a component body even when the call sits in an event handler.
 * Funnelling it through a plain module function keeps the call site clean.
 */
export function nowMs(): number {
  return Date.now();
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatSeconds(ms: number): number {
  return Math.max(0, Math.ceil(ms / 1000));
}
