import type { ReviewService } from "../types";
import { mockReviewService } from "../mock/review.service";

/**
 * The `reviews` table is not provisioned yet — delegate to mock until the
 * migration lands. Replace with a real Supabase query later.
 */
export const supabaseReviewService: ReviewService = {
  async listBySpace(spaceId) {
    console.warn("[review.service] supabase not wired — using mock");
    return mockReviewService.listBySpace(spaceId);
  },
};
