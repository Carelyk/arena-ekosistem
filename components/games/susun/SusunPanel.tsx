"use client";

import { GripVertical, Snowflake, Undo2, CheckCircle2 } from "lucide-react";
import { useCallback, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { useAudio } from "@/components/audio/AudioProvider";
import {
  DECOMPOSER_SLOT,
  SUSUN_FREEZE_MS,
  allSlotsFilled,
  cardById,
  filledCount,
  isPlaced,
  stepSlotId,
  totalPositions,
  type SusunBoard,
} from "@/lib/game/susun";
import type { EcosystemChain } from "@/lib/types";

const SIDE_STYLES = [
  {
    panel: "border-duel-green bg-duel-green-soft",
    header: "bg-duel-green text-white",
    zone: "border-duel-green/40 bg-[#F2FBF4]",
    card: "border-duel-green bg-white text-duel-green-deep",
    button: "bg-duel-green text-white",
  },
  {
    panel: "border-duel-orange bg-duel-orange-soft",
    header: "bg-duel-orange text-white",
    zone: "border-duel-orange/40 bg-[#FFF6F0]",
    card: "border-duel-orange bg-white text-duel-orange-deep",
    button: "bg-duel-orange text-white",
  },
] as const;

interface DragState {
  cardId: string;
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
}

interface SusunPanelProps {
  playerIndex: 0 | 1;
  name: string;
  avatar: string;
  chain: EcosystemChain;
  board: SusunBoard;
  frozenMs: number;
  disabled: boolean;
  shake: boolean;
  celebrate: boolean;
  score: number;
  onPlace: (cardId: string, slotId: string) => void;
  onSelect: (cardId: string) => void;
  onReturn: (cardId: string) => void;
  onSubmit: () => void;
  onStatus: (message: string) => void;
}

export function SusunPanel({
  playerIndex,
  name,
  avatar,
  chain,
  board,
  frozenMs,
  disabled,
  shake,
  celebrate,
  score,
  onPlace,
  onSelect,
  onReturn,
  onSubmit,
  onStatus,
}: SusunPanelProps) {
  const styles = SIDE_STYLES[playerIndex];
  const { playSfx } = useAudio();
  const [drag, setDrag] = useState<DragState | null>(null);
  const [hoverSlot, setHoverSlot] = useState<string | null>(null);
  const dragRef = useRef<{
    cardId: string;
    pointerId: number;
    startX: number;
    startY: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    moved: boolean;
  } | null>(null);
  const hoverRef = useRef<string | null>(null);
  const justDraggedRef = useRef(false);

  const frozen = frozenMs > 0;
  const selected = board.selectedCardId;
  const slots = [
    ...chain.steps.map((step, index) => ({ id: stepSlotId(index), index, step })),
  ];
  const poolCards = board.cards.filter((card) => !isPlaced(board, card.id));

  const resolveSlot = useCallback(
    (clientX: number, clientY: number): string | null => {
      const element = document.elementFromPoint(clientX, clientY);
      const slot = element?.closest<HTMLElement>("[data-susun-slot]");
      if (!slot) return null;
      if (Number(slot.dataset.susunPlayer) !== playerIndex) return null;
      return slot.dataset.susunSlot ?? null;
    },
    [playerIndex],
  );

  function updateHover(slotId: string | null) {
    if (hoverRef.current === slotId) return;
    hoverRef.current = slotId;
    setHoverSlot(slotId);
  }

  function handlePointerDown(
    event: ReactPointerEvent<HTMLElement>,
    cardId: string,
  ) {
    if (disabled) return;
    const card = event.currentTarget;
    const rect = card.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      cardId,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
      moved: false,
    };
    justDraggedRef.current = false;
    playSfx("card-pickup");
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLElement>) {
    const state = dragRef.current;
    if (!state || state.pointerId !== event.pointerId || disabled) return;
    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;
    if (!state.moved && Math.hypot(dx, dy) < 6) return;

    if (!state.moved) {
      state.moved = true;
      onSelect(state.cardId);
    }

    event.preventDefault();
    setDrag({
      cardId: state.cardId,
      x: event.clientX,
      y: event.clientY,
      offsetX: state.offsetX,
      offsetY: state.offsetY,
      width: state.width,
      height: state.height,
    });
    updateHover(resolveSlot(event.clientX, event.clientY));
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLElement>) {
    const state = dragRef.current;
    if (!state) return;
    const slotId = state.moved ? resolveSlot(event.clientX, event.clientY) : null;

    if (state.moved) {
      justDraggedRef.current = true;
      if (slotId) {
        onPlace(state.cardId, slotId);
        playSfx("card-drop");
        onStatus(`${name} meletakkan kartu ke posisi ${slotId.startsWith("step-") ? Number(slotId.split("-")[1]) + 1 : "pengurai"}.`);
      } else {
        playSfx("card-return");
        onStatus("Kartu kembali ke posisi semula.");
      }
    }

    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // Some browsers already released capture.
    }
    dragRef.current = null;
    setDrag(null);
    updateHover(null);
    if (state.moved) {
      window.setTimeout(() => {
        justDraggedRef.current = false;
      }, 0);
    }
  }

  function handleCardClick(cardId: string) {
    if (justDraggedRef.current) return;
    if (disabled) return;
    onSelect(cardId);
  }

  function handleSlotClick(slotId: string) {
    if (disabled) return;
    if (selected) {
      onPlace(selected, slotId);
      playSfx("card-drop");
    }
  }

  const dragCard = drag ? cardById(board, drag.cardId) : null;
  const placedCard = (slotId: string) => cardById(board, board.slots[slotId]);
  const selectedPlaced = selected ? isPlaced(board, selected) : false;

  return (
    <section
      aria-label={`Area permainan ${name}`}
      className={`relative flex flex-col overflow-hidden rounded-3xl border-[3px] ${styles.panel} ${
        shake ? "shake" : ""
      } ${board.finishMs !== null ? "glow-correct" : ""}`}
    >
      <header className={`flex items-center gap-3 px-4 py-3 ${styles.header}`}>
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-white/70 bg-white/20 text-2xl"
        >
          {avatar}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-semibold leading-tight">
            {name}
          </p>
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/85">
            {chain.name} · {filledCount(board)}/{totalPositions(chain)} slot terisi
          </p>
        </div>
        <p className="shrink-0 rounded-xl border-2 border-white/60 bg-white/15 px-2.5 py-1 font-display text-lg font-semibold tabular-nums">
          {score}
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <div
          className={`rounded-2xl border-2 border-dashed p-2 ${styles.zone}`}
          onClick={() => {
            if (selected && selectedPlaced) {
              onReturn(selected);
              playSfx("card-return");
              onStatus(`${name} mengembalikan kartu ke pool.`);
            }
          }}
        >
          <p className="mb-1.5 flex items-center justify-between gap-2 px-1 text-[11px] font-extrabold uppercase tracking-wide text-ink-soft">
            <span>Kartu di pool ({poolCards.length})</span>
            {selectedPlaced && (
              <span className="text-[10px] normal-case tracking-normal text-ink/60">
                Ketuk area ini untuk mengembalikan
              </span>
            )}
          </p>
          {poolCards.length === 0 ? (
            <p className="rounded-xl bg-white/70 px-2 py-3 text-center text-xs font-bold text-ink-soft">
              Semua kartu sudah ditempatkan.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {poolCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  data-no-click-sfx
                  disabled={disabled}
                  onPointerDown={(event) => handlePointerDown(event, card.id)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCardClick(card.id);
                  }}
                  aria-pressed={selected === card.id}
                  className={`sticker sticker-press flex min-h-[64px] touch-none select-none items-center gap-2 rounded-xl border-[3px] px-2 py-1.5 text-left disabled:opacity-50 ${styles.card} ${
                    selected === card.id ? "ring-4 ring-sun ring-offset-2" : ""
                  } ${drag?.cardId === card.id ? "opacity-30" : ""}`}
                >
                  <GripVertical aria-hidden className="h-4 w-4 shrink-0 opacity-40" />
                  <span aria-hidden className="text-2xl leading-none">
                    {card.emoji}
                  </span>
                  <span className="min-w-0 flex-1 text-xs font-extrabold leading-tight">
                    {card.label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {slots.map((slot) => {
            const card = placedCard(slot.id);
            const active = hoverSlot === slot.id;
            return (
              <div key={slot.id} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-ink/25 bg-white text-xs font-extrabold text-ink-soft"
                >
                  {slot.index + 1}
                </span>
                <button
                  type="button"
                  data-no-click-sfx
                  data-susun-slot={slot.id}
                  data-susun-player={playerIndex}
                  disabled={disabled}
                  onClick={() => handleSlotClick(slot.id)}
                  className={`flex min-h-[56px] flex-1 items-center gap-2 rounded-xl border-[3px] border-dashed px-2 py-1.5 text-left transition-colors ${
                    active
                      ? "border-sun bg-[#FFF3CC] ring-4 ring-sun/50"
                      : card
                        ? "border-ink/25 bg-white"
                        : "border-ink/20 bg-white/60"
                  } disabled:opacity-70`}
                >
                  {card ? (
                    <div
                      onPointerDown={(event) => handlePointerDown(event, card.id)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onPointerCancel={handlePointerUp}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleCardClick(card.id);
                      }}
                      className={`flex w-full touch-none select-none items-center gap-2 rounded-lg px-1 py-1 ${
                        selected === card.id ? "ring-2 ring-sun" : ""
                      } ${drag?.cardId === card.id ? "opacity-30" : ""}`}
                    >
                      <GripVertical aria-hidden className="h-4 w-4 shrink-0 opacity-40" />
                      <span aria-hidden className="text-2xl leading-none">
                        {card.emoji}
                      </span>
                      <span className="flex-1 text-xs font-extrabold text-ink">
                        {card.label}
                      </span>
                    </div>
                  ) : (
                    <span className="px-1 text-xs font-bold text-ink/45">
                      Letakkan kartu di sini
                    </span>
                  )}
                </button>
              </div>
            );
          })}

          <div className="mt-1 rounded-xl border-[3px] border-dashed border-pengurai bg-pengurai-soft/70 p-2">
            <p className="mb-1 px-1 text-[11px] font-extrabold uppercase tracking-wide text-pengurai-deep">
              Pengurai · sisa semua tingkat
            </p>
            <button
              type="button"
              data-no-click-sfx
              data-susun-slot={DECOMPOSER_SLOT}
              data-susun-player={playerIndex}
              disabled={disabled}
              onClick={() => handleSlotClick(DECOMPOSER_SLOT)}
              className={`flex min-h-[52px] w-full items-center gap-2 rounded-lg border-2 border-dashed px-2 py-1 text-left ${
                hoverSlot === DECOMPOSER_SLOT
                  ? "border-sun bg-[#FFF3CC] ring-4 ring-sun/50"
                  : placedCard(DECOMPOSER_SLOT)
                    ? "border-pengurai bg-white"
                    : "border-pengurai/60 bg-white/60"
              } disabled:opacity-70`}
            >
              {placedCard(DECOMPOSER_SLOT) ? (
                <div
                  onPointerDown={(event) =>
                    handlePointerDown(event, placedCard(DECOMPOSER_SLOT)!.id)
                  }
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCardClick(placedCard(DECOMPOSER_SLOT)!.id);
                  }}
                  className={`flex w-full touch-none select-none items-center gap-2 rounded-lg px-1 py-1 ${
                    selected === placedCard(DECOMPOSER_SLOT)?.id ? "ring-2 ring-sun" : ""
                  } ${drag?.cardId === placedCard(DECOMPOSER_SLOT)?.id ? "opacity-30" : ""}`}
                >
                  <span aria-hidden className="text-2xl leading-none">
                    {placedCard(DECOMPOSER_SLOT)?.emoji}
                  </span>
                  <span className="flex-1 text-xs font-extrabold text-ink">
                    {placedCard(DECOMPOSER_SLOT)?.label}
                  </span>
                </div>
              ) : (
                <span className="px-1 text-xs font-bold text-pengurai-deep/70">
                  Letakkan kartu pengurai di sini
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-extrabold text-ink-soft">
              {board.bestCorrect > 0
                ? `Posisi benar terbaik: ${board.bestCorrect}/${totalPositions(chain)}`
                : "Belum ada jawaban dikunci."}
            </p>
            <button
              type="button"
              onClick={() => {
                if (selected && selectedPlaced) {
                  onReturn(selected);
                  playSfx("card-return");
                }
              }}
              disabled={disabled || !selectedPlaced}
              className="flex min-h-10 items-center gap-1.5 rounded-lg border-2 border-ink/20 bg-white px-2 py-1 text-[11px] font-extrabold text-ink disabled:opacity-40"
            >
              <Undo2 aria-hidden className="h-3.5 w-3.5" />
              Kembalikan ke pool
            </button>
          </div>

          <button
            type="button"
            onClick={onSubmit}
            disabled={disabled || !allSlotsFilled(board)}
            className={`sticker sticker-press flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold ${styles.button} disabled:opacity-50`}
          >
            <CheckCircle2 aria-hidden className="h-4 w-4" />
            {board.finishMs !== null
              ? `Selesai dalam ${(board.finishMs / 1000).toFixed(1)} detik`
              : "Kunci jawaban"}
          </button>

          <div aria-live="polite" className="min-h-8">
            {frozen && (
              <p className="flex items-center gap-2 rounded-lg border-2 border-[#5B9BD5] bg-white px-2 py-1.5 text-[11px] font-extrabold text-[#1F4F78]">
                <Snowflake aria-hidden className="h-4 w-4" />
                Jawaban salah. Area dibekukan{" "}
                {Math.ceil(Math.min(SUSUN_FREEZE_MS, frozenMs) / 1000)} detik.
              </p>
            )}
            {!frozen && board.finishMs !== null && (
              <p className="flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5 text-[11px] font-extrabold text-duel-green-deep">
                <CheckCircle2 aria-hidden className="h-4 w-4" />
                Susunan lengkap dan benar!
              </p>
            )}
          </div>
        </div>
      </div>

      {celebrate && (
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 16 }).map((_, index) => (
            <span
              key={index}
              className="absolute top-5 h-2.5 w-2.5 rounded-sm"
              style={
                {
                  left: `${8 + index * 5.5}%`,
                  backgroundColor: [
                    "#FFC94A",
                    "#5DAE6E",
                    "#5B9BD5",
                    "#E986A8",
                    "#9B7BD4",
                  ][index % 5],
                  "--confetti-x": `${(index % 2 === 0 ? -1 : 1) * (10 + index * 3)}px`,
                  "--confetti-r": `${180 + index * 33}deg`,
                  animation: `confetti-fall ${0.9 + (index % 4) * 0.15}s ease-out forwards`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}

      {drag && dragCard && (
        <div
          aria-hidden
          className="pointer-events-none fixed z-50 flex items-center gap-2 rounded-xl border-[3px] border-ink bg-sun px-2 py-2 text-left shadow-lg"
          style={{
            left: drag.x - drag.offsetX,
            top: drag.y - drag.offsetY,
            width: drag.width,
            minHeight: drag.height,
            transform: "rotate(-2deg) scale(1.04)",
          }}
        >
          <span className="text-2xl leading-none">{dragCard.emoji}</span>
          <span className="text-xs font-extrabold text-ink">{dragCard.label}</span>
        </div>
      )}
    </section>
  );
}
