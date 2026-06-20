import { getCurrentGuestBookingEligibility } from "@/lib/repositories/kycRepository";

export async function GET() {
  const result = await getCurrentGuestBookingEligibility();

  return Response.json(
    result,
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
