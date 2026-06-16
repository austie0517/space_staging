import { getCurrentHost, getHostAddress } from "@/lib/repositories/hostRepository";
import { sampleHost } from "@/lib/sampleData";
import { HostProfileForm } from "./HostProfileForm";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostProfileEditPage() {
  const host = await getCurrentHost();
  const address = host ? await getHostAddress(host.id) : null;
  const initial = {
    name: host?.user.name ?? sampleHost.name,
    email: host?.user.email ?? sampleHost.email,
    phone: host?.user.phone ?? "",
    avatarUrl: host?.user.avatarUrl ?? "",
    zipcode: address?.zipcode ?? "",
    prefecture: address?.prefecture ?? "",
    city: address?.city ?? "",
    town: address?.town ?? "",
    building: address?.building ?? "",
  };

  return <HostProfileForm initial={initial} />;
}
