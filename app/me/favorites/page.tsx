import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getFavoriteSpaces } from "@/lib/repositories/favoriteRepository";
import { toUISpace } from "@/lib/mappers/space";
import { FavoritesClient } from "./FavoritesClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const guest = await getCurrentGuest();
  const favorites = guest
    ? (await getFavoriteSpaces(guest.userId)).map(toUISpace)
    : [];

  return <FavoritesClient initialFavorites={favorites} />;
}
