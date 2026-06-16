import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { getNotificationsByUser } from "@/lib/repositories/notificationRepository";
import { toUINotification } from "@/lib/mappers/notification";
import { GUEST_VISIBLE_NOTIFICATION_TYPES } from "@/lib/notificationVisibility";
import { NotificationsClient } from "./NotificationsClient";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const guest = await getCurrentGuest();
  const notifications = guest
    ? (await getNotificationsByUser(guest.userId))
        .map(toUINotification)
        .filter((notification) =>
          GUEST_VISIBLE_NOTIFICATION_TYPES.includes(notification.type),
        )
    : [];

  return <NotificationsClient notifications={notifications} />;
}
