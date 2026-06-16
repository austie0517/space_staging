import { getActorUserId } from "@/lib/repositories/adminRepository";
import { GUEST_VISIBLE_NOTIFICATION_TYPES } from "@/lib/notificationVisibility";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getCurrentHost } from "@/lib/repositories/hostRepository";
import { getUnreadNotificationCount } from "@/lib/repositories/notificationRepository";
import type { NotificationType } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const includedTypes = searchParams.getAll("type") as NotificationType[];

  let userId: string | null | undefined;
  const excludedTypes: NotificationType[] = [];
  let scopedTypes = includedTypes;
  if (role === "guest") {
    userId = (await getCurrentGuest())?.userId;
    scopedTypes =
      includedTypes.length > 0 ? includedTypes : GUEST_VISIBLE_NOTIFICATION_TYPES;
  } else if (role === "host") {
    userId = (await getCurrentHost())?.userId;
  } else if (role === "admin") {
    userId = await getActorUserId();
  }

  if (!userId) return Response.json({ count: 0 });

  const count = await getUnreadNotificationCount(userId, excludedTypes, scopedTypes);
  return Response.json({ count });
}
