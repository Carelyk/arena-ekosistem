import type {
  CategoryId,
  EcoQuestion,
  PublicQuestion,
  QuestionOptions,
} from "@/lib/types";

export const CATEGORY_LABELS: Record<CategoryId, string> = {
  definisi: "Definisi rantai makanan",
  fotosintesis: "Fotosintesis & produsen",
  konsumen: "Tingkat konsumen",
  pengurai: "Pengurai",
  "aliran-energi": "Aliran energi",
  sawah: "Ekosistem sawah",
  hutan: "Ekosistem hutan",
  laut: "Ekosistem laut",
  populasi: "Perubahan populasi",
  keseimbangan: "Keseimbangan ekosistem",
};

export const CATEGORY_ORDER: CategoryId[] = [
  "definisi",
  "fotosintesis",
  "konsumen",
  "pengurai",
  "aliran-energi",
  "sawah",
  "hutan",
  "laut",
  "populasi",
  "keseimbangan",
];

function q(
  id: string,
  text: string,
  options: QuestionOptions,
  correctIndex: 0 | 1 | 2 | 3,
  explanation: string,
  category: CategoryId,
  difficulty: EcoQuestion["difficulty"],
): EcoQuestion {
  return {
    id,
    text,
    options,
    correctIndex,
    explanation,
    category,
    difficulty,
    reviewed: true,
    active: true,
    origin: "seed",
  };
}

/**
 * 32 curated Grade 6 IPAS questions about food chains and ecosystem balance.
 * Every item was written for this project; the wording is kept short enough
 * for a 30-second round on a classroom projector.
 */
