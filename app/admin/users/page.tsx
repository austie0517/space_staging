import { getAllUsers } from "@/lib/repositories/adminRepository";
import { toAdminUser } from "@/lib/mappers/admin";
import { AdminUsersClient } from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const users = (await getAllUsers()).map(toAdminUser);
  return <AdminUsersClient users={users} />;
}
