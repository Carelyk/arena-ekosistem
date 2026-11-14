import { applySeedRotation, SEED_QUESTIONS } from "@/lib/data/questions";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";
import type { CategoryId, Difficulty, EcoQuestion, OptionIndex } from "@/lib/types";

function isOptionIndex(value: unknown): value is OptionIndex {
  return value === 0 || value === 1 || value === 2 || value === 3;
}

function isQuestion(value: unknown): value is EcoQuestion {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<EcoQuestion>;
  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    Array.isArray(item.options) &&
    item.options.length === 4 &&
    item.options.every((option) => typeof option === "string") &&
    isOptionIndex(item.correctIndex) &&
    typeof item.explanation === "string" &&
    typeof item.category === "string" &&
    (item.difficulty === "mudah" ||
      item.difficulty === "sedang" ||
      item.difficulty === "sulit") &&
    typeof item.reviewed === "boolean" &&
    typeof item.active === "boolean"
  );
}

function normalize(question: EcoQuestion): EcoQuestion {
  return {
    ...question,
    origin: question.origin === "guru" ? "guru" : "seed",
  };
}

export function seedBank(): EcoQuestion[] {
  return SEED_QUESTIONS.map((question) => applySeedRotation(question));
}

/** Local question bank. Teacher edits persist on this device. */
export function loadQuestionBank(): EcoQuestion[] {
  const stored = readJson<unknown>(STORAGE_KEYS.questions, null);
  if (!Array.isArray(stored)) {
    const seeds = seedBank();
    writeJson(STORAGE_KEYS.questions, seeds);
    return seeds;
  }
  const valid = stored.filter(isQuestion).map(normalize);
  if (valid.length === 0) {
    const seeds = seedBank();
    writeJson(STORAGE_KEYS.questions, seeds);
    return seeds;
  }
  return valid;
}

export function saveQuestionBank(questions: EcoQuestion[]): boolean {
  return writeJson(STORAGE_KEYS.questions, questions);
}

export function resetQuestionBank(): EcoQuestion[] {
  const seeds = seedBank();
  writeJson(STORAGE_KEYS.questions, seeds);
  return seeds;
}

export interface QuestionDraft {
  id?: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: OptionIndex;
  explanation: string;
  category: CategoryId;
  difficulty: Difficulty;
  reviewed: boolean;
  active: boolean;
}

export function validateDraft(
  draft: QuestionDraft,
  bank: EcoQuestion[],
): string[] {
  const errors: string[] = [];
  if (draft.text.trim().length < 10) {
    errors.push("Teks soal minimal 10 karakter.");
  }
  draft.options.forEach((option, index) => {
    if (option.trim().length === 0) {
      errors.push(`Pilihan ${String.fromCharCode(65 + index)} belum diisi.`);
    }
  });
  const unique = new Set(draft.options.map((option) => option.trim().toLowerCase()));
  if (unique.size !== 4) {
    errors.push("Keempat pilihan jawaban harus berbeda.");
  }
  if (!isOptionIndex(draft.correctIndex)) {
    errors.push("Pilih satu jawaban benar.");
  }
  if (draft.explanation.trim().length < 8) {
    errors.push("Pembahasan minimal 8 karakter.");
  }
  if (!draft.category) {
    errors.push("Kategori wajib dipilih.");
  }
  if (
    draft.id &&
    bank.some((question) => question.id === draft.id) &&
    draft.text.trim().length === 0
  ) {
    errors.push("Teks soal tidak boleh kosong.");
  }
  return errors;
}

export function upsertQuestion(
  bank: EcoQuestion[],
  draft: QuestionDraft,
): EcoQuestion[] {
  const next: EcoQuestion = {
    id: draft.id ?? `guru-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    text: draft.text.trim(),
    options: draft.options.map((option) => option.trim()) as [
      string,
      string,
      string,
      string,
    ],
    correctIndex: draft.correctIndex,
    explanation: draft.explanation.trim(),
    category: draft.category,
    difficulty: draft.difficulty,
    reviewed: draft.reviewed,
    active: draft.active,
    origin: draft.id && bank.some((question) => question.id === draft.id)
      ? bank.find((question) => question.id === draft.id)?.origin ?? "guru"
      : "guru",
  };
  const exists = bank.some((question) => question.id === next.id);
  return exists
    ? bank.map((question) => (question.id === next.id ? next : question))
    : [next, ...bank];
}
