import { NotificationsList } from "../../_components/NotificationsList";
import { GuestNav } from "../../_components/GuestNav";
import type { Notification } from "@/types";

export function NotificationsClient({
  notifications,
}: {
  notifications: Notification[];
}) {
  return (
    <div className="min-h-screen pb-24 md:pt-14">
      <NotificationsList notifications={notifications} role="guest" />
      <GuestNav />
    </div>
  );
}
