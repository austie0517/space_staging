import type { Space, SpaceField, Availability, Booking, Review } from "@/types";

/**
 * Service interfaces — the only contract screens depend on. A mock and a
 * Supabase implementation each satisfy these, and `@/services` picks one at
 * runtime. Screens call e.g. `spaceService.list()` and never know the source.
 */

export interface SpaceService {
  list(): Promise<Space[]>;
  get(id: string): Promise<Space | null>;
  fields(spaceId: string): Promise<SpaceField[]>;
  availabilities(spaceId: string): Promise<Availability[]>;
}

export interface BookingService {
  listByGuest(guestId: string): Promise<Booking[]>;
  listByHost(hostId: string): Promise<Booking[]>;
  cancel(id: string): Promise<void>;
}

export interface ReviewService {
  listBySpace(spaceId: string): Promise<Review[]>;
}
