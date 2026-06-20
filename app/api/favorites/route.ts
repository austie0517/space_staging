import { getCurrentGuestUserId } from "@/lib/repositories/guestRepository";
import { getFavoriteSpaceIds } from "@/lib/repositories/favoriteRepository";

export async function GET() {
  const userId = await getCurrentGuestUserId();
  if (!userId) {
    return Response.json(
      { ids: [] },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
    );
  }

  const ids = await getFavoriteSpaceIds(userId);
  return Response.json(
    { ids },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
