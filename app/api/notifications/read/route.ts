import { getActorUserId } from "@/lib/repositories/adminRepository";
import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getCurrentHost } from "@/lib/repositories/hostRepository";
import { markNotificationsRead } from "@/lib/repositories/notificationRepository";

type NotificationRole = "guest" | "host" | "admin";

async function getUserId(role: NotificationRole) {
  if (role === "guest") return (await getCurrentGuest())?.userId;
  if (role === "host") return (await getCurrentHost())?.userId;
  return getActorUserId();
}

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

  const userId = await getUserId(body.role);
  if (!userId) return Response.json({ error: "Not found" }, { status: 404 });

  const result = await markNotificationsRead(userId, ids);
  return Response.json({ count: result.count });
}
