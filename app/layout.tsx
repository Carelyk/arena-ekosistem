import type { Metadata } from "next";
import { Fredoka, Nunito } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/components/audio/AudioProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Arena Ekosistem · Harmoni dalam Ekosistem",
    template: "%s · Arena Ekosistem",
  },
  description:
    "Media pembelajaran dan permainan IPAS kelas 6 tentang rantai makanan, aliran energi, dan keseimbangan ekosistem.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      data-scroll-behavior="smooth"
      className={`${fredoka.variable} ${nunito.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans text-ink">
        <a
          href="#konten"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:border-[3px] focus:border-ink focus:bg-sun focus:px-4 focus:py-3 focus:font-bold focus:text-ink"
        >
          Lompat ke konten utama
        </a>
        <AudioProvider>
          <SiteHeader />
          <main id="konten" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </AudioProvider>
      </body>
    </html>
  );
}
