import { redirect } from "next/navigation";

// Standalone calendar removed — availability is managed per space under
// /host/spaces/[id] (カレンダータブ).
export default function HostCalendarPage() {
  redirect("/host/spaces");
}
