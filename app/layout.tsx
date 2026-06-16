import type { Metadata } from "next";
import { Noto_Sans_JP, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { FavoritesProvider } from "./_components/useFavorites";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getFavoriteSpaceIds } from "@/lib/repositories/favoriteRepository";

// Body — practical & soft. JP-first, Latin glyphs included.
const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// Headings — Zen Kaku Gothic New (geometric, confident).
const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Zenith Lumina | スペースレンタル",
  description: "創造性を解き放つ静かな仕事空間。",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const guest = await getCurrentGuest();
  const favoriteIds = guest ? await getFavoriteSpaceIds(guest.userId) : [];

  return (
    <html
      lang="ja"
      className={`${notoSansJP.variable} ${zenKaku.variable} h-full antialiased`}
    >
      <head>
        {/* Material Symbols icon font, used by the Zenith Lumina UI primitives */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-on-surface">
        <FavoritesProvider initialIds={favoriteIds}>
          {children}
        </FavoritesProvider>
      </body>
    </html>
  );
}
