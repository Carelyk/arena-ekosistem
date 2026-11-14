export type CategoryId =
  | "definisi"
  | "fotosintesis"
  | "konsumen"
  | "pengurai"
  | "aliran-energi"
  | "sawah"
  | "hutan"
  | "laut"
  | "populasi"
  | "keseimbangan";

export type Difficulty = "mudah" | "sedang" | "sulit";

export type OptionIndex = 0 | 1 | 2 | 3;

export type QuestionOptions = [string, string, string, string];

export interface EcoQuestion {
  id: string;
  text: string;
  options: QuestionOptions;
  correctIndex: OptionIndex;
  explanation: string;
  category: CategoryId;
  difficulty: Difficulty;
  reviewed: boolean;
  active: boolean;
  /** Seed questions ship with the app; teacher-created questions live in storage. */
  origin: "seed" | "guru";
}

/** Question shape that is safe to render before a round is closed. */
export interface PublicQuestion {
  id: string;
  text: string;
  options: QuestionOptions;
  category: CategoryId;
  difficulty: Difficulty;
}

export interface PlayerInfo {
  name: string;
  avatar: string;
}

export type EcosystemId = "sawah" | "hutan" | "laut";

export interface ChainStep {
  id: string;
  label: string;
  emoji: string;
  role: "produsen" | "konsumen1" | "konsumen2" | "konsumen3" | "puncak" | "pengurai";
  note: string;
}

export interface EcosystemChain {
  id: EcosystemId;
  name: string;
  emoji: string;
  summary: string;
  steps: ChainStep[];
  decomposer: ChainStep;
  decomposerNote: string;
}

export type GameKind = "duel" | "susun";

export interface DuelDetail {
  kind: "duel";
  rounds: number;
  correctP1: number;
  correctP2: number;
  answersP1: number;
  answersP2: number;
  fastestBonusP1: number;
  fastestBonusP2: number;
}

export interface SusunDetail {
  kind: "susun";
  ecosystem: EcosystemId;
  completedP1: boolean;
  completedP2: boolean;
  finishMsP1: number | null;
  finishMsP2: number | null;
  correctP1: number;
  correctP2: number;
}

export interface ScoredPlayer extends PlayerInfo {
  score: number;
}

export interface MatchRecord {
  id: string;
  game: GameKind;
  player1: ScoredPlayer;
  player2: ScoredPlayer;
  winner: "p1" | "p2" | "draw";
  createdAt: string;
  detail: DuelDetail | SusunDetail;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  emoji: string;
}

export interface BadgeUnlock {
  id: string;
  player: string;
  unlockedAt: string;
}

export interface LeaderboardEntry {
  key: string;
  name: string;
  avatar: string;
  score: number;
  wins: number;
  matches: number;
  date: string;
  title: string;
  badges: string[];
}

export type LeaderboardFilter = "all" | "duel" | "susun";

export interface AudioPreferences {
  muted: boolean;
  master: number;
  music: number;
  sfx: number;
}
