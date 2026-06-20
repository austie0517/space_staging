import { getCurrentGuestFavoriteSpaceIds } from "@/lib/repositories/favoriteRepository";
import { measure } from "@/lib/perf";

export async function GET() {
  const ids = await measure("/api/favorites data", () => getCurrentGuestFavoriteSpaceIds());
  return Response.json(
    { ids },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
