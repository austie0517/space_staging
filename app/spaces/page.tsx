import { FavoritesProvider } from "../_components/useFavorites";
import { getPublishedSpaceFeed } from "@/lib/repositories/spaceRepository";
import { measure } from "@/lib/perf";
import { SpacesClient } from "./SpacesClient";

export const revalidate = 300;
const PAGE_SIZE = 12;

export default async function SpacesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return measure("/spaces", async () => {
    const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
    const skip = (page - 1) * PAGE_SIZE;
    const spaces = await measure("getPublishedSpaceFeed", () =>
      getPublishedSpaceFeed({ skip, take: PAGE_SIZE + 1 }),
    );
    const hasNext = spaces.length > PAGE_SIZE;
    return (
      <FavoritesProvider syncOnMount>
        <SpacesClient
          initialSpaces={spaces.slice(0, PAGE_SIZE)}
          page={page}
          hasNext={hasNext}
        />
      </FavoritesProvider>
    );
  });
}
