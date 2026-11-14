"use client";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  loadQuestionBank,
  resetQuestionBank,
  saveQuestionBank,
  upsertQuestion,
  validateDraft,
  type QuestionDraft,
} from "@/lib/data/question-bank";
import { CATEGORY_LABELS, CATEGORY_ORDER } from "@/lib/data/questions";
import type { CategoryId, Difficulty, EcoQuestion, OptionIndex } from "@/lib/types";

const OPTION_LETTERS = ["A", "B", "C", "D"] as const;

const DIFFICULTIES: Array<{ id: Difficulty; label: string }> = [
  { id: "mudah", label: "Mudah" },
  { id: "sedang", label: "Sedang" },
  { id: "sulit", label: "Sulit" },
];

function emptyDraft(): QuestionDraft {
  return {
    text: "",
    options: ["", "", "", ""],
    correctIndex: 0,
    explanation: "",
    category: "definisi",
    difficulty: "mudah",
    reviewed: false,
    active: true,
  };
}

function draftFromQuestion(question: EcoQuestion): QuestionDraft {
  return {
    id: question.id,
    text: question.text,
    options: [...question.options],
    correctIndex: question.correctIndex,
    explanation: question.explanation,
    category: question.category,
    difficulty: question.difficulty,
    reviewed: question.reviewed,
    active: question.active,
  };
}

