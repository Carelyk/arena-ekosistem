import { loadQuestionBank } from "@/lib/data/question-bank";
import { isUsableQuestion, toPublicQuestion } from "@/lib/data/questions";
import { shuffle } from "@/lib/game/utils";
import type {
  CategoryId,
  EcoQuestion,
  OptionIndex,
  PublicQuestion,
} from "@/lib/types";

export const FREEZE_MS = 2000;
export const CORRECT_POINTS = 100;
export const FASTEST_BONUS = 50;
export const MAX_ROUNDS = 10;

export type DuelPhase = "ready" | "playing" | "revealed" | "finished";

export interface DuelConfig {
  roundSeconds: number;
  maxRounds: number;
}

export interface DuelPlayerState {
  score: number;
  frozenUntil: number;
  attempted: boolean;
  selectedOption: OptionIndex | null;
  solved: boolean;
  wrongCount: number;
  correctCount: number;
  fastestBonus: number;
  answers: number;
}

export interface DuelReveal {
  correctIndex: OptionIndex;
  explanation: string;
  firstSolver: 0 | 1 | null;
  solved: [boolean, boolean];
}

export interface DuelSnapshot {
  phase: DuelPhase;
  roundIndex: number;
  totalRounds: number;
  question: PublicQuestion | null;
  roundDeadline: number;
  paused: boolean;
  players: [DuelPlayerState, DuelPlayerState];
  reveal: DuelReveal | null;
  timeLeftMs: number;
}

export type DuelAnswerEvent =
  | { kind: "correct"; points: number; bonus: boolean; firstSolver: 0 | 1 }
  | { kind: "wrong"; frozenUntil: number }
  | { kind: "locked" }
  | { kind: "frozen"; frozenUntil: number }
  | { kind: "paused" }
  | { kind: "round-over" }
  | { kind: "not-playing" };

function initialPlayer(): DuelPlayerState {
  return {
    score: 0,
    frozenUntil: 0,
    attempted: false,
    selectedOption: null,
    solved: false,
    wrongCount: 0,
    correctCount: 0,
    fastestBonus: 0,
    answers: 0,
  };
}

/**
 * Local 1v1 duel engine.
 *
 * The engine owns the answer keys. Components receive a `DuelSnapshot` that
 * only contains `PublicQuestion` fields, so the key and explanation cannot be
 * rendered before the round is closed. For online room-code play the same rule
 * is enforced by `eco_submit_room_answer` / `eco_reveal_room_round` in SQL.
 */
export class DuelEngine {
  private readonly questions: EcoQuestion[];
  private readonly roundMs: number;
  private roundIndex = 0;
  private phase: DuelPhase = "ready";
  private deadline = 0;
  private pausedAt: number | null = null;
  private pausedRemaining = 0;
  private firstSolver: 0 | 1 | null = null;
  private reveal: DuelReveal | null = null;
  private players: [DuelPlayerState, DuelPlayerState] = [
    initialPlayer(),
    initialPlayer(),
  ];

  constructor(questions: EcoQuestion[], config: DuelConfig) {
    if (questions.length === 0) {
      throw new Error("Butuh minimal satu soal untuk memulai duel.");
    }
    this.questions = questions.slice(0, config.maxRounds);
    this.roundMs = Math.max(10, config.roundSeconds) * 1000;
  }

  get totalRounds(): number {
    return this.questions.length;
  }

  start(now: number): void {
    this.phase = "playing";
    this.roundIndex = 0;
    this.beginRound(now);
  }

  private beginRound(now: number): void {
    this.deadline = now + this.roundMs;
    this.pausedAt = null;
    this.pausedRemaining = 0;
    this.firstSolver = null;
    this.reveal = null;
    this.players[0].solved = false;
    this.players[1].solved = false;
    this.players[0].attempted = false;
    this.players[1].attempted = false;
    this.players[0].selectedOption = null;
    this.players[1].selectedOption = null;
    this.players[0].frozenUntil = 0;
    this.players[1].frozenUntil = 0;
  }

