import { getCurrentGuestFavoriteSpaceIds } from "@/lib/repositories/favoriteRepository";

export async function GET() {
  const ids = await getCurrentGuestFavoriteSpaceIds();
  return Response.json(
    { ids },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
