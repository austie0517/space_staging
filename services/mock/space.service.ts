import type { SpaceService } from "../types";
import {
  SAMPLE_SPACES,
  fieldsForSpace,
  availabilitiesForSpace,
} from "@/mock";

export const mockSpaceService: SpaceService = {
  async list() {
    return SAMPLE_SPACES;
  },
  async get(id) {
    return SAMPLE_SPACES.find((s) => s.id === id) ?? null;
  },
  async fields(spaceId) {
    return fieldsForSpace(spaceId);
  },
  async availabilities(spaceId) {
    return availabilitiesForSpace(spaceId);
  },
};
