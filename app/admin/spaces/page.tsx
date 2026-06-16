import { getSpaces } from "@/lib/repositories/spaceRepository";
import { toUISpace } from "@/lib/mappers/space";
import { AdminSpacesClient } from "./AdminSpacesClient";

export const dynamic = "force-dynamic";

export default async function AdminSpacesPage() {
  const spaces = (await getSpaces()).map(toUISpace);
  return <AdminSpacesClient spaces={spaces} />;
}
