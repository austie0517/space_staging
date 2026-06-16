import Link from "next/link";
import {
  getSpace,
  getSpaceMinBookingHours,
  getSpaceResourceMeta,
} from "@/lib/repositories/spaceRepository";
import { getSpaceFields } from "@/lib/repositories/spaceFieldRepository";
import { getUIAvailabilities } from "@/lib/repositories/availabilityRepository";
import { getAllTags, getSpaceTagIds } from "@/lib/repositories/spaceTagRepository";
import { getBookingsBySpace } from "@/lib/repositories/bookingRepository";
import { toUISpace } from "@/lib/mappers/space";
import { toUISpaceField } from "@/lib/mappers/spaceField";
import { toUIBooking, toCalendarBooking } from "@/lib/mappers/booking";
import { HostSpaceClient } from "./HostSpaceClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function HostSpacePage({
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
        <Link href="/host/spaces" className="text-primary underline">
          スペース一覧へ
        </Link>
      </div>
    );
  }

  const space = toUISpace(row);
  space.minBookingHours = await getSpaceMinBookingHours(id);
  const resourceMeta = await getSpaceResourceMeta(id);
  space.resourceCategory = resourceMeta.resourceCategory;
  space.capacityUnit = resourceMeta.capacityUnit;
  const published = row.status === "approved";
  const address = {
    zipcode: row.zipcode ?? "",
    prefecture: row.prefecture ?? "",
    city: row.city ?? "",
    town: row.town ?? "",
    building: row.building ?? "",
  };
  const imageUrls = [...row.images]
    .sort(
      (a, b) =>
        Number(b.isCover) - Number(a.isCover) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )
    .map((image) => image.imageUrl);
  const availabilities = await getUIAvailabilities(id);
  const fields = (await getSpaceFields(id)).map(toUISpaceField);
  const rawBookings = await getBookingsBySpace(id);
  const upcoming = rawBookings
    .map(toUIBooking)
    .filter((b) => b.status !== "completed" && b.status !== "cancelled");
  const calendarBookings = rawBookings.map(toCalendarBooking);
  const allTags = await getAllTags();
  const tagIds = await getSpaceTagIds(id);

  return (
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
  );
}
