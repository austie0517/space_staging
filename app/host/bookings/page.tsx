import { getCurrentHost } from "@/lib/repositories/hostRepository";
import {
  getHostBookingList,
  getPendingBookingsByHost,
} from "@/lib/repositories/bookingRepository";
import { toUIBooking, toUIHostBookingListItem } from "@/lib/mappers/booking";
import { HostBookingsClient } from "./HostBookingsClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostBookingsPage() {
  const host = await getCurrentHost();
  const bookings = host
    ? await (async () => {
        const [pendingRows, listRows] = await Promise.all([
          getPendingBookingsByHost(host.id),
          getHostBookingList(host.id),
        ]);
        return [
          ...pendingRows.map(toUIBooking),
          ...listRows.map(toUIHostBookingListItem),
        ];
      })()
    : [];

  return <HostBookingsClient initialBookings={bookings} />;
}
