import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { sampleGuest } from "@/mock";
import { ProfileEditForm } from "./ProfileEditForm";

// Reads live data on each request (Prisma → Supabase).
export const dynamic = "force-dynamic";

export default async function ProfileEditPage() {
  const guest = await getCurrentGuest();
  const initial = {
    name: guest?.user.name ?? sampleGuest.name,
    email: guest?.user.email ?? sampleGuest.email,
    phone: guest?.user.phone ?? "",
    profession: guest?.profession ?? sampleGuest.profession,
    license: guest?.license ?? "",
    avatarUrl: guest?.user.avatarUrl ?? "",
  };

  return <ProfileEditForm initial={initial} />;
}
