import type { LineConnection, LineNotificationKey } from "@/types";
import type { LineConnection as PrismaLineConnection } from "@prisma/client";

/** DB notification key → column accessor on the Prisma row. */
export const NOTIF_COLUMN: Record<
  LineNotificationKey,
  keyof Pick<
    PrismaLineConnection,
    | "notifBookingConfirmed"
    | "notifCancelled"
    | "notifEntryPin"
    | "notifExitReminder"
  >
> = {
  bookingConfirmed: "notifBookingConfirmed",
  cancelled: "notifCancelled",
  entryPin: "notifEntryPin",
  exitReminder: "notifExitReminder",
};

/** Map a Prisma `LineConnection` (or none) to the UI `LineConnection` shape. */
export function toUILineConnection(
  row: PrismaLineConnection | null,
): LineConnection {
  return {
    connected: row?.connected ?? false,
    displayName: row?.displayName ?? undefined,
    notifications: {
      bookingConfirmed: row?.notifBookingConfirmed ?? true,
      cancelled: row?.notifCancelled ?? true,
      entryPin: row?.notifEntryPin ?? true,
      exitReminder: row?.notifExitReminder ?? true,
    },
  };
}
