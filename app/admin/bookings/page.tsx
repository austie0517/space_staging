import { getAllBookings } from "@/lib/repositories/bookingRepository";
import { toUIBooking } from "@/lib/mappers/booking";
import { AdminBookingsClient } from "./AdminBookingsClient";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  const bookings = (await getAllBookings()).map(toUIBooking);
  return <AdminBookingsClient initialBookings={bookings} />;
}
