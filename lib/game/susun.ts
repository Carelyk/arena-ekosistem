import { seededShuffle } from "@/lib/game/utils";
import type { ChainStep, EcosystemChain } from "@/lib/types";

export const SUSUN_FREEZE_MS = 2000;
export const SUSUN_POINTS_PER_POSITION = 100;
export const SUSUN_BONUS = 250;

export interface SusunCard {
  id: string;
  label: string;
  emoji: string;
  role: ChainStep["role"];
  /** Index of the chain step this card belongs to, or null for the decomposer. */
  correctIndex: number | null;
  note: string;
}

export interface SusunBoard {
  cards: SusunCard[];
  slots: Record<string, string | null>;
  selectedCardId: string | null;
  frozenUntil: number;
  bestCorrect: number;
  bonusEarned: boolean;
  finishMs: number | null;
  wrongCount: number;
  submissions: number;
}

export type SubmitOutcome =
  | { kind: "correct"; correct: number; total: number; firstToFinish: boolean }
  | { kind: "wrong"; correct: number; total: number; frozenUntil: number }
  | { kind: "frozen"; frozenUntil: number }
  | { kind: "ignored" };

export function stepSlotId(index: number): string {
  return `step-${index}`;
}

export const DECOMPOSER_SLOT = "decomposer";

export function buildSlotIds(chain: EcosystemChain): string[] {
  return [...chain.steps.map((_, index) => stepSlotId(index)), DECOMPOSER_SLOT];
}

export function cardsForChain(chain: EcosystemChain): SusunCard[] {
  return [
    ...chain.steps.map((step, index) => ({
      id: `${chain.id}-${step.id}`,
      label: step.label,
      emoji: step.emoji,
      role: step.role,
      correctIndex: index,
      note: step.note,
    })),
    {
      id: `${chain.id}-${chain.decomposer.id}`,
      label: chain.decomposer.label,
      emoji: chain.decomposer.emoji,
      role: chain.decomposer.role,
      correctIndex: null,
      note: chain.decomposer.note,
    },
  ];
}

export function createBoard(chain: EcosystemChain, seed: number): SusunBoard {
  const cards = seededShuffle(cardsForChain(chain), seed);
  const slots = Object.fromEntries(
    buildSlotIds(chain).map((slotId) => [slotId, null]),
  ) as Record<string, string | null>;

  return {
    cards,
    slots,
    selectedCardId: null,
    frozenUntil: 0,
    bestCorrect: 0,
    bonusEarned: false,
    finishMs: null,
    wrongCount: 0,
    submissions: 0,
  };
}

export function totalPositions(chain: EcosystemChain): number {
  return chain.steps.length + 1;
}

export function slotOfCard(board: SusunBoard, cardId: string): string | null {
  for (const [slotId, occupant] of Object.entries(board.slots)) {
    if (occupant === cardId) return slotId;
  }
  return null;
}

export function isPlaced(board: SusunBoard, cardId: string): boolean {
  return slotOfCard(board, cardId) !== null;
}

export function filledCount(board: SusunBoard): number {
  return Object.values(board.slots).filter((value) => value !== null).length;
}

export function allSlotsFilled(board: SusunBoard): boolean {
  return Object.values(board.slots).every((value) => value !== null);
}

/**
 * Move a card into a slot. When the target slot is occupied, the occupant is
 * swapped into the source slot, or returned to the pool when the card came
 * from the pool. There is no validation feedback in this function on purpose:
 * correctness is only computed on submit.
 */
export function placeCard(
  board: SusunBoard,
  cardId: string,
  slotId: string,
): SusunBoard {
  if (!(slotId in board.slots)) return board;
  if (!board.cards.some((card) => card.id === cardId)) return board;

  const sourceSlot = slotOfCard(board, cardId);
  const occupant = board.slots[slotId];
  if (occupant === cardId) {
    return { ...board, selectedCardId: null };
  }

  const slots = { ...board.slots };
  slots[slotId] = cardId;
  if (sourceSlot) {
    slots[sourceSlot] = occupant ?? null;
  }

  return { ...board, slots, selectedCardId: null };
}

export function returnCard(board: SusunBoard, cardId: string): SusunBoard {
  const sourceSlot = slotOfCard(board, cardId);
  if (!sourceSlot) return { ...board, selectedCardId: null };
  const slots = { ...board.slots, [sourceSlot]: null };
  return { ...board, slots, selectedCardId: null };
}

export function selectCard(board: SusunBoard, cardId: string): SusunBoard {
  return {
    ...board,
    selectedCardId: board.selectedCardId === cardId ? null : cardId,
  };
}

export function countCorrect(board: SusunBoard, chain: EcosystemChain): number {
  let correct = 0;
  chain.steps.forEach((_, index) => {
    const cardId = board.slots[stepSlotId(index)];
    if (!cardId) return;
    const card = board.cards.find((item) => item.id === cardId);
    if (card && card.correctIndex === index) correct += 1;
  });
  const decomposerCard = board.cards.find(
    (card) => card.id === board.slots[DECOMPOSER_SLOT],
  );
  if (decomposerCard?.role === "pengurai") correct += 1;
  return correct;
}

export function isSolved(board: SusunBoard, chain: EcosystemChain): boolean {
  return (
    allSlotsFilled(board) && countCorrect(board, chain) === totalPositions(chain)
  );
}

export function submitBoard(
  board: SusunBoard,
  chain: EcosystemChain,
  now: number,
  elapsedMs: number,
  opponentFinished: boolean,
): { board: SusunBoard; outcome: SubmitOutcome } {
  if (board.finishMs !== null) {
    return { board, outcome: { kind: "ignored" } };
  }
  if (now < board.frozenUntil) {
    return {
      board,
      outcome: { kind: "frozen", frozenUntil: board.frozenUntil },
    };
  }
  if (!allSlotsFilled(board)) {
    return { board, outcome: { kind: "ignored" } };
  }

  const correct = countCorrect(board, chain);
  const total = totalPositions(chain);
  const bestCorrect = Math.max(board.bestCorrect, correct);

  if (correct === total) {
    const firstToFinish = !opponentFinished;
    return {
      board: {
        ...board,
        bestCorrect,
        bonusEarned: board.bonusEarned || firstToFinish,
        finishMs: elapsedMs,
        submissions: board.submissions + 1,
      },
      outcome: { kind: "correct", correct, total, firstToFinish },
    };
  }

  return {
    board: {
      ...board,
      bestCorrect,
      wrongCount: board.wrongCount + 1,
      frozenUntil: now + SUSUN_FREEZE_MS,
      submissions: board.submissions + 1,
    },
    outcome: {
      kind: "wrong",
      correct,
      total,
      frozenUntil: now + SUSUN_FREEZE_MS,
    },
  };
}

export function boardScore(board: SusunBoard): number {
  return board.bestCorrect * SUSUN_POINTS_PER_POSITION +
    (board.bonusEarned ? SUSUN_BONUS : 0);
}

export function solvedLabel(chain: EcosystemChain): string {
  const main = chain.steps.map((step) => step.label).join(" → ");
  return `${main} → ${chain.decomposer.label}`;
}

export function cardById(board: SusunBoard, cardId: string | null): SusunCard | null {
  if (!cardId) return null;
  return board.cards.find((card) => card.id === cardId) ?? null;
}
