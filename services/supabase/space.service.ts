import type { SpaceService } from "../types";
import type { Space } from "@/types";
import { supabase } from "@/lib/supabase";
import { SAMPLE_SPACES, fieldsForSpace, availabilitiesForSpace } from "@/mock";

/**
 * Supabase-backed space reads. The `spaces` table is provisioned; column names
 * may differ slightly, so the mapper reads several common candidates and falls
 * back to SAMPLE_SPACES if the query errors or returns nothing.
 *
 * `space_fields` / `availabilities` tables are NOT provisioned yet, so those
 * methods fall back to mock data until the migrations land.
 */

const PLACEHOLDER =
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80";

function num(v: unknown, fallback: number): number {
  const n = typeof v === "string" ? Number(v) : (v as number);
  return Number.isFinite(n) ? (n as number) : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

/** "東京都渋谷区代官山" ← prefecture + city + town */
function joinAddress(row: Record<string, unknown>): string {
  const parts = [row.prefecture, row.city, row.town]
    .map((p) => str(p))
    .filter(Boolean);
  return parts.length ? parts.join("") : "場所未設定";
}

/** Hourly price from space_options (prefer an active hourly option). */
function hourlyPrice(row: Record<string, unknown>): number {
  const opts = (row.space_options as Array<Record<string, unknown>>) ?? [];
  const active = opts.filter((o) => o.is_active !== false);
  const hourly = active.find((o) => str(o.price_type) === "hourly");
  const chosen = hourly ?? active[0] ?? opts[0];
  return chosen ? num(chosen.price, 0) : 0;
}

/** Map the real `spaces` row (+ joined space_images / space_options) to the UI shape. */
function mapSpace(row: Record<string, unknown>): Space {
  const rawImages =
    (row.space_images as Array<Record<string, unknown>> | undefined) ?? [];
  const images = [...rawImages]
    .sort(
      (a, b) =>
        (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0) ||
        num(a.sort_order, 0) - num(b.sort_order, 0),
    )
    .map((img) => str(img.image_url))
    .filter(Boolean);

  return {
    id: String(row.id ?? ""),
    title: str(row.name, "無題のスペース"),
    area: joinAddress(row),
    description: str(row.description, ""),
    pitchTitle: str(row.pitch_title, ""),
    pitchBody: str(row.pitch_body, ""),
    resourceCategory: str(row.resource_category, "venue"),
    capacityUnit: str(row.capacity_unit, "person"),
    pricePerHour: hourlyPrice(row),
    minBookingHours: num(row.min_booking_hours, 1),
    capacity: num(row.capacity, 1),
    rating: num(row.rating, 0), // TODO: aggregate from reviews
    reviewCount: num(row.review_count, 0),
    spaceType: str(row.space_type, "Creative Studio"),
    images: images.length ? images : [PLACEHOLDER],
    amenities: [], // TODO: from space_tags via space_tag_relations
    wifi: true, // not modeled in DB yet
    parking: false,
    published: str(row.status) === "published",
  };
}

export const supabaseSpaceService: SpaceService = {
  async list() {
    try {
      const { data, error } = await supabase
        .from("spaces")
        .select("*, space_images(*), space_options(*)");
      if (error) throw error;
      if (!data || data.length === 0) return SAMPLE_SPACES;
      return (data as Record<string, unknown>[]).map(mapSpace);
    } catch (e) {
      console.warn("[spaces] falling back to sample data:", e);
      return SAMPLE_SPACES;
    }
  },

  async get(id) {
    try {
      const { data, error } = await supabase
        .from("spaces")
        .select("*, space_images(*), space_options(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (data) return mapSpace(data as Record<string, unknown>);
    } catch (e) {
      console.warn("[spaces] falling back to sample data:", e);
    }
    return SAMPLE_SPACES.find((s) => s.id === id) ?? null;
  },

  // TODO: read from space_fields once provisioned.
  async fields(spaceId) {
    return fieldsForSpace(spaceId);
  },

  // TODO: read from availabilities once provisioned.
  async availabilities(spaceId) {
    return availabilitiesForSpace(spaceId);
  },
};
