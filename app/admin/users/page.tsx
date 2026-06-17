import { AdminPagination } from "../_components/AdminPagination";
import { countAllUsers, getAllUsers } from "@/lib/repositories/adminRepository";
import { toAdminUser } from "@/lib/mappers/admin";
import { AdminUsersClient } from "./AdminUsersClient";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const [rows, total] = await Promise.all([
    getAllUsers({ skip, take: PAGE_SIZE }),
    countAllUsers(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const users = rows.map(toAdminUser);

  return (
    <>
      <AdminUsersClient users={users} total={total} page={page} pageSize={PAGE_SIZE} />
      <AdminPagination pathname="/admin/users" page={page} totalPages={totalPages} />
    </>
  );
}
