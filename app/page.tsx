import { redirect } from "next/navigation";

// Root route: send guests to the spaces list (the production entry point).
// The previous Supabase `listings` demo was removed — the real schema uses
// the `spaces` table, queried via lib/spaces.ts on /spaces.
export default function Home() {
  redirect("/spaces");
}
