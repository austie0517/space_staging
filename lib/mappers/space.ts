import { optimizeImageUrl } from "@/lib/imageUrl";
import type { Space } from "@/types";
import type { SpaceWithRelations } from "@/lib/repositories/spaceRepository";

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

/** Map a Prisma `Space` (+relations) to the UI `Space` shape the screens use. */
export function toUISpace(s: SpaceWithRelations): Space {
  const images = [...s.images]
    .sort(
      (a, b) =>
        Number(b.isCover) - Number(a.isCover) ||
        (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    )
    .map((img) => optimizeImageUrl(img.imageUrl, { width: 1200, quality: 58 }))
    .filter(Boolean);

  const activeOptions = s.options.filter((o) => o.isActive !== false);
  const hourly =
    activeOptions.find((o) => o.priceType === "hourly") ??
    activeOptions[0] ??
    s.options[0];

  const reviewCount = s.reviews.length;
  const rating = reviewCount
    ? s.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : 0;

  const area =
    [s.prefecture, s.city, s.town].filter(Boolean).join("") || "場所未設定";

  return {
    id: s.id,
    title: s.name,
    area,
    description: s.description ?? "",
    pitchTitle: s.pitchTitle ?? "",
    pitchBody: s.pitchBody ?? "",
    resourceCategory: s.resourceCategory,
    capacityUnit: s.capacityUnit,
    pricePerHour: hourly?.price ?? 0,
    minBookingHours: s.minBookingHours ?? 1,
    capacity: s.capacity ?? 1,
    rating: Math.round(rating * 10) / 10,
    reviewCount,
    spaceType: s.spaceType,
    images: images.length ? images : [PLACEHOLDER],
    amenities: s.tagRelations.map((tr) => tr.tag.name),
    wifi: true, // not modeled in DB yet
    parking: false,
    published: s.status === "published" || s.status === "approved",
  };
}
