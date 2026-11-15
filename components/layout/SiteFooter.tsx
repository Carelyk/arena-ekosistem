import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-[3px] border-ink/10 bg-paper/70">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-8 text-center text-sm font-semibold text-ink-soft sm:flex-row sm:justify-between sm:text-left">
        <div>
          <p>Media pembelajaran IPAS Kelas 6 · Harmoni dalam Ekosistem</p>
          <p className="mt-1 text-xs font-extrabold text-ink/75">
            Dirancang oleh:{" "}
            <span className="text-produsen-deep">Zefanya Rizqita Siathen</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <Link href="/guru" className="underline decoration-2 underline-offset-4 hover:text-ink">
            Panel guru
          </Link>
          <Link href="/juara" className="underline decoration-2 underline-offset-4 hover:text-ink">
            Papan juara
          </Link>
        </div>
      </div>
    </footer>
  );
}
