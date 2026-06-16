import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getBookingsByGuest } from "@/lib/repositories/bookingRepository";
import { getReviewedBookingIds } from "@/lib/repositories/reviewRepository";
import { toUIBooking } from "@/lib/mappers/booking";
import { GuestBookingsClient } from "./GuestBookingsClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function GuestBookingsPage() {
  const guest = await getCurrentGuest();
  const bookings = guest
    ? (await getBookingsByGuest(guest.id)).map(toUIBooking)
    : [];
  const reviewedBookingIds = guest
    ? await getReviewedBookingIds(guest.id)
    : [];

  return (
    <GuestBookingsClient
      initialBookings={bookings}
      reviewedBookingIds={reviewedBookingIds}
    />
  );
}
