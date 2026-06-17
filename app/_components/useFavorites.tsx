"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  useTransition,
} from "react";
import { toggleFavoriteAction } from "@/app/_actions/favorites";

/**
 * Favorites store backed by the DB (favorites table). Seeded server-side via
 * <FavoritesProvider initialIds={...}> in the root layout; `toggle` updates
 * optimistically and persists through a server action. The public API
 * (ids / isFavorite / toggle) is unchanged from the old localStorage version.
 */
type FavoritesValue = {
  ids: string[];
  isFavorite: (id: string) => boolean;
  toggle: (id: string) => void;
};

const FavoritesContext = createContext<FavoritesValue | null>(null);

export function FavoritesProvider({
  initialIds = [],
  syncOnMount = false,
  children,
}: {
  initialIds?: string[];
  syncOnMount?: boolean;
  children: React.ReactNode;
}) {
  const [ids, setIds] = useState<string[]>(initialIds);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!syncOnMount) return;
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/favorites", {
          credentials: "same-origin",
        });
        if (!res.ok) return;
        const data = (await res.json()) as { ids?: string[] };
        if (!cancelled) setIds(data.ids ?? []);
      } catch (e) {
        console.error("[favorites:hydrate] failed:", e);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [syncOnMount]);

  const flip = (id: string) =>
    setIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggle = useCallback((id: string) => {
    flip(id); // optimistic
    startTransition(async () => {
      const res = await toggleFavoriteAction(id);
      if (!res.ok) flip(id); // revert on failure
    });
  }, []);

  return (
    <FavoritesContext.Provider
      value={{ ids, isFavorite: (id) => ids.includes(id), toggle }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesValue {
  const ctx = useContext(FavoritesContext);
  // Safe fallback if a tree renders outside the provider.
  if (!ctx) return { ids: [], isFavorite: () => false, toggle: () => {} };
  return ctx;
}