export default function GuruPage() {
  const [bank, setBank] = useState<EcoQuestion[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [draft, setDraft] = useState<QuestionDraft>(emptyDraft);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    // Reading localStorage during render would break SSR, and calling setState
    // synchronously inside the effect body triggers a cascading render, so the
    // read is deferred by one task.
    const timer = window.setTimeout(() => {
      setBank(loadQuestionBank());
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bank.filter((question) => {
      if (category !== "all" && question.category !== category) return false;
      if (!term) return true;
      return (
        question.text.toLowerCase().includes(term) ||
        question.explanation.toLowerCase().includes(term)
      );
    });
  }, [bank, category, search]);

  const stats = useMemo(() => {
    const reviewed = bank.filter((question) => question.reviewed).length;
    const active = bank.filter((question) => question.active).length;
    const usable = bank.filter(
      (question) => question.active && question.reviewed,
    ).length;
    return { total: bank.length, reviewed, active, usable };
  }, [bank]);

  function persist(next: EcoQuestion[], message: string) {
    setBank(next);
    const ok = saveQuestionBank(next);
    setNotice(
      ok
        ? message
        : "Perubahan tidak dapat disimpan di perangkat ini (penyimpanan diblokir).",
    );
  }

  function openCreate() {
    setDraft(emptyDraft());
    setErrors([]);
    setNotice(null);
    setFormOpen(true);
  }

  function openEdit(question: EcoQuestion) {
    setDraft(draftFromQuestion(question));
    setErrors([]);
    setNotice(null);
    setFormOpen(true);
  }

  function submitDraft() {
    const found = validateDraft(draft, bank);
    if (found.length > 0) {
      setErrors(found);
      return;
    }
    const next = upsertQuestion(bank, draft);
    persist(
      next,
      draft.id
        ? "Soal diperbarui."
        : draft.reviewed && draft.active
          ? "Soal baru ditambahkan dan siap dipakai di arena."
          : "Soal baru ditambahkan dan menunggu tinjauan.",
    );
    setErrors([]);
    setFormOpen(false);
    setDraft(emptyDraft());
  }

  function toggleField(id: string, field: "active" | "reviewed") {
    const next = bank.map((question) =>
      question.id === id ? { ...question, [field]: !question[field] } : question,
    );
    persist(
      next,
      field === "active"
        ? "Status aktif diperbarui."
        : "Status tinjauan diperbarui.",
    );
  }

  function removeQuestion(id: string) {
    const next = bank.filter((question) => question.id !== id);
    persist(next, "Soal dihapus dari bank lokal.");
    setConfirmDelete(null);
  }

  function restoreSeed() {
    const next = resetQuestionBank();
    setBank(next);
    setNotice("Bank soal dikembalikan ke 32 soal bawaan.");
    setFormOpen(false);
    setDraft(emptyDraft());
    setErrors([]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:py-12">
      <header className="max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border-[3px] border-ink/15 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-wide text-ink-soft">
          <Filter aria-hidden className="h-4 w-4" />
          Panel Guru
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
          Bank Soal Ekosistem
        </h1>
        <p className="mt-3 text-base font-semibold leading-relaxed text-ink/85">
          Tambah, ubah, tinjau, dan nonaktifkan soal. Hanya soal yang aktif dan
          sudah ditinjau yang dipakai di arena.
        </p>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          { label: "Total soal", value: stats.total },
          { label: "Aktif", value: stats.active },
          { label: "Ditinjau", value: stats.reviewed },
          { label: "Siap dipakai", value: stats.usable },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-2xl border-[3px] border-ink/15 bg-white px-4 py-3"
          >
            <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
              {item.label}
            </p>
            <p className="font-display text-3xl font-semibold tabular-nums text-ink">
              {loaded ? item.value : "–"}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex min-h-11 flex-1 items-center gap-2 rounded-xl border-[3px] border-ink/20 bg-white px-3 py-2">
          <Search aria-hidden className="h-4 w-4 shrink-0 text-ink-soft" />
          <span className="sr-only">Cari soal</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari teks soal atau pembahasan..."
            className="w-full bg-transparent text-sm font-bold text-ink outline-none"
          />
        </label>
        <label className="flex min-h-11 items-center gap-2 rounded-xl border-[3px] border-ink/20 bg-white px-3 py-2">
          <span className="sr-only">Filter kategori</span>
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as CategoryId | "all")
            }
            className="min-w-0 bg-transparent text-sm font-bold text-ink outline-none"
          >
            <option value="all">Semua kategori</option>
            {CATEGORY_ORDER.map((id) => (
              <option key={id} value={id}>
                {CATEGORY_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={openCreate}
          className="sticker sticker-press flex min-h-11 items-center justify-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink"
        >
          <Plus aria-hidden className="h-4 w-4" />
          Soal baru
        </button>
      </div>

      {notice && (
        <p
          role="status"
          className="mt-3 rounded-xl border-[3px] border-[#2F7A45] bg-produsen-soft px-3 py-2 text-sm font-bold text-produsen-deep"
        >
          {notice}
        </p>
      )}

      {formOpen && (
        <section
          aria-labelledby="form-heading"
          className="sticker mt-5 rounded-3xl bg-white p-5"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id="form-heading"
              className="font-display text-2xl font-semibold text-ink"
            >
              {draft.id ? "Ubah soal" : "Soal baru"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setFormOpen(false);
                setErrors([]);
              }}
              aria-label="Tutup formulir"
              className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-ink/20 bg-cream text-ink"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-extrabold text-ink">
                Teks soal
                <textarea
                  value={draft.text}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Contoh: Belalang yang memakan rumput termasuk ..."
                  className="rounded-xl border-[3px] border-ink/25 bg-cream px-3 py-2 text-sm font-bold text-ink"
                />
              </label>

              <fieldset className="rounded-xl border-[3px] border-ink/15 p-3">
                <legend className="px-1 text-xs font-extrabold text-ink">
                  Pilihan jawaban (tandai satu yang benar)
                </legend>
                <div className="flex flex-col gap-2">
                  {draft.options.map((option, index) => (
                    <label
                      key={index}
                      className={`flex items-center gap-2 rounded-xl border-2 px-2 py-1 ${
                        draft.correctIndex === index
                          ? "border-[#2F7A45] bg-produsen-soft"
                          : "border-ink/15 bg-white"
                      }`}
                    >
                      <input
                        type="radio"
                        name="correct-option"
                        checked={draft.correctIndex === index}
                        onChange={() =>
                          setDraft((current) => ({
                            ...current,
                            correctIndex: index as OptionIndex,
                          }))
                        }
                        className="h-4 w-4 accent-[#2F7A45]"
                      />
                      <span className="w-5 text-xs font-extrabold text-ink">
                        {OPTION_LETTERS[index]}
                      </span>
                      <input
                        value={option}
                        onChange={(event) => {
                          const value = event.target.value;
                          setDraft((current) => {
                            const next: [string, string, string, string] = [
                              ...current.options,
                            ];
                            next[index] = value;
                            return { ...current, options: next };
                          });
                        }}
                        placeholder={`Pilihan ${OPTION_LETTERS[index]}`}
                        className="min-h-9 w-full rounded-lg border-2 border-ink/10 bg-white px-2 py-1 text-sm font-bold text-ink"
                      />
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="flex flex-col gap-1 text-xs font-extrabold text-ink">
                Pembahasan
                <textarea
                  value={draft.explanation}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      explanation: event.target.value,
                    }))
                  }
                  rows={2}
                  placeholder="Jelaskan mengapa jawaban itu benar."
                  className="rounded-xl border-[3px] border-ink/25 bg-cream px-3 py-2 text-sm font-bold text-ink"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-extrabold text-ink">
                Kategori
                <select
                  value={draft.category}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      category: event.target.value as CategoryId,
                    }))
                  }
                  className="min-h-11 rounded-xl border-[3px] border-ink/25 bg-cream px-3 py-2 text-sm font-bold text-ink"
                >
                  {CATEGORY_ORDER.map((id) => (
                    <option key={id} value={id}>
                      {CATEGORY_LABELS[id]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 text-xs font-extrabold text-ink">
                Tingkat kesulitan
                <select
                  value={draft.difficulty}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      difficulty: event.target.value as Difficulty,
                    }))
                  }
                  className="min-h-11 rounded-xl border-[3px] border-ink/25 bg-cream px-3 py-2 text-sm font-bold text-ink"
                >
                  {DIFFICULTIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col gap-2 rounded-xl border-[3px] border-ink/15 p-3">
                <label className="flex min-h-11 items-center justify-between gap-2 text-sm font-extrabold text-ink">
                  Sudah ditinjau
                  <input
                    type="checkbox"
                    checked={draft.reviewed}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        reviewed: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-[#2F7A45]"
                  />
                </label>
                <label className="flex min-h-11 items-center justify-between gap-2 text-sm font-extrabold text-ink">
                  Aktif di arena
                  <input
                    type="checkbox"
                    checked={draft.active}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        active: event.target.checked,
                      }))
                    }
                    className="h-5 w-5 accent-[#2F7A45]"
                  />
                </label>
                <p className="text-xs font-semibold leading-relaxed text-ink-soft">
                  Soal hanya dipakai bila sudah ditinjau dan aktif. Kunci
                  jawaban tetap disimpan di bank lokal dan tidak ditampilkan ke
                  pemain sebelum ronde ditutup.
                </p>
              </div>

              {errors.length > 0 && (
                <ul
                  role="alert"
                  className="flex flex-col gap-1 rounded-xl border-[3px] border-[#B4567A] bg-pengurai-soft px-3 py-2 text-xs font-bold text-pengurai-deep"
                >
                  {errors.map((error) => (
                    <li key={error}>• {error}</li>
                  ))}
                </ul>
              )}

              <button
                type="button"
                onClick={submitDraft}
                className="sticker sticker-press flex min-h-12 items-center justify-center gap-2 rounded-xl bg-sun px-4 py-2 text-sm font-extrabold text-ink"
              >
                <Save aria-hidden className="h-4 w-4" />
                Simpan soal
              </button>
            </div>
          </div>
        </section>
      )}

      <section aria-labelledby="daftar-heading" className="mt-8">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <h2
            id="daftar-heading"
            className="font-display text-2xl font-semibold text-ink"
          >
            Daftar soal
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-xs font-bold text-ink-soft">
              {filtered.length} dari {bank.length} soal
            </p>
            <button
              type="button"
              onClick={restoreSeed}
              className="flex min-h-11 items-center gap-1.5 rounded-xl border-2 border-ink/20 bg-white px-3 py-1.5 text-xs font-extrabold text-ink"
            >
              <RotateCcw aria-hidden className="h-3.5 w-3.5" />
              Pulihkan bawaan
            </button>
          </div>
        </div>

        {!loaded ? (
          <p className="flex items-center gap-2 rounded-2xl border-[3px] border-dashed border-ink/20 bg-white px-4 py-6 text-sm font-bold text-ink-soft">
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
            Memuat bank soal...
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border-[3px] border-dashed border-ink/20 bg-white px-4 py-6 text-center text-sm font-bold text-ink-soft">
            Tidak ada soal yang cocok dengan pencarian atau filter.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {filtered.map((question) => (
              <li
                key={question.id}
                className="rounded-2xl border-[3px] border-ink/15 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-extrabold uppercase tracking-wide text-ink-soft">
                      {CATEGORY_LABELS[question.category]} · {question.difficulty} ·{" "}
                      {question.origin === "seed" ? "bawaan" : "guru"}
                    </p>
                    <p className="mt-1 font-display text-lg font-semibold leading-snug text-ink">
                      {question.text}
                    </p>
                    <p className="mt-1 text-xs font-bold text-produsen-deep">
                      Jawaban: {OPTION_LETTERS[question.correctIndex]}.{" "}
                      {question.options[question.correctIndex]}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-ink-soft">
                      {question.explanation}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleField(question.id, "active")}
                      aria-pressed={question.active}
                      className={`flex min-h-10 items-center gap-1 rounded-lg border-2 px-2 py-1 text-[11px] font-extrabold ${
                        question.active
                          ? "border-[#2F7A45] bg-produsen-soft text-produsen-deep"
                          : "border-ink/20 bg-cream text-ink-soft"
                      }`}
                    >
                      {question.active ? (
                        <Eye aria-hidden className="h-3.5 w-3.5" />
                      ) : (
                        <EyeOff aria-hidden className="h-3.5 w-3.5" />
                      )}
                      {question.active ? "Aktif" : "Nonaktif"}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleField(question.id, "reviewed")}
                      aria-pressed={question.reviewed}
                      className={`flex min-h-10 items-center gap-1 rounded-lg border-2 px-2 py-1 text-[11px] font-extrabold ${
                        question.reviewed
                          ? "border-[#2B6CA3] bg-konsumen2-soft text-konsumen2-deep"
                          : "border-ink/20 bg-cream text-ink-soft"
                      }`}
                    >
                      <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
                      {question.reviewed ? "Ditinjau" : "Belum ditinjau"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(question)}
                      aria-label={`Ubah soal: ${question.text}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-ink/20 bg-white text-ink"
                    >
                      <Pencil aria-hidden className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(question.id)}
                      aria-label={`Hapus soal: ${question.text}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-[#B4567A] bg-pengurai-soft text-pengurai-deep"
                    >
                      <Trash2 aria-hidden className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {confirmDelete === question.id && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border-2 border-[#B4567A] bg-pengurai-soft px-3 py-2">
                    <p className="flex-1 text-xs font-bold text-pengurai-deep">
                      Hapus soal ini dari bank lokal? Tindakan ini tidak dapat
                      dibatalkan.
                    </p>
                    <button
                      type="button"
                      onClick={() => removeQuestion(question.id)}
                      className="min-h-10 rounded-lg bg-[#B4567A] px-3 py-1 text-xs font-extrabold text-white"
                    >
                      Ya, hapus
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(null)}
                      className="min-h-10 rounded-lg border-2 border-ink/20 bg-white px-3 py-1 text-xs font-extrabold text-ink"
                    >
                      Batal
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8 rounded-3xl border-[3px] border-dashed border-ink/25 bg-white/70 p-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          Catatan penyimpanan
        </h2>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-ink/80">
          Perubahan bank soal disimpan di perangkat ini dan hanya berlaku untuk
          perangkat tersebut. Untuk pemakaian lintas perangkat, guru perlu
          memindahkan soal ke tabel Supabase melalui migrasi atau panel admin
          terpisah.
        </p>
      </section>
    </div>
  );
}
