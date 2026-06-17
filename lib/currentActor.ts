import { cache } from "react";
import { getActorUserId } from "@/lib/repositories/adminRepository";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getCurrentHost } from "@/lib/repositories/hostRepository";

export type ActorRole = "guest" | "host" | "admin";

export const getCachedCurrentGuest = cache(getCurrentGuest);
export const getCachedCurrentHost = cache(getCurrentHost);
export const getCachedActorUserId = cache(getActorUserId);

export const getActorUserIdByRole = cache(async (role: ActorRole) => {
  if (role === "guest") return (await getCachedCurrentGuest())?.userId ?? null;
  if (role === "host") return (await getCachedCurrentHost())?.userId ?? null;
  return getCachedActorUserId();
});

