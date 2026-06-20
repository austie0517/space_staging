import { getCurrentGuest } from "@/lib/repositories/guestRepository";
import { isKycApproved } from "@/lib/repositories/kycRepository";

export async function GET() {
  const guest = await getCurrentGuest();

  if (!guest) {
    return Response.json(
      { canRequestBooking: false, requiresLogin: true, requiresKyc: false },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
    );
  }

  const approved = await isKycApproved(guest.userId);

  return Response.json(
    {
      canRequestBooking: approved,
      requiresLogin: false,
      requiresKyc: !approved,
    },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
