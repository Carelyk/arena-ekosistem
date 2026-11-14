import type { Metadata } from "next";
import { DuelGame } from "@/components/games/duel/DuelGame";

export const metadata: Metadata = {
  title: "Duel Ekosistem",
  description:
    "Duel kuis rantai makanan 1 vs 1 dengan bonus tercepat, pembekuan dua detik, dan tali tambang energi.",
};

export default function ArenaPage() {
  return <DuelGame />;
}
