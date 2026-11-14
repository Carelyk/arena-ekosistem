"use client";

import { useEffect, useState } from "react";

/**
 * Epoch milliseconds as reactive state.
 *
 * The initial value is `0`, never `Date.now()`: reading the clock during the
 * first render makes `next build` fail its prerender check (see
 * https://nextjs.org/docs/messages/blocking-prerender-current-time-client).
 * Consumers treat `0` as "clock not ready yet" and show a static value.
 */
export function useNow(intervalMs = 250): number {
  const [now, setNow] = useState(0);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    // Run one tick as soon as possible so the UI stops showing the static
    // placeholder, then keep it fresh on an interval.
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return now;
}
