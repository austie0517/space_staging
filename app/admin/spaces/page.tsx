import { AdminPagination } from "../_components/AdminPagination";
import { countAllSpaces, getSpaces } from "@/lib/repositories/spaceRepository";
import { toUISpace } from "@/lib/mappers/space";
import { AdminSpacesClient } from "./AdminSpacesClient";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

export default async function AdminSpacesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const [rows, total] = await Promise.all([
    getSpaces({ skip, take: PAGE_SIZE }),
    countAllSpaces(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const spaces = rows.map(toUISpace);

  return (
    <>
      <AdminSpacesClient spaces={spaces} total={total} page={page} pageSize={PAGE_SIZE} />
      <AdminPagination pathname="/admin/spaces" page={page} totalPages={totalPages} />
    </>
  );
}
