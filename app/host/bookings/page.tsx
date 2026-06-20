import { getCurrentHostId } from "@/lib/repositories/hostRepository";
import {
  getHostBookingList,
  getPendingBookingsByHost,
} from "@/lib/repositories/bookingRepository";
import {
  toUIHostBookingListItem,
  toUIPendingHostBookingItem,
} from "@/lib/mappers/booking";
import { HostBookingsClient } from "./HostBookingsClient";
import { measure } from "@/lib/perf";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostBookingsPage() {
  const hostId = await measure("getCurrentHostId(/host/bookings)", () => getCurrentHostId());
  const bookings = hostId
    ? await (async () => {
        const [pendingRows, listRows] = await measure("/host/bookings data", () =>
          Promise.all([
            getPendingBookingsByHost(hostId),
            getHostBookingList(hostId, { take: 60 }),
          ]),
        );
        return [
          ...pendingRows.map(toUIPendingHostBookingItem),
          ...listRows.map(toUIHostBookingListItem),
        ];
      })()
    : [];

  return <HostBookingsClient initialBookings={bookings} />;
}
