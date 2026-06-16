import type { ReviewService } from "../types";
import { reviewsForSpace } from "@/mock";

export const mockReviewService: ReviewService = {
  async listBySpace(spaceId) {
    return reviewsForSpace(spaceId);
  },
};
