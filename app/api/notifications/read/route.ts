import { getActorUserIdByRole } from "@/lib/currentActor";
import { markNotificationsRead } from "@/lib/repositories/notificationRepository";

type NotificationRole = "guest" | "host" | "admin";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    role?: NotificationRole;
    ids?: string[];
  };
  if (
    body.role !== "guest" &&
    body.role !== "host" &&
    body.role !== "admin"
  ) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((id) => typeof id === "string" && id.length > 0)
    : [];
  if (ids.length === 0) return Response.json({ count: 0 });

  const userId = await getActorUserIdByRole(body.role);
  if (!userId) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await markNotificationsRead(userId, ids);
  return Response.json({ count: result.count });
}
