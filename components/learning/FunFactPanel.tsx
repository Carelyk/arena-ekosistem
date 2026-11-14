"use client";

import { Lightbulb } from "lucide-react";
import { useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { FUN_FACTS } from "@/lib/data/learning";

export function FunFactPanel() {
  const [active, setActive] = useState(0);
  const { playSfx } = useAudio();
  const fact = FUN_FACTS[active];

  return (
    <div className="sticker overflow-hidden rounded-3xl bg-white">
      <div className="flex items-center gap-3 border-b-[3px] border-ink/10 bg-sun px-5 py-4">
        <Lightbulb aria-hidden className="h-6 w-6 text-ink" />
        <h3 className="font-display text-xl font-semibold text-ink">
          Tahukah Kamu?
        </h3>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-[0.9fr_1.1fr]">
        <div role="tablist" aria-label="Fakta ekosistem" className="flex flex-col gap-2">
          {FUN_FACTS.map((item, index) => (
            <button
              key={item.title}
              type="button"
              role="tab"
              aria-selected={index === active}
              onClick={() => {
                setActive(index);
                playSfx("button-click");
              }}
              className={`flex min-h-11 items-center gap-3 rounded-2xl border-[3px] px-3 py-2 text-left text-sm font-extrabold transition-colors ${
                index === active
                  ? "border-ink bg-sun text-ink"
                  : "border-ink/15 bg-cream text-ink-soft hover:text-ink"
              }`}
            >
              <span aria-hidden className="text-xl leading-none">
                {item.emoji}
              </span>
              {item.title}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          aria-live="polite"
          className="rise flex flex-col justify-center rounded-2xl border-[3px] border-dashed border-sun bg-[#FFF8E3] px-5 py-4"
        >
          <span aria-hidden className="text-4xl leading-none">
            {fact.emoji}
          </span>
          <p className="mt-2 font-display text-lg font-semibold text-ink">
            {fact.title}
          </p>
          <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/85">
            {fact.body}
          </p>
        </div>
      </div>
    </div>
  );
}
