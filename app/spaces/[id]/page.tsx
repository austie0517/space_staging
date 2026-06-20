import Link from "next/link";
import { FavoritesProvider } from "../../_components/useFavorites";
import { getSpaceDetailPageData } from "@/lib/repositories/spaceRepository";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { isKycApproved } from "@/lib/repositories/kycRepository";
import { getUIAvailabilities } from "@/lib/repositories/availabilityRepository";
import { getBookingsForResourceCalendar } from "@/lib/repositories/bookingRepository";
import { toCalendarBookingFromRow } from "@/lib/mappers/booking";
import { measure } from "@/lib/perf";
import { SpaceDetailClient } from "./SpaceDetailClient";

export const revalidate = 300;

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await measure(`getSpaceDetailPageData(${id})`, () =>
    getSpaceDetailPageData(id),
  );

  if (!detail.space) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-on-surface-variant">スペースが見つかりませんでした。</p>
        <Link href="/spaces" className="text-primary underline">
          一覧へ戻る
        </Link>
      </div>
    );
  }

  const { space, reviews, fields, parentSpaceId } = detail;
  const availabilityResourceId = parentSpaceId ?? id;
  const guestPromise = getCurrentGuest();
  const [availabilities, bookingRows, guest] = await measure(
    `/spaces/${id} parallel data`,
    () =>
      Promise.all([
        getUIAvailabilities(availabilityResourceId),
        getBookingsForResourceCalendar(id),
        guestPromise,
      ]),
  );

  const bookings = bookingRows.map(toCalendarBookingFromRow);
  const canRequestBooking = guest
    ? await measure(`isKycApproved(${guest.userId})`, () => isKycApproved(guest.userId))
    : false;

  return measure(`/spaces/${id}`, async () => (
    <FavoritesProvider syncOnMount>
      <SpaceDetailClient
        space={space}
        reviews={reviews}
        fields={fields}
        availabilities={availabilities}
        bookings={bookings}
        canRequestBooking={canRequestBooking}
      />
    </FavoritesProvider>
  ));
}
