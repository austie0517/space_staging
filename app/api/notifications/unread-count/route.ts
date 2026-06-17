import { getActorUserIdByRole } from "@/lib/currentActor";
import { GUEST_VISIBLE_NOTIFICATION_TYPES } from "@/lib/notificationVisibility";
import { getUnreadNotificationCount } from "@/lib/repositories/notificationRepository";
import type { NotificationType } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");
  const includedTypes = searchParams.getAll("type") as NotificationType[];

  const excludedTypes: NotificationType[] = [];
  let scopedTypes = includedTypes;
  if (role === "guest") {
    scopedTypes =
      includedTypes.length > 0 ? includedTypes : GUEST_VISIBLE_NOTIFICATION_TYPES;
  }

  const userId =
    role === "guest" || role === "host" || role === "admin"
      ? await getActorUserIdByRole(role)
      : null;

  if (!userId) return Response.json({ count: 0 });

  const count = await getUnreadNotificationCount(userId, excludedTypes, scopedTypes);
  return Response.json({ count });
}
