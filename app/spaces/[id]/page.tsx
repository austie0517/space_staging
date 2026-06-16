import Link from "next/link";
import {
  getSpace,
  getSpaceMinBookingHours,
  getSpaceResourceMeta,
} from "@/lib/repositories/spaceRepository";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { isKycApproved } from "@/lib/repositories/kycRepository";
import { getUIAvailabilities } from "@/lib/repositories/availabilityRepository";
import { getBookingsForResourceCalendar } from "@/lib/repositories/bookingRepository";
import { toUISpace } from "@/lib/mappers/space";
import { toUIReview } from "@/lib/mappers/review";
import { toUISpaceField } from "@/lib/mappers/spaceField";
import { toCalendarBooking } from "@/lib/mappers/booking";
import { SpaceDetailClient } from "./SpaceDetailClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await getSpace(id);

  if (!row) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-on-surface-variant">スペースが見つかりませんでした。</p>
        <Link href="/spaces" className="text-primary underline">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const space = toUISpace(row);
  space.minBookingHours = await getSpaceMinBookingHours(id);
  const resourceMeta = await getSpaceResourceMeta(id);
  space.resourceCategory = resourceMeta.resourceCategory;
  space.capacityUnit = resourceMeta.capacityUnit;
  const reviews = row.reviews.map(toUIReview);
  const fields = row.spaceFields.map(toUISpaceField);
  const availabilityResourceId = row.parentSpaceId ?? id;
  const availabilities = await getUIAvailabilities(availabilityResourceId);
  const bookings = (await getBookingsForResourceCalendar(id)).map(toCalendarBooking);
  const guest = await getCurrentGuest();
  const canRequestBooking = guest ? await isKycApproved(guest.userId) : false;

  return (
    <SpaceDetailClient
      space={space}
      reviews={reviews}
      fields={fields}
      availabilities={availabilities}
      bookings={bookings}
      canRequestBooking={canRequestBooking}
    />
  );
}
