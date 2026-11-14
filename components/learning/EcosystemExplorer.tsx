"use client";

import { ArrowRight, ChevronRight, Pause, Play, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { ECOSYSTEMS } from "@/lib/data/ecosystems";
import type { EcosystemId } from "@/lib/types";

const SCENE_CLASS: Record<string, string> = {
  padi: "scene-plant", belalang: "scene-hop", katak: "scene-frog", ular: "scene-snake", elang: "scene-eagle",
  daun: "scene-plant", ulat: "scene-crawl", burung: "scene-hop", "elang-hutan": "scene-eagle",
  fitoplankton: "scene-plankton", zooplankton: "scene-drift", "ikan-kecil": "scene-swim", "ikan-besar": "scene-swim", hiu: "scene-swim",
};

interface EcosystemExplorerProps {
  activeEcosystem?: EcosystemId;
  onEcosystemChange?: (id: EcosystemId) => void;
}

function EcosystemBackdrop({ ecosystem }: { ecosystem: EcosystemId }) {
  return (
    <div className={`eco-backdrop eco-backdrop-${ecosystem}`} aria-hidden>
      {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
    </div>
  );
}

export function EcosystemExplorer({ activeEcosystem, onEcosystemChange }: EcosystemExplorerProps = {}) {
  const [internalTab, setInternalTab] = useState<EcosystemId>("sawah");
  const activeTab = activeEcosystem ?? internalTab;
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const reducedMotion = useReducedMotion();
  const { playSfx } = useAudio();
  const currentEco = ECOSYSTEMS.find((eco) => eco.id === activeTab) ?? ECOSYSTEMS[0];

  function selectTab(id: EcosystemId) {
    setInternalTab(id);
    onEcosystemChange?.(id);
    setActiveStepIndex(0);
    setSelectedIndex(null);
    setIsPlaying(!reducedMotion);
    playSfx("button-click");
  }

  function handleTabKeys(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" ? 1 : -1;
    const next = (index + delta + ECOSYSTEMS.length) % ECOSYSTEMS.length;
    selectTab(ECOSYSTEMS[next].id);
    tabRefs.current[next]?.focus();
  }

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;
    const timer = window.setInterval(() => {
      setActiveStepIndex((previous) => (previous + 1) % currentEco.steps.length);
    }, 2200);
    return () => window.clearInterval(timer);
  }, [isPlaying, reducedMotion, currentEco.steps.length]);

  const selected = selectedIndex === null ? null : currentEco.steps[selectedIndex];
  const selectedFood = selectedIndex === 0
    ? "Membuat makanan sendiri melalui fotosintesis"
    : selectedIndex === null ? "" : currentEco.steps[selectedIndex - 1].label;
  const selectedPredator = selectedIndex === null
    ? ""
    : selectedIndex === currentEco.steps.length - 1
      ? "Tidak ada pada contoh rantai ini"
      : currentEco.steps[selectedIndex + 1].label;

  return (
    <div className="flex flex-col gap-6 rounded-3xl border-[3px] border-ink/15 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-extrabold uppercase tracking-widest text-produsen-deep">Jelajahi ekosistem</p>
        <h2 id="ekosistem-heading" className="font-display text-3xl font-semibold text-ink sm:text-4xl">Jelajahi Rantai Makanan di Berbagai Ekosistem</h2>
        <p className="max-w-2xl text-sm font-semibold leading-relaxed text-ink-soft">Setiap ekosistem memiliki makhluk hidup yang berbeda, tetapi energi tetap berpindah dari produsen menuju konsumen.</p>
      </div>

      <div className="flex flex-wrap gap-2 border-b-[3px] border-ink/10 pb-4" role="tablist" aria-label="Pilih ekosistem">
        {ECOSYSTEMS.map((eco, index) => {
          const active = eco.id === activeTab;
          return (
            <button
              key={eco.id}
              ref={(node) => { tabRefs.current[index] = node; }}
              id={`eco-tab-${eco.id}`}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`eco-panel-${eco.id}`}
              tabIndex={active ? 0 : -1}
              onKeyDown={(event) => handleTabKeys(event, index)}
              onClick={() => selectTab(eco.id)}
              className={`sticker sticker-press flex min-h-12 items-center gap-2.5 rounded-2xl border-[3px] px-5 py-2.5 font-display text-base font-semibold ${active ? "border-ink bg-sun text-ink" : "border-ink/15 bg-cream text-ink-soft"}`}
            >
              <span className="text-2xl" aria-hidden>{eco.emoji}</span> Ekosistem {eco.name}
            </button>
          );
        })}
      </div>

      <div
        id={`eco-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`eco-tab-${activeTab}`}
        className={`relative overflow-hidden rounded-3xl border-[3px] p-5 transition-colors sm:p-6 ${activeTab === "sawah" ? "border-produsen bg-gradient-to-b from-[#DDF2FF] to-[#EAF5D8]" : activeTab === "hutan" ? "border-[#2F7A45] bg-gradient-to-b from-[#DDF0D9] to-[#A8D7AE]" : "border-konsumen2 bg-gradient-to-b from-[#D8F5FF] to-[#87CAE9]"}`}
      >
        <EcosystemBackdrop ecosystem={activeTab} />
        {activeTab === "laut" && <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden><span className="absolute left-[12%] top-8 text-xl scene-drift">○</span><span className="absolute left-[62%] top-16 text-2xl scene-drift">○</span><span className="absolute right-[8%] top-6 text-lg scene-drift">○</span></div>}
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink/15 bg-white px-3 py-1 text-xs font-extrabold"><Sparkles className="h-3.5 w-3.5 text-sun-deep" />{currentEco.name}</span>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-ink/85">{currentEco.summary}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => { setIsPlaying((value) => !value); playSfx("button-click"); }} disabled={reducedMotion} className="sticker sticker-press inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[3px] border-ink/20 bg-white px-3.5 py-2 text-xs font-extrabold disabled:opacity-50">
              {isPlaying && !reducedMotion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}{isPlaying && !reducedMotion ? "Jeda" : "Putar"}
            </button>
            <button type="button" onClick={() => { setActiveStepIndex(0); setIsPlaying(!reducedMotion); playSfx("button-click"); }} className="sticker sticker-press inline-flex min-h-11 items-center gap-1.5 rounded-xl border-[3px] border-ink/20 bg-white px-3.5 py-2 text-xs font-extrabold"><RotateCcw className="h-4 w-4" />Ulangi</button>
          </div>
        </div>

        <ol className="relative mt-7 flex flex-wrap items-center gap-3" aria-live="polite">
          {currentEco.steps.map((step, index) => {
            const active = index === activeStepIndex;
            return (
              <li key={step.id} className="flex items-center gap-3">
                <button type="button" onClick={() => { setSelectedIndex(index); setActiveStepIndex(index); setIsPlaying(false); playSfx("button-click"); }} aria-pressed={selectedIndex === index} className={`sticker sticker-press flex min-w-[106px] flex-col items-center gap-1.5 rounded-2xl border-[3px] bg-white p-3 text-center transition-transform ${active ? "scale-105 border-ink ring-4 ring-sun/70" : "border-ink/20"}`}>
                  <span className={`text-4xl ${!reducedMotion ? SCENE_CLASS[step.id] ?? "scene-drift" : ""}`} aria-hidden>{step.emoji}</span>
                  <span className="font-display text-xs font-semibold text-ink">{step.label}</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">{step.role}</span>
                </button>
                {index < currentEco.steps.length - 1 && <span className="relative flex h-6 w-8 items-center" aria-hidden><ArrowRight className="h-5 w-5 text-ink/45" /><span className={`ecosystem-energy-pulse absolute bottom-0 left-0 h-1 w-full rounded-full bg-sun ${active && !reducedMotion ? "" : "hidden"}`} /></span>}
              </li>
            );
          })}
        </ol>

        {selected && (
          <div className="rise mt-5 grid gap-3 rounded-2xl border-2 border-ink/20 bg-white p-4 sm:grid-cols-3">
            <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">Makhluk hidup & peran</p><p className="mt-1 font-display font-semibold text-ink">{selected.emoji} {selected.label}</p><p className="text-xs font-bold text-ink-soft">{selected.role}</p></div>
            <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">Makanan</p><p className="mt-1 text-sm font-bold text-ink">{selectedFood}</p></div>
            <div><p className="text-[10px] font-extrabold uppercase tracking-wide text-ink-soft">Pemangsa</p><p className="mt-1 text-sm font-bold text-ink">{selectedPredator}</p></div>
            <p className="sm:col-span-3 text-sm font-semibold text-ink/80">{selected.note}</p>
          </div>
        )}

        <div className="mt-5 rounded-2xl border-2 border-dashed border-ink/20 bg-white/80 p-4">
          <div className="flex items-center gap-2"><span className="text-2xl" aria-hidden>{currentEco.decomposer.emoji}</span><h3 className="font-display text-sm font-semibold">Pengurai bekerja pada semua tingkat</h3></div>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-ink/85">{currentEco.decomposerNote}</p>
        </div>
        <div className="mt-6 flex justify-end"><Link href={`/games/susun-cepat?ekosistem=${activeTab}`} className="sticker sticker-press inline-flex min-h-12 items-center gap-2 rounded-2xl bg-sun px-5 py-3 font-display text-base font-semibold text-ink"><span>Coba Susun Rantai Ini</span><ChevronRight className="h-5 w-5" /></Link></div>
      </div>
    </div>
  );
}
