import type { OptionIndex } from "@/lib/types";

export type OrganismRole =
  | "produsen"
  | "konsumen1"
  | "konsumen2"
  | "puncak"
  | "pengurai";

export interface OrganismCard {
  id: OrganismRole;
  name: string;
  emoji: string;
  tagline: string;
  summary: string;
  examples: string[];
  facts: string[];
  colorClass: string;
  softClass: string;
  borderClass: string;
  textClass: string;
}

export const ORGANISM_CARDS: OrganismCard[] = [
  {
    id: "produsen",
    name: "Produsen",
    emoji: "🌿",
    tagline: "Pembuat makanan",
    summary:
      "Produsen membuat makanan sendiri melalui fotosintesis. Mereka menangkap cahaya Matahari, mengambil air dari tanah, dan karbon dioksida dari udara untuk membuat karbohidrat.",
    examples: ["rumput", "padi", "pohon", "ganggang", "fitoplankton"],
    facts: [
      "Tumbuhan tidak menciptakan energi. Mereka mengubah energi cahaya Matahari menjadi energi kimia di dalam makanan.",
      "Fotosintesis juga menghasilkan oksigen yang kita hirup.",
    ],
    colorClass: "bg-[#5DAE6E]",
    softClass: "bg-[#E4F3E2]",
    borderClass: "border-[#2F7A45]",
    textClass: "text-[#1F5C33]",
  },
  {
    id: "konsumen1",
    name: "Konsumen Tingkat I",
    emoji: "🦗",
    tagline: "Pemakan tumbuhan",
    summary:
      "Konsumen tingkat I memakan produsen atau tumbuhan. Mereka memperoleh energi dari makanan yang dibuat tumbuhan.",
    examples: ["belalang", "kelinci", "ulat", "sapi", "tikus"],
    facts: [
      "Hewan pemakan tumbuhan disebut herbivora.",
      "Energi yang mereka dapat berasal dari Matahari, tetapi sudah diolah oleh tumbuhan.",
    ],
    colorClass: "bg-[#F2C445]",
    softClass: "bg-[#FBF0C9]",
    borderClass: "border-[#B98A0E]",
    textClass: "text-[#7A5A05]",
  },
  {
    id: "konsumen2",
    name: "Konsumen Tingkat II",
    emoji: "🐸",
    tagline: "Pemakan konsumen I",
    summary:
      "Konsumen tingkat II memakan konsumen tingkat I. Mereka adalah hewan pemakan daging atau pemakan serangga.",
    examples: ["katak", "burung pemakan serangga", "ular pada rantai tertentu"],
    facts: [
      "Katak dewasa memakan serangga, sedangkan kecebongnya memakan tumbuhan air.",
      "Satu hewan bisa berada di tingkat berbeda pada rantai makanan yang berbeda.",
    ],
    colorClass: "bg-[#5B9BD5]",
    softClass: "bg-[#E0EDF9]",
    borderClass: "border-[#2B6CA3]",
    textClass: "text-[#1F4F78]",
  },
  {
    id: "puncak",
    name: "Konsumen Puncak",
    emoji: "🦅",
    tagline: "Tingkat trofik tertinggi",
    summary:
      "Konsumen puncak berada pada tingkat trofik paling tinggi dalam contoh rantai makanan. Mereka tidak atau jarang dimangsa oleh hewan lain di ekosistem itu.",
    examples: ["elang", "harimau", "buaya", "hiu"],
    facts: [
      "Konsumen puncak tetap mendapat energi paling sedikit karena energi berkurang di setiap tingkat.",
      "Jika konsumen puncak hilang, populasi mangsa di bawahnya dapat meningkat pesat.",
    ],
    colorClass: "bg-[#9B7BD4]",
    softClass: "bg-[#EEE7FA]",
    borderClass: "border-[#6A4DA3]",
    textClass: "text-[#4C3577]",
  },
  {
    id: "pengurai",
    name: "Pengurai",
    emoji: "🍄",
    tagline: "Pengembali unsur hara",
    summary:
      "Pengurai menguraikan sisa organisme dan mengembalikan unsur hara ke lingkungan. Jamur dan bakteri bekerja pada sisa tubuh dari semua tingkat trofik, bukan hanya hewan terakhir.",
    examples: ["jamur", "bakteri"],
    facts: [
      "Pengurai menutup alur materi sehingga unsur hara dapat dipakai tumbuhan lagi.",
      "Tanpa pengurai, sisa makhluk hidup akan menumpuk dan unsur hara tidak kembali ke tanah.",
    ],
    colorClass: "bg-[#E986A8]",
    softClass: "bg-[#FBE4EC]",
    borderClass: "border-[#B4567A]",
    textClass: "text-[#863A58]",
  },
];

export interface EnergyStep {
  id: string;
  label: string;
  emoji: string;
  note: string;
  role: OrganismRole | "matahari";
}

