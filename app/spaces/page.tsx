import {
  getPublishedSpaces,
  getSpaceResourceMetas,
} from "@/lib/repositories/spaceRepository";
import { toUISpace } from "@/lib/mappers/space";
import { SpacesClient } from "./SpacesClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function SpacesPage() {
  // Public feed shows published spaces only (synced with the host publish toggle).
  const rows = await getPublishedSpaces();
  const meta = await getSpaceResourceMetas(rows.map((row) => row.id));
  const spaces = rows.map((row) => {
    const space = toUISpace(row);
    const resource = meta.get(row.id);
    space.resourceCategory = resource?.resourceCategory ?? "venue";
    space.capacityUnit = resource?.capacityUnit ?? "person";
    return space;
  });
  return <SpacesClient initialSpaces={spaces} />;
}
