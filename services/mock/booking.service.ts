import type { BookingService } from "../types";
import { sampleBookings } from "@/mock";

export const mockBookingService: BookingService = {
  async listByGuest(guestId) {
    return sampleBookings.filter((b) => b.guestId === guestId);
  },
  async listByHost() {
    // Single-host demo dataset — every booking belongs to the one host.
    return sampleBookings;
  },
  async cancel() {
    // Mock: no persistence. Screens update local state optimistically.
  },
};
