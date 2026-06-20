import { cache } from "react";
import { prisma } from "@/lib/prisma";

const DEMO_GUEST_ID = process.env.DEMO_GUEST_ID;

/**
 * Guest identity. No auth yet, so we resolve the demo guest (the first one
 * created). Replace with the authenticated guest once sessions land.
 */
export const getCurrentGuest = cache(async function getCurrentGuest() {
  return prisma.guest.findFirst({
    ...(DEMO_GUEST_ID ? { where: { id: DEMO_GUEST_ID } } : {}),
    orderBy: { createdAt: "asc" },
    include: { user: true },
  });
});

export const getCurrentGuestUserId = cache(async function getCurrentGuestUserId() {
  const guest = await prisma.guest.findFirst({
    ...(DEMO_GUEST_ID ? { where: { id: DEMO_GUEST_ID } } : {}),
    orderBy: { createdAt: "asc" },
    select: { userId: true },
  });
  return guest?.userId ?? null;
});

/** Set a user's avatar URL. */
export async function setUserAvatar(userId: string, avatarUrl: string) {
  return prisma.user.update({ where: { id: userId }, data: { avatarUrl } });
}

/** Update a guest's profile (name/email live on `users`, profession/license on `guests`). */
export async function updateGuestProfile(params: {
  guestId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  profession: string;
  license: string;
}) {
  const [, guest] = await prisma.$transaction([
    prisma.user.update({
      where: { id: params.userId },
      data: {
        name: params.name,
        email: params.email,
        phone: params.phone || null,
      },
    }),
    prisma.guest.update({
      where: { id: params.guestId },
      data: { profession: params.profession, license: params.license || null },
    }),
  ]);
  return guest;
}
