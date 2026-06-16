import type { BookingService } from "../types";
import { mockBookingService } from "../mock/booking.service";

/**
 * The `bookings` table is not provisioned yet. Until the migration lands these
 * delegate to the mock implementation so the app stays functional in either
 * data-source mode. Replace each body with a real Supabase query later.
 */
export const supabaseBookingService: BookingService = {
  async listByGuest(guestId) {
    console.warn("[booking.service] supabase not wired — using mock");
    return mockBookingService.listByGuest(guestId);
  },
  async listByHost(hostId) {
    console.warn("[booking.service] supabase not wired — using mock");
    return mockBookingService.listByHost(hostId);
  },
  async cancel(id) {
    console.warn("[booking.service] supabase not wired — using mock");
    return mockBookingService.cancel(id);
  },
};
