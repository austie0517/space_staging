import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getLatestKyc } from "@/lib/repositories/kycRepository";
import { sampleGuest } from "@/mock";
import type { KycStatus } from "@/types";
import { MeClient } from "./MeClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function MyPage() {
  const guest = await getCurrentGuest();
  const profile = {
    name: guest?.user.name ?? sampleGuest.name,
    email: guest?.user.email ?? sampleGuest.email,
    phone: guest?.user.phone ?? "",
    profession: guest?.profession ?? sampleGuest.profession,
    license: guest?.license ?? sampleGuest.license,
    avatarUrl: guest?.user.avatarUrl ?? "",
  };
  const kyc = guest ? await getLatestKyc(guest.userId) : null;
  const kycStatus = (kyc?.status as KycStatus) ?? "unsubmitted";

  return <MeClient profile={profile} kycStatus={kycStatus} />;
}