export const SEED_QUESTIONS: EcoQuestion[] = [
  q(
    "q01",
    "Rantai makanan adalah ...",
    [
      "peristiwa makan dan dimakan dengan arah tertentu",
      "kumpulan hewan yang hidup di satu tempat",
      "proses tumbuhan membuat makanan",
      "hubungan antara manusia dan hewan peliharaan",
    ],
    0,
    "Rantai makanan adalah proses perpindahan energi dan nutrisi antar makhluk hidup di suatu ekosistem.",
    "definisi",
    "mudah",
  ),
  q(
    "q02",
    "Urutan rantai makanan selalu dimulai dari ...",
    ["produsen", "konsumen puncak", "pengurai", "hewan karnivora"],
    0,
    "Produsen menjadi awal rantai makanan karena mampu membuat makanan sendiri.",
    "definisi",
    "mudah",
  ),
  q(
    "q03",
    "Sumber energi utama bagi rantai makanan di Bumi adalah ...",
    ["Matahari", "Bulan", "angin", "tanah"],
    0,
    "Matahari adalah sumber energi utama. Cahaya matahari ditangkap tumbuhan untuk fotosintesis.",
    "fotosintesis",
    "mudah",
  ),
  q(
    "q04",
    "Tumbuhan disebut produsen karena ...",
    [
      "dapat membuat makanan sendiri melalui fotosintesis",
      "memakan serangga di sekitarnya",
      "menguraikan sisa makhluk hidup",
      "menghasilkan energi baru dari tanah",
    ],
    0,
    "Produsen membuat makanan sendiri melalui fotosintesis, bukan menciptakan energi.",
    "fotosintesis",
    "mudah",
  ),
  q(
    "q05",
    "Bahan yang dibutuhkan tumbuhan untuk fotosintesis adalah ...",
    [
      "air, karbon dioksida, dan cahaya matahari",
      "oksigen, tanah, dan angin",
      "gula, air, dan mineral",
      "nitrogen, oksigen, dan panas bumi",
    ],
    0,
    "Fotosintesis membutuhkan air, karbon dioksida, dan cahaya matahari.",
    "fotosintesis",
    "sedang",
  ),
  q(
    "q06",
    "Hasil fotosintesis yang dimanfaatkan makhluk hidup lain adalah ...",
    [
      "karbohidrat dan oksigen",
      "air dan tanah",
      "protein dan lemak",
      "karbon dioksida dan air",
    ],
    0,
    "Fotosintesis menghasilkan karbohidrat sebagai makanan dan oksigen untuk pernapasan.",
    "fotosintesis",
    "sedang",
  ),
  q(
    "q07",
    "Belalang yang memakan rumput termasuk ...",
    [
      "konsumen tingkat I",
      "produsen",
      "konsumen tingkat II",
      "pengurai",
    ],
    0,
    "Belalang memakan produsen, sehingga disebut konsumen tingkat I.",
    "konsumen",
    "mudah",
  ),
  q(
    "q08",
    "Katak yang memakan belalang termasuk ...",
    [
      "konsumen tingkat II",
      "produsen",
      "konsumen tingkat I",
      "pengurai",
    ],
    0,
    "Katak memakan konsumen tingkat I, sehingga menjadi konsumen tingkat II.",
    "konsumen",
    "mudah",
  ),
  q(
    "q09",
    "Dalam rantai makanan sawah, elang berperan sebagai ...",
    [
      "konsumen puncak",
      "produsen",
      "konsumen tingkat I",
      "pengurai",
    ],
    0,
    "Elang berada pada tingkat trofik tertinggi pada contoh rantai makanan sawah.",
    "konsumen",
    "mudah",
  ),
  q(
    "q10",
    "Konsumen tingkat II memperoleh energi dari ...",
    ["konsumen tingkat I", "produsen", "pengurai", "cahaya matahari"],
    0,
    "Konsumen tingkat II memakan konsumen tingkat I untuk memperoleh energi.",
    "konsumen",
    "sedang",
  ),
  q(
    "q11",
    "Jamur dan bakteri disebut pengurai karena ...",
    [
      "menguraikan sisa organisme menjadi zat hara",
      "membuat makanan melalui fotosintesis",
      "memakan produsen secara langsung",
      "menjadi konsumen puncak di ekosistem",
    ],
    0,
    "Pengurai menguraikan sisa organisme dan mengembalikan unsur hara ke lingkungan.",
    "pengurai",
    "mudah",
  ),
  q(
    "q12",
    "Pengurai dapat bekerja pada ...",
    [
      "sisa organisme dari semua tingkat trofik",
      "hanya tubuh konsumen puncak",
      "hanya daun yang masih hidup",
      "hanya bangkai hewan besar",
    ],
    0,
    "Sisa organisme dari produsen sampai konsumen puncak dapat diuraikan oleh pengurai.",
    "pengurai",
    "sedang",
  ),
  q(
    "q13",
    "Arah panah pada rantai makanan menunjukkan ...",
    [
      "perpindahan energi dari yang dimakan ke pemakan",
      "urutan hewan dari kecil ke besar",
      "arah gerak hewan mencari air",
      "jumlah populasi setiap makhluk hidup",
    ],
    0,
    "Panah menunjuk ke organisme pemakan, tempat energi berpindah.",
    "aliran-energi",
    "sedang",
  ),
  q(
    "q14",
    "Mengapa energi yang diterima konsumen puncak lebih sedikit?",
    [
      "Sebagian energi hilang sebagai panas dan dipakai untuk aktivitas",
      "Energi berubah menjadi tanah",
      "Konsumen puncak tidak membutuhkan energi",
      "Matahari berhenti mengirim energi",
    ],
    0,
    "Setiap perpindahan energi disertai energi yang hilang sebagai panas dan digunakan untuk aktivitas.",
    "aliran-energi",
    "sulit",
  ),
  q(
    "q15",
    "Urutan rantai makanan di ekosistem sawah yang benar adalah ...",
    [
      "Padi → Belalang → Katak → Ular → Elang",
      "Padi → Katak → Belalang → Elang → Ular",
      "Belalang → Padi → Ular → Katak → Elang",
      "Elang → Ular → Katak → Belalang → Padi",
    ],
    0,
    "Padi dimakan belalang, belalang dimakan katak, katak dimakan ular, lalu ular dimakan elang.",
    "sawah",
    "sedang",
  ),
  q(
    "q16",
    "Pada rantai makanan sawah, ular memangsa ...",
    ["katak", "padi", "elang", "jamur"],
    0,
    "Ular menempati tingkat trofik setelah katak, sehingga memangsa katak.",
    "sawah",
    "mudah",
  ),
  q(
    "q17",
    "Jika populasi belalang berkurang drastis, kemungkinan yang terjadi adalah ...",
    [
      "populasi padi meningkat dan populasi katak menurun",
      "populasi padi menurun dan populasi katak meningkat",
      "semua populasi tetap sama",
      "elang langsung menjadi produsen",
    ],
    0,
    "Belalang adalah pemakan padi dan makanan katak, sehingga perubahan populasinya memengaruhi keduanya.",
    "populasi",
    "sulit",
  ),
  q(
    "q18",
    "Petani menanam padi di sawah. Dalam rantai makanan, padi berperan sebagai ...",
    ["produsen", "konsumen tingkat I", "konsumen puncak", "pengurai"],
    0,
    "Padi membuat makanan sendiri melalui fotosintesis, sehingga berperan sebagai produsen.",
    "sawah",
    "mudah",
  ),
  q(
    "q19",
    "Urutan rantai makanan di hutan yang benar adalah ...",
    [
      "Daun → Ulat → Burung pemakan serangga → Elang",
      "Ulat → Daun → Elang → Burung pemakan serangga",
      "Elang → Burung pemakan serangga → Ulat → Daun",
      "Daun → Elang → Ulat → Burung pemakan serangga",
    ],
    0,
    "Energi mengalir dari daun ke ulat, lalu ke burung pemakan serangga, lalu ke elang.",
    "hutan",
    "sedang",
  ),
  q(
    "q20",
    "Burung pemakan serangga pada rantai makanan hutan berperan sebagai ...",
    [
      "konsumen tingkat II",
      "produsen",
      "konsumen tingkat I",
      "pengurai",
    ],
    0,
    "Burung memakan ulat (konsumen tingkat I), sehingga menjadi konsumen tingkat II.",
    "hutan",
    "sedang",
  ),
  q(
    "q21",
    "Jika elang di hutan banyak diburu, populasi burung pemakan serangga akan ...",
    ["meningkat", "menurun", "tetap", "hilang seluruhnya"],
    0,
    "Berkurangnya predator membuat populasi mangsa di bawahnya cenderung meningkat.",
    "populasi",
    "sulit",
  ),
  q(
    "q22",
    "Urutan rantai makanan di ekosistem laut yang benar adalah ...",
    [
      "Fitoplankton → Zooplankton → Ikan kecil → Ikan besar → Hiu",
      "Hiu → Ikan besar → Ikan kecil → Zooplankton → Fitoplankton",
      "Zooplankton → Fitoplankton → Hiu → Ikan kecil → Ikan besar",
      "Fitoplankton → Ikan besar → Zooplankton → Hiu → Ikan kecil",
    ],
    0,
    "Fitoplankton dimakan zooplankton, lalu ikan kecil, ikan besar, dan akhirnya hiu.",
    "laut",
    "sedang",
  ),
  q(
    "q23",
    "Fitoplankton di laut berperan sebagai ...",
    ["produsen", "konsumen tingkat II", "konsumen puncak", "pengurai"],
    0,
    "Fitoplankton berfotosintesis dan menjadi dasar rantai makanan laut.",
    "laut",
    "mudah",
  ),
  q(
    "q24",
    "Zooplankton memakan fitoplankton. Zooplankton termasuk ...",
    [
      "konsumen tingkat I",
      "produsen",
      "konsumen puncak",
      "pengurai",
    ],
    0,
    "Zooplankton memakan produsen, sehingga termasuk konsumen tingkat I.",
    "laut",
    "sedang",
  ),
  q(
    "q25",
    "Hiu pada rantai makanan laut berperan sebagai ...",
    ["konsumen puncak", "produsen", "konsumen tingkat I", "pengurai"],
    0,
    "Hiu berada di ujung rantai makanan laut pada contoh ini.",
    "laut",
    "mudah",
  ),
  q(
    "q26",
    "Perubahan populasi satu makhluk hidup dapat memengaruhi ...",
    [
      "seluruh bagian jaring-jaring makanan",
      "hanya dirinya sendiri",
      "hanya tumbuhan di sekitarnya",
      "hanya manusia",
    ],
    0,
    "Jaring-jaring makanan saling terhubung, sehingga dampaknya dapat menyebar.",
    "populasi",
    "sedang",
  ),
  q(
    "q27",
    "Jika katak banyak ditangkap manusia, populasi belalang cenderung ...",
    ["meningkat", "menurun", "tetap", "berhenti berkembang"],
    0,
    "Katak adalah predator belalang. Berkurangnya predator membuat belalang lebih banyak.",
    "populasi",
    "sedang",
  ),
  q(
    "q28",
    "Keseimbangan ekosistem dapat terganggu jika ...",
    [
      "salah satu komponen hilang atau populasinya berubah drastis",
      "produsen tumbuh dengan normal",
      "pengurai menguraikan sisa organisme",
      "setiap organisme mendapat energi",
    ],
    0,
    "Hilangnya komponen atau perubahan populasi yang ekstrem mengganggu aliran energi dan keseimbangan.",
    "keseimbangan",
    "sedang",
  ),
  q(
    "q29",
    "Tindakan yang menjaga keseimbangan ekosistem adalah ...",
    [
      "tidak memburu hewan langka dan menjaga habitat",
      "menangkap semua katak di sawah",
      "menebang seluruh pohon di hutan",
      "membuang sampah ke laut",
    ],
    0,
    "Menjaga habitat dan tidak memburu hewan langka membantu mempertahankan keseimbangan.",
    "keseimbangan",
    "mudah",
  ),
  q(
    "q30",
    "Mengapa pengurai penting bagi keseimbangan ekosistem?",
    [
      "Mengembalikan unsur hara sehingga produsen dapat tumbuh",
      "Menjadi sumber cahaya bagi tumbuhan",
      "Memakan semua konsumen puncak",
      "Mengubah air menjadi energi",
    ],
    0,
    "Unsur hara hasil penguraian dibutuhkan produsen untuk tumbuh dan memulai rantai makanan lagi.",
    "keseimbangan",
    "sulit",
  ),
  q(
    "q31",
    "Jaring-jaring makanan adalah ...",
    [
      "kumpulan rantai makanan yang saling berhubungan",
      "satu rantai makanan yang paling panjang",
      "daftar hewan yang dilindungi",
      "proses penguraian sisa organisme",
    ],
    0,
    "Jaring-jaring makanan menghubungkan beberapa rantai makanan dalam satu ekosistem.",
    "definisi",
    "sedang",
  ),
  q(
    "q32",
    "Perhatikan rantai makanan sawah: Padi → Tikus → Ular → Elang. Tikus termasuk ...",
    [
      "konsumen tingkat I",
      "produsen",
      "konsumen puncak",
      "pengurai",
    ],
    0,
    "Tikus memakan padi (produsen), sehingga tikus adalah konsumen tingkat I.",
    "sawah",
    "sedang",
  ),
];

