import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getLatestKyc } from "@/lib/repositories/kycRepository";
import type { KycStatus } from "@/types";
import { VerifyClient } from "./VerifyClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function VerifyPage() {
  const guest = await getCurrentGuest();
  const kyc = guest ? await getLatestKyc(guest.userId) : null;
  const initialStatus = (kyc?.status as KycStatus) ?? "unsubmitted";

  return <VerifyClient initialStatus={initialStatus} />;
}
