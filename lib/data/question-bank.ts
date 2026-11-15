import { applySeedRotation, SEED_QUESTIONS } from "@/lib/data/questions";
import { readJson, STORAGE_KEYS, writeJson } from "@/lib/storage";
import type { CategoryId, Difficulty, EcoQuestion, OptionIndex } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";

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

type QuestionRow = {
  id: string; prompt: string; options: string[]; correct_index: number;
  explanation: string; category: CategoryId; difficulty: Difficulty;
  reviewed: boolean; active: boolean; origin: "seed" | "guru";
};

function fromRow(row: QuestionRow): EcoQuestion {
  return { id: row.id, text: row.prompt, options: row.options as EcoQuestion["options"],
    correctIndex: row.correct_index as OptionIndex, explanation: row.explanation,
    category: row.category, difficulty: row.difficulty, reviewed: row.reviewed,
    active: row.active, origin: row.origin };
}

export async function loadQuestionBankHybrid(): Promise<{ questions: EcoQuestion[]; online: boolean }> {
  const client = getSupabase();
  if (client) {
    const { data, error } = await client.from("eco_questions").select("id,prompt,options,correct_index,explanation,category,difficulty,reviewed,active,origin").order("created_at");
    if (!error && data?.length) {
      const questions = (data as QuestionRow[]).map(fromRow);
      saveQuestionBank(questions);
      return { questions, online: true };
    }
  }
  return { questions: loadQuestionBank(), online: false };
}

export async function saveQuestionRemote(question: EcoQuestion): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  const { error } = await client.from("eco_questions").upsert({
    id: question.id, prompt: question.text, options: question.options,
    correct_index: question.correctIndex, explanation: question.explanation,
    category: question.category, difficulty: question.difficulty,
    reviewed: question.reviewed, active: question.active, origin: question.origin,
  });
  return !error;
}

export async function deleteQuestionRemote(id: string): Promise<boolean> {
  const client = getSupabase();
  if (!client) return false;
  const { error } = await client.from("eco_questions").delete().eq("id", id);
  return !error;
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
