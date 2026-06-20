import { cache } from "react";
import { getActorUserId } from "@/lib/repositories/adminRepository";
import { getCurrentGuest, getCurrentGuestUserId } from "@/lib/repositories/guestRepository";
import { getCurrentHost, getCurrentHostUserId } from "@/lib/repositories/hostRepository";

export type ActorRole = "guest" | "host" | "admin";

export const getCachedCurrentGuest = cache(getCurrentGuest);
export const getCachedCurrentHost = cache(getCurrentHost);
export const getCachedCurrentGuestUserId = cache(getCurrentGuestUserId);
export const getCachedCurrentHostUserId = cache(getCurrentHostUserId);
export const getCachedActorUserId = cache(getActorUserId);

export const getActorUserIdByRole = cache(async (role: ActorRole) => {
  if (role === "guest") return getCachedCurrentGuestUserId();
  if (role === "host") return getCachedCurrentHostUserId();
  return getCachedActorUserId();
});
