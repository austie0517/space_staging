import { getCurrentGuestUserId } from "@/lib/repositories/guestRepository";
import { isKycApproved } from "@/lib/repositories/kycRepository";

export async function GET() {
  const userId = await getCurrentGuestUserId();

  if (!userId) {
    return Response.json(
      { canRequestBooking: false, requiresLogin: true, requiresKyc: false },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
    );
  }

  const approved = await isKycApproved(userId);

  return Response.json(
    {
      canRequestBooking: approved,
      requiresLogin: false,
      requiresKyc: !approved,
    },
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
