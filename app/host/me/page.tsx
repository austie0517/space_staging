import { getCurrentHost, getHostAddress } from "@/lib/repositories/hostRepository";
import { sampleHost } from "@/lib/sampleData";
import { HostMeClient } from "./HostMeClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostMePage() {
  const host = await getCurrentHost();
  const address = host ? await getHostAddress(host.id) : null;
  const profile = {
    name: host?.user.name ?? sampleHost.name,
    email: host?.user.email ?? sampleHost.email,
    phone: host?.user.phone ?? "",
    avatarUrl: host?.user.avatarUrl ?? "",
    plan: host?.plan ?? "free",
    address: address
      ? [address.prefecture, address.city, address.town, address.building]
          .filter(Boolean)
          .join("")
      : "",
  };

  return <HostMeClient profile={profile} />;
}