export const ENERGY_FLOW: EnergyStep[] = [
  {
    id: "matahari",
    label: "Matahari",
    emoji: "☀️",
    note: "Sumber energi utama. Cahayanya ditangkap produsen.",
    role: "matahari",
  },
  {
    id: "rumput",
    label: "Rumput",
    emoji: "🌿",
    note: "Produsen. Membuat makanan melalui fotosintesis.",
    role: "produsen",
  },
  {
    id: "belalang",
    label: "Belalang",
    emoji: "🦗",
    note: "Konsumen tingkat I. Memakan rumput.",
    role: "konsumen1",
  },
  {
    id: "katak",
    label: "Katak",
    emoji: "🐸",
    note: "Konsumen tingkat II. Memakan belalang.",
    role: "konsumen2",
  },
  {
    id: "ular",
    label: "Ular",
    emoji: "🐍",
    note: "Konsumen tingkat III pada contoh ini. Memakan katak.",
    role: "konsumen2",
  },
  {
    id: "elang",
    label: "Elang",
    emoji: "🦅",
    note: "Konsumen puncak. Memakan ular.",
    role: "puncak",
  },
];

export const ENERGY_FLOW_NOTE =
  "Arah panah menunjukkan perpindahan energi dari organisme yang dimakan menuju organisme pemakan. Energi tidak hilang seluruhnya, tetapi sebagian berubah menjadi panas dan dipakai untuk bergerak, tumbuh, serta berkembang biak.";

export const DECOMPOSER_NOTE =
  "Pengurai dapat menguraikan sisa organisme dari setiap tingkat trofik: daun gugur dari produsen, bangkai belalang, sisa katak, sampai sisa elang. Hasil penguraian berupa unsur hara yang kembali ke tanah atau air dan dapat dipakai produsen lagi.";

export interface FunFact {
  title: string;
  body: string;
  emoji: string;
}

export const FUN_FACTS: FunFact[] = [
  {
    title: "Populasi bisa naik atau turun",
    body: "Jika katak berkurang, belalang dapat meningkat karena predatornya berkurang. Padi pun bisa makin banyak dimakan belalang.",
    emoji: "📈",
  },
  {
    title: "Keseimbangan bisa terganggu",
    body: "Hilangnya satu komponen membuat aliran energi berubah. Ekosistem perlu waktu lama untuk kembali seimbang.",
    emoji: "⚖️",
  },
  {
    title: "Dampaknya menyebar",
    body: "Satu perubahan dapat terasa di seluruh jaring-jaring makanan karena banyak rantai makanan saling terhubung.",
    emoji: "🕸️",
  },
];

export interface CheckpointQuestion {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: OptionIndex;
  explanation: string;
}

export const CHECKPOINT_QUESTIONS: CheckpointQuestion[] = [
  {
    id: "cp1",
    text: "Siapa yang menjadi awal rantai makanan pada contoh Matahari → Rumput → Belalang?",
    options: ["Rumput", "Belalang", "Matahari", "Pengurai"],
    correctIndex: 0,
    explanation:
      "Rumput adalah produsen yang memanfaatkan energi cahaya Matahari melalui fotosintesis.",
  },
  {
    id: "cp2",
    text: "Arah panah pada rantai makanan menunjukkan ...",
    options: [
      "hewan yang lebih kuat",
      "perpindahan energi ke organisme pemakan",
      "urutan hewan dari kecil ke besar",
      "jumlah populasi di ekosistem",
    ],
    correctIndex: 1,
    explanation:
      "Panah menunjuk ke organisme pemakan, tempat energi berpindah dari makanan yang dimakan.",
  },
  {
    id: "cp3",
    text: "Pengurai bekerja pada ...",
    options: [
      "hanya sisa konsumen puncak",
      "hanya tumbuhan yang masih hidup",
      "sisa organisme dari semua tingkat trofik",
      "hanya bangkai hewan besar",
    ],
    correctIndex: 2,
    explanation:
      "Sisa organisme dari produsen sampai konsumen puncak dapat diuraikan oleh jamur dan bakteri.",
  },
  {
    id: "cp4",
    text: "Jika ular di sawah banyak diburu, apa yang mungkin terjadi?",
    options: [
      "Populasi katak meningkat dan populasi belalang menurun",
      "Semua populasi bertambah",
      "Padi berubah menjadi konsumen",
      "Tidak ada perubahan pada ekosistem",
    ],
    correctIndex: 0,
    explanation:
      "Ular adalah predator katak. Berkurangnya ular membuat katak meningkat, sehingga belalang lebih banyak dimakan.",
  },
  {
    id: "cp5",
    text: "Mengapa tumbuhan disebut produsen, bukan pencipta energi?",
    options: [
      "Karena tumbuhan membuat energi dari tanah",
      "Karena tumbuhan mengubah energi cahaya menjadi energi kimia dalam makanan",
      "Karena tumbuhan memakan serangga",
      "Karena tumbuhan tidak membutuhkan Matahari",
    ],
    correctIndex: 1,
    explanation:
      "Energi tidak diciptakan. Tumbuhan mengubah energi cahaya Matahari menjadi energi kimia melalui fotosintesis.",
  },
];

export const CONCLUSION_POINTS = [
  "Energi mengalir melalui hubungan makan dan dimakan.",
  "Produsen menjadi dasar rantai makanan.",
  "Konsumen memperoleh energi dengan memakan organisme lain.",
  "Pengurai mengembalikan unsur hara ke lingkungan.",
  "Semua komponen saling memengaruhi.",
  "Kehilangan satu komponen dapat mengganggu keseimbangan ekosistem.",
];
