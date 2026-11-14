"use client";

import { CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";

interface GameTutorialProps {
  gameKey: "duel" | "susun";
  title: string;
  steps: Array<{ title: string; desc: string; emoji: string }>;
  onClose: () => void;
}

export function GameTutorial({ gameKey, title, steps, onClose }: GameTutorialProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const { playSfx } = useAudio();

  function handleClose() {
    playSfx("button-click");
    if (dontShowAgain) {
      try {
        localStorage.setItem(`eco.tutorial.${gameKey}`, "true");
      } catch {}
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4">
      <div className="sticker pop-in max-w-lg w-full rounded-3xl bg-white p-6 sm:p-8 flex flex-col gap-5 shadow-2xl">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-widest text-produsen-deep">
            Panduan Bermain
          </span>
          <h2 className="font-display text-2xl font-semibold text-ink mt-1">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {steps.map((s, idx) => (
            <div key={idx} className="flex items-start gap-3 rounded-2xl border-[3px] border-ink/15 bg-cream/50 p-3.5">
              <span className="text-3xl shrink-0" aria-hidden>{s.emoji}</span>
              <div>
                <h3 className="text-sm font-extrabold text-ink">{s.title}</h3>
                <p className="text-xs font-semibold text-ink-soft mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            id="dont-show"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="h-5 w-5 rounded-lg border-2 border-ink accent-produsen"
          />
          <label htmlFor="dont-show" className="text-xs font-bold text-ink cursor-pointer select-none">
            Jangan tampilkan panduan ini lagi otomatis
          </label>
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="sticker sticker-press min-h-12 w-full flex items-center justify-center gap-2 rounded-2xl bg-sun font-display text-lg font-semibold text-ink"
        >
          <CheckCircle2 className="h-5 w-5" />
          Mengerti, Mulai Permainan!
        </button>
      </div>
    </div>
  );
}
