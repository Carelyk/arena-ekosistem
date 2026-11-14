import type { EcosystemChain, EcosystemId } from "@/lib/types";

export const ECOSYSTEMS: EcosystemChain[] = [
  {
    id: "sawah",
    name: "Sawah",
    emoji: "🌾",
    summary:
      "Ekosistem buatan tempat padi menjadi produsen utama. Energi mengalir dari padi ke belalang, katak, ular, lalu elang.",
    steps: [
      {
        id: "padi",
        label: "Padi",
        emoji: "🌾",
        role: "produsen",
        note: "Produsen. Menyerap cahaya Matahari untuk membuat makanan.",
      },
      {
        id: "belalang",
        label: "Belalang",
        emoji: "🦗",
        role: "konsumen1",
        note: "Konsumen tingkat I. Memakan padi.",
      },
      {
        id: "katak",
        label: "Katak",
        emoji: "🐸",
        role: "konsumen2",
        note: "Konsumen tingkat II. Memakan belalang.",
      },
      {
        id: "ular",
        label: "Ular",
        emoji: "🐍",
        role: "konsumen3",
        note: "Konsumen tingkat III. Memakan katak.",
      },
      {
        id: "elang",
        label: "Elang",
        emoji: "🦅",
        role: "puncak",
        note: "Konsumen puncak. Memakan ular.",
      },
    ],
    decomposer: {
      id: "jamur-sawah",
      label: "Jamur & bakteri",
      emoji: "🍄",
      role: "pengurai",
      note: "Menguraikan sisa padi, belalang, katak, ular, dan elang.",
    },
    decomposerNote:
      "Pengurai menguraikan sisa organisme dari semua tingkat, lalu mengembalikan unsur hara ke tanah sawah.",
  },
  {
    id: "hutan",
    name: "Hutan",
    emoji: "🌳",
    summary:
      "Ekosistem alami dengan banyak produsen. Pada contoh ini energi mengalir dari daun ke ulat, burung pemakan serangga, lalu elang.",
    steps: [
      {
        id: "daun",
        label: "Tumbuhan/Daun",
        emoji: "🍃",
        role: "produsen",
        note: "Produsen. Daun berfotosintesis dan menjadi sumber makanan.",
      },
      {
        id: "ulat",
        label: "Ulat",
        emoji: "🐛",
        role: "konsumen1",
        note: "Konsumen tingkat I. Memakan daun.",
      },
      {
        id: "burung",
        label: "Burung Pemakan Serangga",
        emoji: "🐦",
        role: "konsumen2",
        note: "Konsumen tingkat II. Memakan ulat.",
      },
      {
        id: "elang-hutan",
        label: "Elang",
        emoji: "🦅",
        role: "puncak",
        note: "Konsumen puncak. Memakan burung pemakan serangga.",
      },
    ],
    decomposer: {
      id: "jamur-hutan",
      label: "Jamur & bakteri",
      emoji: "🍄",
      role: "pengurai",
      note: "Menguraikan sisa daun, ulat, burung, dan elang.",
    },
    decomposerNote:
      "Daun gugur dan sisa hewan diuraikan pengurai. Unsur hara kembali ke tanah hutan dan dipakai tumbuhan lagi.",
  },
  {
    id: "laut",
    name: "Laut",
    emoji: "🌊",
    summary:
      "Ekosistem perairan dengan fitoplankton sebagai produsen utama. Energi mengalir ke zooplankton, ikan kecil, ikan besar, lalu hiu.",
    steps: [
      {
        id: "fitoplankton",
        label: "Fitoplankton",
        emoji: "🌿",
        role: "produsen",
        note: "Produsen. Berfotosintesis di permukaan air yang terkena cahaya.",
      },
      {
        id: "zooplankton",
        label: "Zooplankton",
        emoji: "🦐",
        role: "konsumen1",
        note: "Konsumen tingkat I. Memakan fitoplankton.",
      },
      {
        id: "ikan-kecil",
        label: "Ikan Kecil",
        emoji: "🐟",
        role: "konsumen2",
        note: "Konsumen tingkat II. Memakan zooplankton.",
      },
      {
        id: "ikan-besar",
        label: "Ikan Besar",
        emoji: "🐠",
        role: "konsumen3",
        note: "Konsumen tingkat III. Memakan ikan kecil.",
      },
      {
        id: "hiu",
        label: "Hiu",
        emoji: "🦈",
        role: "puncak",
        note: "Konsumen puncak. Memakan ikan besar.",
      },
    ],
    decomposer: {
      id: "bakteri-laut",
      label: "Bakteri pengurai",
      emoji: "🦠",
      role: "pengurai",
      note: "Menguraikan sisa fitoplankton sampai hiu di dasar perairan.",
    },
    decomposerNote:
      "Di laut, bakteri pengurai menguraikan sisa organisme dari semua tingkat dan mengembalikan zat hara ke air.",
  },
];

export const ECOSYSTEM_MAP: Record<EcosystemId, EcosystemChain> = {
  sawah: ECOSYSTEMS[0],
  hutan: ECOSYSTEMS[1],
  laut: ECOSYSTEMS[2],
};

export function getEcosystem(id: EcosystemId): EcosystemChain {
  return ECOSYSTEM_MAP[id];
}
