import { mockSpaceService } from "./mock/space.service";
import { mockBookingService } from "./mock/booking.service";
import { mockReviewService } from "./mock/review.service";
import { supabaseSpaceService } from "./supabase/space.service";
import { supabaseBookingService } from "./supabase/booking.service";
import { supabaseReviewService } from "./supabase/review.service";

/**
 * Data-source switch. Phase 1 = mock (default). To use the real backend once
 * the tables are provisioned, set NEXT_PUBLIC_DATA_SOURCE=supabase.
 *
 * Screens import services from here only:
 *   import { spaceService } from "@/services";
 *   const spaces = await spaceService.list();
 */
export const DATA_SOURCE =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? "supabase" : "mock";

const useSupabase = DATA_SOURCE === "supabase";

export const spaceService = useSupabase ? supabaseSpaceService : mockSpaceService;
export const bookingService = useSupabase
  ? supabaseBookingService
  : mockBookingService;
export const reviewService = useSupabase
  ? supabaseReviewService
  : mockReviewService;

export type { SpaceService, BookingService, ReviewService } from "./types";
