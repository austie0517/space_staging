import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getFavoriteSpaceIds } from "@/lib/repositories/favoriteRepository";

export async function GET() {
  const guest = await getCurrentGuest();
  if (!guest) return Response.json({ ids: [] });

  const ids = await getFavoriteSpaceIds(guest.userId);
  return Response.json({ ids });
}