  answer(player: 0 | 1, option: OptionIndex, now: number): DuelAnswerEvent {
    if (this.phase !== "playing") {
      return { kind: this.phase === "revealed" ? "round-over" : "not-playing" };
    }
    if (this.pausedAt !== null) return { kind: "paused" };
    if (now >= this.deadline) {
      this.closeRound();
      return { kind: "round-over" };
    }

    const state = this.players[player];
    if (state.attempted) return { kind: "locked" };
    if (now < state.frozenUntil) {
      return { kind: "frozen", frozenUntil: state.frozenUntil };
    }

    state.answers += 1;
    state.attempted = true;
    state.selectedOption = option;
    const question = this.questions[this.roundIndex];
    const isCorrect = option === question.correctIndex;

    if (!isCorrect) {
      state.wrongCount += 1;
      if (this.players[0].attempted && this.players[1].attempted) {
        this.closeRound();
      }
      return { kind: "wrong", frozenUntil: 0 };
    }

    state.solved = true;
    state.correctCount += 1;
    const bonus = this.firstSolver === null;
    if (bonus) {
      this.firstSolver = player;
      state.fastestBonus += 1;
    }
    state.score += CORRECT_POINTS + (bonus ? FASTEST_BONUS : 0);

    if (this.players[0].attempted && this.players[1].attempted) {
      this.closeRound();
    }

    return {
      kind: "correct",
      points: CORRECT_POINTS + (bonus ? FASTEST_BONUS : 0),
      bonus,
      firstSolver: player,
    };
  }

  tick(now: number): "none" | "round-ended" | "finished" {
    if (this.phase !== "playing" || this.pausedAt !== null) return "none";
    if (now >= this.deadline) {
      this.closeRound();
      return "round-ended";
    }
    return "none";
  }

  private closeRound(): void {
    const question = this.questions[this.roundIndex];
    this.phase = "revealed";
    this.reveal = {
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      firstSolver: this.firstSolver,
      solved: [this.players[0].solved, this.players[1].solved],
    };
  }

  nextRound(now: number): "playing" | "finished" | "not-revealed" {
    if (this.phase !== "revealed") return "not-revealed";
    if (this.roundIndex + 1 >= this.questions.length) {
      this.phase = "finished";
      this.pausedAt = null;
      return "finished";
    }
    this.roundIndex += 1;
    this.phase = "playing";
    this.beginRound(now);
    return "playing";
  }

  pause(now: number): boolean {
    if (this.phase !== "playing" || this.pausedAt !== null) return false;
    this.pausedAt = now;
    this.pausedRemaining = Math.max(0, this.deadline - now);
    return true;
  }

  resume(now: number): boolean {
    if (this.pausedAt === null) return false;
    const pausedFor = Math.max(0, now - this.pausedAt);
    this.deadline = now + this.pausedRemaining;
    this.pausedAt = null;
    for (const player of this.players) {
      if (player.frozenUntil > now) player.frozenUntil += pausedFor;
    }
    return true;
  }

  forceFinish(): void {
    this.phase = "finished";
    this.pausedAt = null;
  }

  getSnapshot(now: number): DuelSnapshot {
    const paused = this.pausedAt !== null;
    const timeLeftMs = paused
      ? Math.max(0, this.pausedRemaining)
      : Math.max(0, this.deadline - now);
    const question =
      this.phase === "finished"
        ? null
        : toPublicQuestion(this.questions[this.roundIndex]);

    return {
      phase: this.phase,
      roundIndex: this.roundIndex,
      totalRounds: this.questions.length,
      question,
      roundDeadline: this.deadline,
      paused,
      players: [
        { ...this.players[0] },
        { ...this.players[1] },
      ],
      reveal: this.reveal,
      timeLeftMs,
    };
  }
}

export function pickDuelQuestions(
  difficulty: "mudah" | "sedang" | "sulit" | "campuran" = "campuran",
  category: "all" | CategoryId = "all",
  count = MAX_ROUNDS,
  suppliedBank?: EcoQuestion[],
): EcoQuestion[] {
  const bank = (suppliedBank ?? loadQuestionBank()).filter(isUsableQuestion);
  const filtered = bank.filter((q: EcoQuestion) => {
    if (difficulty !== "campuran" && q.difficulty !== difficulty) return false;
    if (category !== "all" && q.category !== category) return false;
    return true;
  });
  const source = filtered.length >= 3 ? filtered : bank;
  return shuffle(source).slice(0, Math.min(count, source.length));
}

export function winnerOf(score1: number, score2: number): "p1" | "p2" | "draw" {
  if (score1 === score2) return "draw";
  return score1 > score2 ? "p1" : "p2";
}
