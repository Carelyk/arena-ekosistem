"use client";

import { CheckCircle2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { OrganismCard } from "@/components/learning/OrganismCard";
import type { OrganismCard as OrganismCardData } from "@/lib/data/learning";
import { readJson, writeJson } from "@/lib/storage";
import { useSectionInView } from "@/lib/hooks/use-section-in-view";
import { useAudio } from "@/components/audio/AudioProvider";

const LEARNED_KEY = "eco.learned_roles";

export function RoleLearningSection({ cards }: { cards: OrganismCardData[] }) {
  const [learned, setLearned] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const { ref: sectionRef, inView } = useSectionInView<HTMLDivElement>();
  const { stopLearningSound } = useAudio();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = readJson<unknown>(LEARNED_KEY, []);
      const ids = Array.isArray(stored)
        ? stored.filter((id): id is string => typeof id === "string")
        : [];
      setLearned(ids.filter((id) => cards.some((card) => card.id === id)));
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [cards]);

  useEffect(() => {
    if (!inView) stopLearningSound();
  }, [inView, stopLearningSound]);

  function markLearned(id: string) {
    setLearned((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      writeJson(LEARNED_KEY, next);
      return next;
    });
  }

  const complete = ready && learned.length === cards.length;

  return (
    <div ref={sectionRef} className={`flex flex-col gap-4 ${inView ? "learning-section-active" : "learning-section-idle"}`}>
      <div className="rounded-2xl border-2 border-ink/10 bg-white p-3" aria-live="polite">
        <div className="flex items-center justify-between gap-3 text-xs font-extrabold text-ink-soft">
          <span>Progres belajar lima peran</span>
          <span>{ready ? learned.length : 0}/{cards.length} dipelajari</span>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-produsen transition-[width] duration-500" style={{ width: `${(learned.length / cards.length) * 100}%` }} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {cards.map((card, index) => (
          <div key={card.id} className={index < 3 ? "lg:col-span-2" : index === 3 ? "lg:col-span-2 lg:col-start-2" : "lg:col-span-2"}>
            <OrganismCard card={card} learned={learned.includes(card.id)} onLearned={() => markLearned(card.id)} />
          </div>
        ))}
      </div>
      {complete && (
        <div className="role-complete-pop flex items-center gap-3 rounded-2xl border-[3px] border-produsen bg-produsen-soft p-4 text-produsen-deep" role="status">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white" aria-hidden><Sparkles className="h-6 w-6" /></span>
          <div>
            <p className="flex items-center gap-2 font-display text-lg font-semibold"><CheckCircle2 className="h-5 w-5" /> Hebat!</p>
            <p className="text-sm font-bold">Kamu sudah mengenal semua peran dalam rantai makanan.</p>
          </div>
        </div>
      )}
    </div>
  );
}
