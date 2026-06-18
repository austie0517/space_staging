import { getCurrentHostWithAddress } from "@/lib/repositories/hostRepository";
import { sampleHost } from "@/mock/users";
import { HostProfileForm } from "./HostProfileForm";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostProfileEditPage() {
  const host = await getCurrentHostWithAddress();
  const initial = {
    name: host?.user.name ?? sampleHost.name,
    email: host?.user.email ?? sampleHost.email,
    phone: host?.user.phone ?? "",
    avatarUrl: host?.user.avatarUrl ?? "",
    zipcode: host?.address.zipcode ?? "",
    prefecture: host?.address.prefecture ?? "",
    city: host?.address.city ?? "",
    town: host?.address.town ?? "",
    building: host?.address.building ?? "",
  };

  return <HostProfileForm initial={initial} />;
}
