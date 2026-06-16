import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

type NotifPatch = Partial<
  Pick<
    Prisma.LineConnectionUncheckedCreateInput,
    | "notifBookingConfirmed"
    | "notifCancelled"
    | "notifEntryPin"
    | "notifExitReminder"
  >
>;

/** The user's LINE connection row (null = never configured). */
export async function getLineConnection(userId: string) {
  return prisma.lineConnection.findUnique({ where: { userId } });
}

/** Connect / disconnect LINE for a user. */
export async function setLineConnected(
  userId: string,
  connected: boolean,
  displayName: string | null,
) {
  return prisma.lineConnection.upsert({
    where: { userId },
    create: { userId, connected, displayName },
    update: { connected, displayName },
  });
}

/** Patch one or more notification toggles. */
export async function updateLineNotif(userId: string, patch: NotifPatch) {
  return prisma.lineConnection.upsert({
    where: { userId },
    create: { userId, ...patch },
    update: patch,
  });
}
