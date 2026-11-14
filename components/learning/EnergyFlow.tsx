"use client";

import { ArrowRight, Info } from "lucide-react";
import { useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import {
  DECOMPOSER_NOTE,
  ENERGY_FLOW,
  ENERGY_FLOW_NOTE,
  type EnergyStep,
} from "@/lib/data/learning";

const ROLE_STYLES: Record<EnergyStep["role"], string> = {
  matahari: "bg-sun text-ink border-[#B9820B]",
  produsen: "bg-produsen-soft text-produsen-deep border-produsen",
  konsumen1: "bg-konsumen1-soft text-konsumen1-deep border-konsumen1",
  konsumen2: "bg-konsumen2-soft text-konsumen2-deep border-konsumen2",
  puncak: "bg-puncak-soft text-puncak-deep border-puncak",
  pengurai: "bg-pengurai-soft text-pengurai-deep border-pengurai",
};

export function EnergyFlow() {
  const [activeId, setActiveId] = useState<string>("belalang");
  const { playSfx } = useAudio();
  const active = ENERGY_FLOW.find((step) => step.id === activeId) ?? ENERGY_FLOW[0];

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl border-[3px] border-ink/15 bg-white p-4 sm:p-5">
        <p className="mb-3 text-sm font-bold text-ink-soft">
          Ketuk setiap makhluk hidup untuk melihat perannya.
        </p>
        <ol className="no-scrollbar flex items-stretch gap-2 overflow-x-auto pb-2">
          {ENERGY_FLOW.map((step, index) => {
            const selected = step.id === activeId;
            return (
              <li key={step.id} className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveId(step.id);
                    playSfx("button-click");
                  }}
                  aria-pressed={selected}
                  className={`sticker sticker-press flex min-h-[96px] w-[104px] flex-col items-center justify-center gap-1 rounded-2xl border-[3px] px-2 py-2 text-center ${ROLE_STYLES[step.role]} ${
                    selected ? "ring-4 ring-sun ring-offset-2" : ""
                  }`}
                >
                  <span aria-hidden className="text-3xl leading-none">
                    {step.emoji}
                  </span>
                  <span className="text-sm font-extrabold leading-tight">
                    {step.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide opacity-80">
                    {step.role === "matahari" ? "sumber energi" : step.role}
                  </span>
                </button>
                {index < ENERGY_FLOW.length - 1 && (
                  <ArrowRight
                    aria-hidden
                    className="h-5 w-5 shrink-0 text-ink/60"
                  />
                )}
              </li>
            );
          })}
        </ol>

        <div
          className="mt-2 flex items-start gap-3 rounded-2xl border-2 border-dashed border-ink/20 bg-cream px-4 py-3"
          aria-live="polite"
        >
          <span aria-hidden className="text-3xl leading-none">
            {active.emoji}
          </span>
          <div>
            <p className="font-display text-lg font-semibold text-ink">
              {active.label}
            </p>
            <p className="text-sm font-semibold leading-relaxed text-ink/85">
              {active.note}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border-[3px] border-konsumen2 bg-konsumen2-soft px-4 py-3">
        <Info aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-konsumen2-deep" />
        <p className="text-sm font-semibold leading-relaxed text-konsumen2-deep">
          <strong className="font-extrabold">Arah panah:</strong>{" "}
          {ENERGY_FLOW_NOTE}
        </p>
      </div>

      <div className="rounded-3xl border-[3px] border-pengurai bg-pengurai-soft p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="float-soft text-4xl leading-none">
            🍄
          </span>
          <div>
            <h3 className="font-display text-xl font-semibold text-pengurai-deep">
              Pengurai bekerja dari semua tingkat
            </h3>
            <p className="text-sm font-semibold leading-relaxed text-pengurai-deep/90">
              {DECOMPOSER_NOTE}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Contoh sisa organisme yang diuraikan">
          {[
            "daun gugur",
            "sisa belalang",
            "sisa katak",
            "sisa ular",
            "sisa elang",
          ].map((item) => (
            <span
              key={item}
              className="rounded-lg border-2 border-pengurai bg-white px-2 py-1 text-xs font-bold text-pengurai-deep"
            >
              {item} →
            </span>
          ))}
          <span className="rounded-lg bg-pengurai px-2 py-1 text-xs font-extrabold text-white">
            unsur hara
          </span>
        </div>
      </div>
    </div>
  );
}
