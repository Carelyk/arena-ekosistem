"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Gamepad2, Trophy, Leaf, GraduationCap } from "lucide-react";
import { AudioSettings } from "@/components/audio/AudioSettings";

const NAV_ITEMS = [
  { href: "/belajar", label: "Belajar Materi", icon: BookOpen },
  { href: "/games", label: "Arena Games & Duel", icon: Gamepad2 },
  { href: "/juara", label: "Papan Juara", icon: Trophy },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/games") return pathname.startsWith("/games") || pathname.startsWith("/arena");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink/10 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 rounded-xl font-display text-lg font-semibold tracking-tight text-ink sm:text-xl"
        >
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-2xl border-[3px] border-ink bg-produsen-soft text-xl"
          >
            <Leaf className="h-5 w-5 text-produsen-deep" />
          </span>
          <span>Arena Ekosistem</span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/guru"
            aria-label="Panel guru"
            title="Panel guru"
            className={`sticker sticker-press flex h-11 w-11 items-center justify-center rounded-2xl ${
              pathname.startsWith("/guru") ? "bg-sun text-ink" : "bg-white text-ink"
            }`}
          >
            <GraduationCap aria-hidden className="h-5 w-5" />
          </Link>
          <AudioSettings />
        </div>

        <nav
          aria-label="Navigasi utama"
          className="order-3 -mx-1 w-full sm:order-2 sm:mx-0 sm:w-auto sm:flex-1"
        >
          <ul className="no-scrollbar flex items-center gap-1.5 overflow-x-auto px-1 pb-0.5 sm:justify-center">
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`sticker sticker-press flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-extrabold whitespace-nowrap ${
                      active
                        ? "bg-sun text-ink"
                        : "border-ink/20 bg-white text-ink-soft shadow-none hover:text-ink"
                    }`}
                  >
                    <Icon aria-hidden className="h-4 w-4" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
