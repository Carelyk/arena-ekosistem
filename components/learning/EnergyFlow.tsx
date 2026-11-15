"use client";

import { ArrowRight, Info, Pause, Play, RotateCcw, ChevronLeft, ChevronRight, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { useSectionInView } from "@/lib/hooks/use-section-in-view";
import {
  ENERGY_FLOW_NOTE,
} from "@/lib/data/learning";
import { getEcosystem } from "@/lib/data/ecosystems";
import type { ChainStep, EcosystemId } from "@/lib/types";
import { LEARNING_SOUND_BY_ORGANISM } from "@/lib/audio/learning-sounds";

const ROLE_STYLES: Record<ChainStep["role"], string> = {
  produsen: "bg-produsen-soft text-produsen-deep border-produsen",
  konsumen1: "bg-konsumen1-soft text-konsumen1-deep border-konsumen1",
  konsumen2: "bg-konsumen2-soft text-konsumen2-deep border-konsumen2",
  konsumen3: "bg-konsumen2-soft text-konsumen2-deep border-konsumen2",
  puncak: "bg-puncak-soft text-puncak-deep border-puncak",
  pengurai: "bg-pengurai-soft text-pengurai-deep border-pengurai",
};

const MOTION_CLASS: Record<string, string> = {
  rumput: "scene-plant",
  padi: "scene-plant",
  belalang: "scene-hop",
  katak: "scene-frog",
  ular: "scene-snake",
  elang: "scene-eagle",
  daun: "scene-plant",
  ulat: "scene-crawl",
  burung: "scene-hop",
  "elang-hutan": "scene-eagle",
  fitoplankton: "scene-plankton",
  zooplankton: "scene-drift",
  "ikan-kecil": "scene-swim",
  "ikan-besar": "scene-swim",
  hiu: "scene-swim",
};

export function EnergyFlow({ ecosystemId = "sawah" }: { ecosystemId?: EcosystemId }) {
  const ecosystem = getEcosystem(ecosystemId);
  const flow = ecosystem.steps;
  const [activeId, setActiveId] = useState<string>(flow[0].id);
  const [isPlaying, setIsPlaying] = useState(true);
  const [decomposerStep, setDecomposerStep] = useState(0);
  const [decomposerPlaying, setDecomposerPlaying] = useState(true);
  const reducedMotion = useReducedMotion();
  const { playSfx, playLearningSound, stopLearningSound } = useAudio();
  const { ref: sectionRef, inView } = useSectionInView<HTMLDivElement>();

  const activeIndex = flow.findIndex((step) => step.id === activeId);
  const active = flow[activeIndex >= 0 ? activeIndex : 0] ?? flow[0];

  useEffect(() => {
    if (!isPlaying || reducedMotion || !inView) return;
    const timer = window.setInterval(() => {
      setActiveId((current) => {
        const idx = flow.findIndex((s) => s.id === current);
        const nextIdx = (idx + 1) % flow.length;
        const nextId = flow[nextIdx].id;
        playLearningSound(LEARNING_SOUND_BY_ORGANISM[nextId] ?? "plant");
        return nextId;
      });
    }, 2500);
    return () => window.clearInterval(timer);
  }, [isPlaying, reducedMotion, flow, playLearningSound, inView]);

  useEffect(() => {
    if (!decomposerPlaying || reducedMotion || !inView) return;
    const timer = window.setInterval(() => {
      setDecomposerStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => window.clearInterval(timer);
  }, [decomposerPlaying, reducedMotion, inView]);

  useEffect(() => {
    if (!inView) stopLearningSound();
  }, [inView, stopLearningSound]);

  function handlePrev() {
    playSfx("button-click");
    setActiveId((current) => {
      const idx = flow.findIndex((s) => s.id === current);
      const prevIdx = (idx - 1 + flow.length) % flow.length;
      const nextId = flow[prevIdx].id;
      playLearningSound(LEARNING_SOUND_BY_ORGANISM[nextId] ?? "plant");
      return nextId;
    });
  }

  function handleNext() {
    playSfx("button-click");
    setActiveId((current) => {
      const idx = flow.findIndex((s) => s.id === current);
      const nextIdx = (idx + 1) % flow.length;
      const nextId = flow[nextIdx].id;
      playLearningSound(LEARNING_SOUND_BY_ORGANISM[nextId] ?? "plant");
      return nextId;
    });
  }

  return (
    <div ref={sectionRef} className={`flex flex-col gap-6 ${inView ? "learning-section-active" : "learning-section-idle"}`}>
      <div className="rounded-3xl border-[3px] border-ink/15 bg-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <p className="text-sm font-bold text-ink-soft">
            Ketuk setiap makhluk hidup atau gunakan kontrol untuk menelusuri aliran energi.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrev}
              className="sticker sticker-press inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink/20 bg-cream text-ink"
              aria-label="Tahap sebelumnya"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsPlaying((p) => !p);
                playSfx("button-click");
                playLearningSound(LEARNING_SOUND_BY_ORGANISM[activeId] ?? "plant");
              }}
              disabled={reducedMotion}
              className="sticker sticker-press inline-flex min-h-10 items-center gap-1.5 rounded-xl border-[3px] border-ink/20 bg-sun px-3.5 py-1.5 text-xs font-extrabold text-ink disabled:opacity-50"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isPlaying ? "Jeda" : "Putar"}
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="sticker sticker-press inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink/20 bg-cream text-ink"
              aria-label="Tahap berikutnya"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveId(flow[0].id);
                setIsPlaying(!reducedMotion);
                playSfx("button-click");
              }}
              className="sticker sticker-press inline-flex h-10 w-10 items-center justify-center rounded-xl border-2 border-ink/20 bg-cream text-ink"
              aria-label="Ulangi"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <ol className="no-scrollbar flex items-stretch gap-3 overflow-x-auto pb-3">
          {flow.map((step, index) => {
            const selected = step.id === activeId;
            return (
              <li key={step.id} className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(step.id);
                    setIsPlaying(false);
                    playLearningSound(LEARNING_SOUND_BY_ORGANISM[step.id] ?? "plant");
                  }}
                  data-no-click-sfx
                  aria-pressed={selected}
                  className={`sticker sticker-press flex min-h-[104px] w-[112px] flex-col items-center justify-center gap-1.5 rounded-2xl border-[3px] px-2.5 py-3 text-center transition-all ${
                    ROLE_STYLES[step.role]
                  } ${
                    selected ? "ring-4 ring-sun ring-offset-2 scale-105 shadow-md" : "hover:scale-[1.02]"
                  }`}
                >
                  <span aria-hidden className={`text-3xl leading-none ${selected && !reducedMotion ? MOTION_CLASS[step.id] ?? "scene-drift" : ""}`}>
                    {step.emoji}
                  </span>
                  <span className="font-display text-sm font-extrabold leading-tight">
                    {step.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                    {step.role}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold opacity-75"><Volume2 className="h-3 w-3" aria-hidden /> Dengar</span>
                </button>
                {index < flow.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className={`h-6 w-6 shrink-0 transition-colors ${selected ? "text-sun-deep animate-pulse" : "text-ink/30"}`}
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div
          className="mt-4 flex items-start gap-3.5 rounded-2xl border-2 border-dashed border-ink/20 bg-cream p-4"
          aria-live="polite"
        >
          <span aria-hidden className="text-4xl leading-none shrink-0">
            {active.emoji}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-semibold text-ink">
                {active.label}
              </span>
              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-ink/15 text-ink-soft">
                {active.role}
              </span>
            </div>
            <p className="text-justify text-sm font-semibold leading-relaxed text-ink/85">
              {active.note}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3.5 rounded-2xl border-[3px] border-konsumen2 bg-konsumen2-soft p-4 sm:p-5">
        <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-konsumen2-deep" />
        <p className="text-justify text-sm font-semibold leading-relaxed text-konsumen2-deep">
          <strong className="font-extrabold">Arah panah:</strong>{" "}
          {ENERGY_FLOW_NOTE}
        </p>
      </div>

      <div className="rounded-3xl border-[3px] border-pengurai bg-pengurai-soft p-5 sm:p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span aria-hidden className={`text-4xl leading-none ${!reducedMotion ? "scene-drift" : ""}`}>
              🍄
            </span>
            <div>
              <h3 className="font-display text-xl font-semibold text-pengurai-deep">
                Simulasi Siklus Pengurai & Daur Ulang
              </h3>
              <p className="mt-0.5 text-justify text-xs font-semibold text-pengurai-deep/90">
                Energi mengalir melalui rantai makanan, sedangkan unsur hara didaur ulang kembali ke lingkungan.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setDecomposerPlaying((value) => !value); playSfx("button-click"); }}
              disabled={reducedMotion}
              className="sticker sticker-press inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[3px] border-pengurai bg-white px-4 py-2 text-xs font-extrabold text-pengurai-deep disabled:opacity-50"
            >
              {decomposerPlaying && !reducedMotion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {decomposerPlaying && !reducedMotion ? "Jeda" : "Putar"}
            </button>
            <button
              type="button"
              onClick={() => { setDecomposerStep(0); setDecomposerPlaying(!reducedMotion); playSfx("button-click"); }}
              className="sticker sticker-press inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[3px] border-pengurai bg-white px-4 py-2 text-xs font-extrabold text-pengurai-deep"
            >
              <RotateCcw className="h-4 w-4" /> Ulangi
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { step: 0, title: "1. Daun Gugur", desc: "Sisa organisme & tumbuhan jatuh ke tanah.", emoji: "🍂" },
            { step: 1, title: "2. Kerja Pengurai", desc: "Jamur & bakteri menguraikan bahan organik.", emoji: "🍄" },
            { step: 2, title: "3. Unsur Hara", desc: "Zat hara larut ke dalam tanah.", emoji: "🌱" },
            { step: 3, title: "4. Rumput Tumbuh", desc: "Produsen memanfaatkan hara untuk tumbuh.", emoji: "🌿" },
          ].map((item) => {
            const active = decomposerStep === item.step;
            return (
              <div
                key={item.step}
                className={`flex flex-col gap-1.5 rounded-2xl border-2 p-3.5 transition-all ${
                  active
                    ? "border-pengurai bg-white shadow-md scale-[1.02]"
                    : "border-pengurai/30 bg-white/60 opacity-75"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl" aria-hidden>{item.emoji}</span>
                  <span className={`text-[10px] font-extrabold rounded-full px-2 py-0.5 ${active ? "bg-pengurai text-white" : "bg-cream text-ink-soft"}`}>
                    Tahap {item.step + 1}
                  </span>
                </div>
                <h4 className="font-display text-sm font-semibold text-pengurai-deep">{item.title}</h4>
                <p className="text-justify text-xs font-semibold leading-snug text-ink/80">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div aria-live="polite" className="mt-4 flex items-center justify-center rounded-xl bg-white/80 p-3 border-2 border-pengurai/20">
          <p className="text-center text-xs font-extrabold text-pengurai-deep">
            {decomposerStep === 0 && "Daun gugur dan sisa organisme menumpuk di permukaan tanah."}
            {decomposerStep === 1 && "Jamur dan bakteri aktif bekerja menguraikan sisa tersebut menjadi bagian kecil."}
            {decomposerStep === 2 && "Sisa berubah menjadi zat hara / mineral penting di dalam tanah."}
            {decomposerStep === 3 && "Rumput menyerap unsur hara tersebut dan tumbuh subur kembali!"}
          </p>
        </div>
      </div>
    </div>
  );
}
