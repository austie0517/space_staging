import { getActorUserIdByRole, type ActorRole } from "@/lib/currentActor";
import { GUEST_VISIBLE_NOTIFICATION_TYPES } from "@/lib/notificationVisibility";
import { getUnreadNotificationCounts } from "@/lib/repositories/notificationRepository";
import type { NotificationType } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (role !== "guest" && role !== "host" && role !== "admin") {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  const userId = await getActorUserIdByRole(role as ActorRole);
  if (!userId) return Response.json({ counts: {} });

  const groups: Array<{ key: string; includedTypes?: NotificationType[] }> =
    role === "guest"
      ? [{ key: "default", includedTypes: GUEST_VISIBLE_NOTIFICATION_TYPES }]
      : role === "admin"
        ? [
            { key: "default" },
            { key: "kyc", includedTypes: ["kyc_submitted"] },
          ]
        : [{ key: "default" }];

  const counts = await getUnreadNotificationCounts(userId, groups);
  return Response.json({ counts });
}
