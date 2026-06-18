import { getCurrentHostWithAddress } from "@/lib/repositories/hostRepository";
import { sampleHost } from "@/mock/users";
import { HostMeClient } from "./HostMeClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostMePage() {
  const host = await getCurrentHostWithAddress();
  const profile = {
    name: host?.user.name ?? sampleHost.name,
    email: host?.user.email ?? sampleHost.email,
    phone: host?.user.phone ?? "",
    avatarUrl: host?.user.avatarUrl ?? "",
    plan: host?.plan ?? "free",
    address: host?.address
      ? [host.address.prefecture, host.address.city, host.address.town, host.address.building]
          .filter(Boolean)
          .join("")
      : "",
  };

  return <HostMeClient profile={profile} />;
}
