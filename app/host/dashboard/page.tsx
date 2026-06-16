import { redirect } from "next/navigation";

// Dashboard was redundant with /host/spaces; the nav is now
// スペース / 予約 / 収益 / マイページ.
export default function HostDashboardPage() {
  redirect("/host/spaces");
}
