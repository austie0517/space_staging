import { HostNav } from "../../_components/HostNav";
import { NotificationsList } from "../../_components/NotificationsList";
import { getCurrentHost } from "@/lib/repositories/hostRepository";
import { getNotificationsByUser } from "@/lib/repositories/notificationRepository";
import { toUINotification } from "@/lib/mappers/notification";

export const dynamic = "force-dynamic";

export default async function HostNotificationsPage() {
  const host = await getCurrentHost();
  const notifications = host
    ? (await getNotificationsByUser(host.userId)).map(toUINotification)
    : [];

  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <NotificationsList notifications={notifications} role="host" />
      <HostNav />
    </div>
  );
}
