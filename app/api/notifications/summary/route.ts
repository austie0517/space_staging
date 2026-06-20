import { getActorUserIdByRole, type ActorRole } from "@/lib/currentActor";
import { GUEST_VISIBLE_NOTIFICATION_TYPES } from "@/lib/notificationVisibility";
import { measure } from "@/lib/perf";
import { getUnreadNotificationCounts } from "@/lib/repositories/notificationRepository";
import type { NotificationType } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role");

  if (role !== "guest" && role !== "host" && role !== "admin") {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  const userId = await measure(`/api/notifications/summary actor(${role})`, () =>
    getActorUserIdByRole(role as ActorRole),
  );
  if (!userId) {
    return Response.json(
      { counts: {} },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
    );
  }

  const groups: Array<{ key: string; includedTypes?: NotificationType[] }> =
    role === "guest"
      ? [{ key: "default", includedTypes: GUEST_VISIBLE_NOTIFICATION_TYPES }]
      : role === "admin"
        ? [
            { key: "default" },
            { key: "kyc", includedTypes: ["kyc_submitted"] },
          ]
        : [{ key: "default" }];

  const counts = await measure(`/api/notifications/summary counts(${role})`, () =>
    getUnreadNotificationCounts(userId, groups),
  );
  return Response.json(
    { counts },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
