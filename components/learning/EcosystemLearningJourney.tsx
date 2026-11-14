"use client";

import { useState } from "react";
import { EcosystemExplorer } from "@/components/learning/EcosystemExplorer";
import { EnergyFlow } from "@/components/learning/EnergyFlow";
import { getEcosystem } from "@/lib/data/ecosystems";
import type { EcosystemId } from "@/lib/types";

export function EcosystemLearningJourney() {
  const [ecosystem, setEcosystem] = useState<EcosystemId>("sawah");
  const current = getEcosystem(ecosystem);
  const chainTitle = current.steps.map((step) => step.label).join(" → ");

  return (
    <>
      <section aria-labelledby="ekosistem-heading" id="ekosistem">
        <EcosystemExplorer
          activeEcosystem={ecosystem}
          onEcosystemChange={setEcosystem}
        />
      </section>

      <section aria-labelledby="aliran-heading" id="aliran">
        <div className="mb-5">
          <p className="text-xs font-extrabold uppercase tracking-widest text-konsumen2-deep">
            Aliran energi · Ekosistem {current.name}
          </p>
          <h2
            id="aliran-heading"
            className="font-display text-3xl font-semibold text-ink sm:text-4xl"
          >
            {chainTitle}
          </h2>
          <p className="mt-2 text-sm font-semibold text-ink-soft">
            Simulasi ini mengikuti ekosistem yang kamu pilih pada bagian jelajah.
          </p>
        </div>
        <EnergyFlow key={ecosystem} ecosystemId={ecosystem} />
      </section>
    </>
  );
}
