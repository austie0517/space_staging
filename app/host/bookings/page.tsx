import { getCurrentHost } from "@/lib/repositories/hostRepository";
import { getBookingsByHost } from "@/lib/repositories/bookingRepository";
import { toUIBooking } from "@/lib/mappers/booking";
import { HostBookingsClient } from "./HostBookingsClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostBookingsPage() {
  const host = await getCurrentHost();
  const bookings = host
    ? (await getBookingsByHost(host.id)).map(toUIBooking)
    : [];

  return <HostBookingsClient initialBookings={bookings} />;
}
