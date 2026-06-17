import { FavoritesProvider } from "../_components/useFavorites";
import {
  countPublishedSpaces,
  getPublishedSpaces,
} from "@/lib/repositories/spaceRepository";
import { toUISpace } from "@/lib/mappers/space";
import { SpacesClient } from "./SpacesClient";

export const revalidate = 300;
const PAGE_SIZE = 12;

export default async function SpacesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;
  // Public feed shows published spaces only (synced with the host publish toggle).
  const [rows, total] = await Promise.all([
    getPublishedSpaces({ skip, take: PAGE_SIZE }),
    countPublishedSpaces(),
  ]);
  const spaces = rows.map(toUISpace);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return (
    <FavoritesProvider syncOnMount>
      <SpacesClient
        initialSpaces={spaces}
        page={page}
        total={total}
        totalPages={totalPages}
      />
    </FavoritesProvider>
  );
}
