import Link from "next/link";
import { getHostSpacePageData } from "@/lib/repositories/spaceRepository";
import { getSpaceFields } from "@/lib/repositories/spaceFieldRepository";
import { getUIAvailabilities } from "@/lib/repositories/availabilityRepository";
import { getAllTags, getSpaceTagIds } from "@/lib/repositories/spaceTagRepository";
import {
  getBookingsBySpaceForHost,
  getHostSpaceBookingList,
} from "@/lib/repositories/bookingRepository";
import { toUISpaceField } from "@/lib/mappers/spaceField";
import {
  toCalendarBookingFromRow,
  toUIHostSpaceBookingListItem,
  toUIPendingHostBookingItem,
} from "@/lib/mappers/booking";
import { HostSpaceClient } from "./HostSpaceClient";
import { measure } from "@/lib/perf";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostSpacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await measure(`getHostSpacePageData(${id})`, () => getHostSpacePageData(id));
  const { space, published, address, imageUrls } = detail;

  if (!space) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="text-on-surface-variant">スペースが見つかりませんでした。</p>
        <Link href="/host/spaces" className="text-primary underline">
          スペース一覧へ
        </Link>
      </div>
    );
  }

  const [availabilities, fieldsRows, listRows, pendingRows, allTags, tagIds] = await measure(
    `/host/spaces/${id} parallel data`,
    () =>
      Promise.all([
        getUIAvailabilities(id),
        getSpaceFields(id),
        getHostSpaceBookingList(id),
        getBookingsBySpaceForHost(id),
        getAllTags(),
        getSpaceTagIds(id),
      ]),
  );
  const fields = fieldsRows.map(toUISpaceField);
  const pendingById = new Map(pendingRows.map((row) => [row.id, toUIPendingHostBookingItem(row)]));
  const upcoming = listRows
    .map((row) => pendingById.get(row.id) ?? toUIHostSpaceBookingListItem(row))
    .filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const calendarBookings = listRows.map((booking) =>
    toCalendarBookingFromRow({
      id: booking.id,
      startAt: booking.startAt,
      endAt: booking.endAt,
      status: booking.status,
      guest: {
        user: {
          name: booking.guestName,
        },
      },
    }),
  );

  return measure(`/host/spaces/${id}`, async () => (
    <HostSpaceClient
      space={space}
      published={published}
      address={address}
      imageUrls={imageUrls}
      upcoming={upcoming}
      calendarBookings={calendarBookings}
      availabilities={availabilities}
      fields={fields}
      allTags={allTags}
      tagIds={tagIds}
    />
  ));
}
