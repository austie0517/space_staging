import { AdminPagination } from "../_components/AdminPagination";
import { countAllBookings, getAllBookings } from "@/lib/repositories/bookingRepository";
import { toUIBooking } from "@/lib/mappers/booking";
import { AdminBookingsClient } from "./AdminBookingsClient";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 50;

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Number((await searchParams).page ?? "1") || 1);
  const skip = (page - 1) * PAGE_SIZE;
  const [rows, total] = await Promise.all([
    getAllBookings({ skip, take: PAGE_SIZE }),
    countAllBookings(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const bookings = rows.map(toUIBooking);

  return (
    <>
      <AdminBookingsClient
        initialBookings={bookings}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
      />
      <AdminPagination
        pathname="/admin/bookings"
        page={page}
        totalPages={totalPages}
      />
    </>
  );
}
