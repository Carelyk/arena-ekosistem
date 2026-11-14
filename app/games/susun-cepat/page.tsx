import type { Metadata } from "next";
import { SusunGame } from "@/components/games/susun/SusunGame";

export const metadata: Metadata = {
  title: "Susun Cepat Rantai Makanan",
  description:
    "Susun rantai makanan ekosistem sawah, hutan, dan laut dengan drag and drop untuk dua pemain.",
};

export default function SusunCepatPage() {
  return <SusunGame />;
}
