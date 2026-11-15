"use client";

import { ArrowRight, CheckCircle2, ChevronDown, Volume2 } from "lucide-react";
import { useId, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { RoleIllustration } from "@/components/learning/RoleIllustration";
import type { OrganismCard as OrganismCardData } from "@/lib/data/learning";
import { LEARNING_SOUND_BY_ORGANISM } from "@/lib/audio/learning-sounds";

export function OrganismCard({ card, learned, onLearned }: {
  card: OrganismCardData;
  learned: boolean;
  onLearned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const detailId = useId();
  const { playLearningSound } = useAudio();

  function handleToggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    playLearningSound(LEARNING_SOUND_BY_ORGANISM[card.id] ?? "plant");
    if (nextOpen && !learned) onLearned();
  }

  return (
    <article className={`sticker flex h-full flex-col overflow-hidden rounded-3xl bg-white transition-transform duration-200 hover:-translate-y-1 ${learned ? "border-2 border-produsen" : ""}`}>
      <div className={`h-3 w-full ${card.colorClass}`} aria-hidden />
      <button data-no-click-sfx type="button" onClick={handleToggle} aria-expanded={open} aria-controls={detailId} className={`flex w-full flex-1 flex-col items-start gap-3 p-5 text-left ${card.softClass}`}>
        <div className="flex w-full items-start justify-between gap-3">
          <div className="role-illustration-shell flex h-[108px] w-[158px] items-center justify-center overflow-hidden rounded-2xl border-2 border-ink/15 bg-white shadow-[0_5px_0_rgba(47,43,38,0.10)]">
            <RoleIllustration role={card.id} />
          </div>
          <div className="flex flex-col items-end gap-1">
            {learned && (
              <span className="inline-flex items-center gap-1 rounded-full border border-produsen bg-produsen-soft px-2.5 py-1 text-[10px] font-extrabold text-produsen-deep">
                <CheckCircle2 className="h-3 w-3" /> Sudah dipelajari
              </span>
            )}
            <ChevronDown aria-hidden className={`h-5 w-5 shrink-0 transition-transform ${card.textClass} ${open ? "rotate-180" : ""}`} />
          </div>
        </div>
        <div>
          <h3 className={`font-display text-xl font-semibold ${card.textClass}`}>{card.name}</h3>
          <p className="text-sm font-bold text-ink-soft">{card.tagline}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">
            <Volume2 className="h-3 w-3" aria-hidden /> Ketuk untuk mendengar
          </p>
        </div>
        <p className="line-clamp-3 text-justify text-sm font-semibold leading-relaxed text-ink/80">{card.summary}</p>
        <span className={`inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide ${card.textClass}`}>
          {open ? "Tutup detail" : "Buka detail"}
          <ArrowRight className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-90" : ""}`} />
        </span>
      </button>
      <div id={detailId} hidden={!open} className="role-detail-panel flex flex-col gap-4 border-t-[3px] border-dashed border-ink/15 bg-white p-5">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">Contoh organisme</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {card.examples.map((example, index) => (
              <li key={example} style={{ animationDelay: `${index * 90}ms` }} className={`role-example-sticker rounded-xl border-2 ${card.borderClass} ${card.softClass} px-3 py-1.5 text-xs font-bold ${card.textClass}`}>{example}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">Fungsi & peran penting</p>
          <ul className="mt-2 flex flex-col gap-2.5">
            {card.facts.map((fact) => (
              <li key={fact} className="flex gap-2.5 text-justify text-sm font-semibold leading-relaxed text-ink/85">
                <span aria-hidden className="mt-0.5 shrink-0 font-extrabold text-produsen-deep">•</span><span>{fact}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}
