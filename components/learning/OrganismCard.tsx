"use client";

import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import type { OrganismCard as OrganismCardData } from "@/lib/data/learning";

export function OrganismCard({ card }: { card: OrganismCardData }) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const { playSfx } = useAudio();

  return (
    <article
      className={`sticker flex flex-col overflow-hidden rounded-3xl bg-white ${open ? "row-span-1" : ""}`}
    >
      <div className={`h-2.5 w-full ${card.colorClass}`} aria-hidden />
      <button
        type="button"
        onClick={() => {
          setOpen((value) => !value);
          playSfx("button-click");
        }}
        aria-expanded={open}
        aria-controls={detailId}
        className={`flex w-full flex-1 flex-col items-start gap-2 px-5 pb-4 pt-4 text-left ${card.softClass}`}
      >
        <span className="flex w-full items-start justify-between gap-3">
          <span aria-hidden className="text-4xl leading-none drop-shadow-sm">
            {card.emoji}
          </span>
          <ChevronDown
            aria-hidden
            className={`mt-1 h-5 w-5 shrink-0 transition-transform ${card.textClass} ${open ? "rotate-180" : ""}`}
          />
        </span>
        <span className={`font-display text-xl font-semibold ${card.textClass}`}>
          {card.name}
        </span>
        <span className="text-sm font-bold text-ink-soft">{card.tagline}</span>
        <span className="mt-1 line-clamp-3 text-sm font-semibold leading-relaxed text-ink/80">
          {card.summary}
        </span>
        <span className={`mt-2 text-xs font-extrabold uppercase tracking-wide ${card.textClass}`}>
          {open ? "Tutup detail" : "Buka detail"}
        </span>
      </button>

      {open && (
        <div
          id={detailId}
          className="rise flex flex-col gap-3 border-t-[3px] border-dashed border-ink/15 bg-white px-5 py-4"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
              Contoh
            </p>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {card.examples.map((example) => (
                <li
                  key={example}
                  className={`rounded-lg border-2 ${card.borderClass} ${card.softClass} px-2 py-1 text-xs font-bold ${card.textClass}`}
                >
                  {example}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
              Fungsi & fakta
            </p>
            <ul className="mt-1.5 flex flex-col gap-2">
              {card.facts.map((fact) => (
                <li
                  key={fact}
                  className="flex gap-2 text-sm font-semibold leading-relaxed text-ink/85"
                >
                  <span aria-hidden className="mt-0.5 shrink-0">
                    •
                  </span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </article>
  );
}
