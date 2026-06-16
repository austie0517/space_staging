import { NotificationsList } from "../../_components/NotificationsList";
import { getActorUserId } from "@/lib/repositories/adminRepository";
import { getNotificationsByUser } from "@/lib/repositories/notificationRepository";
import { toUINotification } from "@/lib/mappers/notification";
import { AdminShell } from "../AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const adminUserId = await getActorUserId();
  const notifications = adminUserId
    ? (await getNotificationsByUser(adminUserId)).map(toUINotification)
    : [];

  return (
    <AdminShell>
      <NotificationsList notifications={notifications} role="admin" />
    </AdminShell>
  );
}
