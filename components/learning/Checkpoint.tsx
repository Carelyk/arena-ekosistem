"use client";

import Link from "next/link";
import { CheckCircle2, RotateCcw, XCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import { CHECKPOINT_QUESTIONS } from "@/lib/data/learning";

export function Checkpoint() {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [done, setDone] = useState(false);
  const { playSfx } = useAudio();

  const question = CHECKPOINT_QUESTIONS[index];
  const isCorrect = selected === question.correctIndex;

  function choose(optionIndex: number) {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnswered((value) => value + 1);
    if (optionIndex === question.correctIndex) {
      setScore((value) => value + 1);
      playSfx("correct");
    } else {
      playSfx("wrong");
    }
  }

  function next() {
    playSfx("button-click");
    if (index + 1 >= CHECKPOINT_QUESTIONS.length) {
      setDone(true);
      return;
    }
    setIndex((value) => value + 1);
    setSelected(null);
  }

  function restart() {
    playSfx("button-click");
    setIndex(0);
    setSelected(null);
    setScore(0);
    setAnswered(0);
    setDone(false);
  }

  if (done) {
    return (
      <div className="sticker rounded-3xl bg-[#E4F3E2] p-6 text-center sm:p-8">
        <p aria-hidden className="text-5xl leading-none">
          {score === CHECKPOINT_QUESTIONS.length ? "🏆" : "🌱"}
        </p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-produsen-deep">
          Checkpoint selesai!
        </h3>
        <p className="mt-1 text-lg font-extrabold text-ink" aria-live="polite">
          Skor kamu {score} dari {CHECKPOINT_QUESTIONS.length}.
        </p>
        <p className="mx-auto mt-2 max-w-md text-justify text-sm font-semibold text-ink/80">
          {score === CHECKPOINT_QUESTIONS.length
            ? "Hebat! Kamu memahami rantai makanan, aliran energi, dan peran pengurai."
            : "Tidak apa-apa. Buka kembali kartu materi atau panel aliran energi, lalu coba lagi."}
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={restart}
            className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-extrabold text-ink"
          >
            <RotateCcw aria-hidden className="h-4 w-4" />
            Coba lagi
          </button>
          <Link
            href="/games"
            className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink"
          >
            Lanjut ke Arena
            <ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sticker rounded-3xl bg-white p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-extrabold text-ink-soft">
          Pertanyaan {index + 1} dari {CHECKPOINT_QUESTIONS.length}
        </p>
        <div className="flex items-center gap-1" aria-hidden>
          {CHECKPOINT_QUESTIONS.map((item, itemIndex) => (
            <span
              key={item.id}
              className={`h-2.5 w-7 rounded-full ${
                itemIndex < answered
                  ? "bg-produsen"
                  : itemIndex === index
                    ? "bg-sun"
                    : "bg-ink/15"
              }`}
            />
          ))}
        </div>
      </div>

      <p className="font-display text-xl font-semibold leading-snug text-ink">
        {question.text}
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((option, optionIndex) => {
          const chosen = selected === optionIndex;
          const revealCorrect = selected !== null && optionIndex === question.correctIndex;
          const revealWrong = chosen && selected !== question.correctIndex;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(optionIndex)}
              disabled={selected !== null}
              className={`flex min-h-12 items-center gap-3 rounded-2xl border-[3px] px-3 py-2 text-left text-sm font-bold transition-colors ${
                revealCorrect
                  ? "border-[#2F7A45] bg-produsen-soft text-produsen-deep"
                  : revealWrong
                    ? "border-[#B4567A] bg-pengurai-soft text-pengurai-deep"
                    : "border-ink/20 bg-cream text-ink hover:border-ink/40"
              } disabled:cursor-default`}
            >
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 border-current text-xs font-extrabold"
              >
                {String.fromCharCode(65 + optionIndex)}
              </span>
              <span className="flex-1">{option}</span>
              {revealCorrect && (
                <span className="flex items-center gap-1 text-xs font-extrabold">
                  <CheckCircle2 aria-hidden className="h-4 w-4" /> Benar
                </span>
              )}
              {revealWrong && (
                <span className="flex items-center gap-1 text-xs font-extrabold">
                  <XCircle aria-hidden className="h-4 w-4" /> Salah
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="mt-3 min-h-6">
        {selected !== null && (
          <p
            className={`rounded-xl px-3 py-2 text-justify text-sm font-semibold ${
              isCorrect
                ? "bg-produsen-soft text-produsen-deep"
                : "bg-pengurai-soft text-pengurai-deep"
            }`}
          >
            {isCorrect ? "Tepat! " : "Belum tepat. "}
            {question.explanation}
          </p>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={next}
          disabled={selected === null}
          className="sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink disabled:opacity-40"
        >
          {index + 1 >= CHECKPOINT_QUESTIONS.length ? "Lihat hasil" : "Pertanyaan berikutnya"}
          <ArrowRight aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