/**
 * The seed items above are authored with the key in position A so they are easy
 * to review. A duel where every answer is the first button is not a game, so
 * the bank rotates each item's options by a shift derived from its id.
 *
 * `supabase/migrations/20261114000000_eco_init.sql` stores the rotated order so
 * room-code play asks the same question with the same option positions.
 */
export function seedShift(id: string): number {
  const digits = id.replace(/\D/g, "");
  const value = digits ? Number.parseInt(digits, 10) : 0;
  return value % 4;
}

export function rotateOptions(
  question: EcoQuestion,
  shift: number,
): EcoQuestion {
  const step = ((shift % 4) + 4) % 4;
  if (step === 0) return { ...question, options: [...question.options] };
  const options = question.options;
  const rotated: QuestionOptions = [
    options[step % 4],
    options[(step + 1) % 4],
    options[(step + 2) % 4],
    options[(step + 3) % 4],
  ];
  const correctIndex = (((question.correctIndex - step) % 4) + 4) % 4;
  return {
    ...question,
    options: rotated,
    correctIndex: correctIndex as EcoQuestion["correctIndex"],
  };
}

export function applySeedRotation(question: EcoQuestion): EcoQuestion {
  return rotateOptions(question, seedShift(question.id));
}

export function toPublicQuestion(question: EcoQuestion): PublicQuestion {
  return {
    id: question.id,
    text: question.text,
    options: question.options,
    category: question.category,
    difficulty: question.difficulty,
  };
}

export function isUsableQuestion(question: EcoQuestion): boolean {
  return question.active && question.reviewed;
}
