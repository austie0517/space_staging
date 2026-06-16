"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Icon } from "../../_components/ui";
import { GuestNav } from "../../_components/GuestNav";
import { useFavorites } from "../../_components/useFavorites";
import type { Space } from "@/types";

export function FavoritesClient({
  initialFavorites,
}: {
  initialFavorites: Space[];
}) {
  const router = useRouter();
  const { ids, toggle } = useFavorites();

  // Show server-loaded favorites, minus any removed this session (optimistic).
  const favorites = initialFavorites.filter((s) => ids.includes(s.id));

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 bg-surface/80 px-3 backdrop-blur-md md:top-14">
        <button
          onClick={() => router.push("/me")}
          aria-label="戻る"
          className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface hover:bg-surface-low"
        >
          <Icon name="arrow_back" />
        </button>
        <h1 className="font-display text-xl text-on-surface">お気に入り</h1>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        {favorites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Icon
              name="favorite_border"
              className="text-[36px] text-on-surface-variant/50"
            />
            <p className="text-sm text-on-surface-variant">
              まだお気に入りはありません。
              <br />
              気になるスペースのハートを押すとここに保存されます。
            </p>
            <Link href="/spaces" className="text-sm font-semibold text-primary hover:underline">
              スペースを探す →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {favorites.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-3"
              >
                <Link href={`/spaces/${s.id}`} className="flex flex-1 items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.images[0]}
                    alt={s.title}
                    className="h-16 w-20 flex-none rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-on-surface">{s.title}</p>
                    <p className="truncate text-sm text-on-surface-variant">{s.area}</p>
                    <p className="text-sm font-semibold text-primary">
                      ¥{s.pricePerHour.toLocaleString()}/時
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => toggle(s.id)}
                  aria-label="お気に入りから削除"
                  className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-error hover:bg-error-container/40"
                >
                  <Icon name="favorite" filled />
                </button>
              </div>
            ))}
          </div>
        )}

        {favorites.length > 0 && (
          <Button
            variant="secondary"
            fullWidth
            className="mt-5"
            onClick={() => router.push("/spaces")}
          >
            <Icon name="search" className="text-[18px]" /> もっと探す
          </Button>
        )}
      </main>

      <GuestNav />
    </div>
  );
}
