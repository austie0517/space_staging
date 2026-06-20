import { getCurrentGuestBookingEligibility } from "@/lib/repositories/kycRepository";
import { measure } from "@/lib/perf";

export async function GET() {
  const requestId = Math.random().toString(36).slice(2, 8);
  console.log(`[booking-eligibility] request ${requestId}`);
  const result = await measure(`/api/booking-eligibility data (${requestId})`, () =>
    getCurrentGuestBookingEligibility(),
  );

  return Response.json(
    result,
    { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } },
  );
}
