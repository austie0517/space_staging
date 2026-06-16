import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getLineConnection } from "@/lib/repositories/lineConnectionRepository";
import { toUILineConnection } from "@/lib/mappers/lineConnection";
import { SettingsClient } from "./SettingsClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const guest = await getCurrentGuest();
  const row = guest ? await getLineConnection(guest.userId) : null;

  return <SettingsClient initial={toUILineConnection(row)} />;
}
