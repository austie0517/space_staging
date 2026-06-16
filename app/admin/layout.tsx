import { AdminProvider } from "./AdminContext";
import {
  getHostApplications,
  getGuestApplications,
  getAllKyc,
} from "@/lib/repositories/adminRepository";
import {
  hostAppToUI,
  guestAppToUI,
  toUIKycSubmission,
} from "@/lib/mappers/admin";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

/** Wraps every /admin route in the shared admin state provider, seeded from DB. */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hostApps, guestApps, kyc] = await Promise.all([
    getHostApplications(),
    getGuestApplications(),
    getAllKyc(),
  ]);

  const applications = [
    ...hostApps.map(hostAppToUI),
    ...guestApps.map(guestAppToUI),
  ];
  const kycSubmissions = kyc.map(toUIKycSubmission);

  return (
    <AdminProvider initialApplications={applications} initialKyc={kycSubmissions}>
      {children}
    </AdminProvider>
  );
}
