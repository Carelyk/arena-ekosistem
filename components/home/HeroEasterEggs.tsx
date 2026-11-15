"use client";

import { useEffect, useRef, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";

const SUN_POSITIONS = ["-left-1 -top-4", "right-5 -top-7", "-left-7 top-[38%]", "-right-4 top-[18%]"] as const;
const MUSHROOM_POSITIONS = ["-bottom-4 -right-2", "-bottom-6 left-8", "-right-5 bottom-[28%]", "-left-5 bottom-16"] as const;

function EasterEgg({ kind, emoji, label, positions }: {
  kind: "sun" | "mushroom";
  emoji: string;
  label: string;
  positions: readonly string[];
}) {
  const [position, setPosition] = useState(0);
  const [hits, setHits] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<number | null>(null);
  const { playLearningSound } = useAudio();

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  function escape() {
    playLearningSound(kind === "sun" ? "plant" : "decomposer");
    const nextHits = hits + 1;
    setHits(nextHits);
    setPosition((current) => (current + 1) % positions.length);
    if (nextHits % 3 === 0) {
      setVisible(false);
      timerRef.current = window.setTimeout(() => {
        setVisible(true);
        timerRef.current = null;
      }, 2200);
    }
  }

  if (!visible) return null;

  return (
    <button
      type="button"
      data-no-click-sfx
      onClick={escape}
      aria-label={label}
      title="Coba tangkap aku!"
      className={`hero-easter-egg hero-easter-egg-${kind} absolute z-10 flex items-center justify-center rounded-2xl border-[3px] border-ink text-3xl shadow-[0_5px_0_rgba(46,42,38,0.13)] transition-[top,right,bottom,left,transform] duration-500 hover:scale-110 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-sun-deep ${positions[position]}`}
    >
      <span aria-hidden>{emoji}</span>
    </button>
  );
}

export function HeroEasterEggs() {
  return (
    <>
      <EasterEgg kind="sun" emoji="☀️" label="Easter egg Matahari. Ketuk untuk memindahkannya." positions={SUN_POSITIONS} />
      <EasterEgg kind="mushroom" emoji="🍄" label="Easter egg jamur. Ketuk untuk memindahkannya." positions={MUSHROOM_POSITIONS} />
    </>
  );
}
