import { NextResponse } from "next/server";

/**
 * Stripe webhook endpoint — the backbone of "登録 → 予約 → 承認 → 決済 → 売上確認".
 *
 * This is a structural stub: it has no DB/Stripe dependency yet so the build
 * stays green. To make it live later:
 *   1. `npm i stripe`
 *   2. set STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET in env
 *   3. uncomment the signature verification and replace the handlers below
 *      with real updates to the `bookings` / `payments` tables.
 *
 * Stripe must receive the RAW request body for signature verification, so we
 * read req.text() (not req.json()) and disable any body parsing.
 */

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  // --- Signature verification (enable once `stripe` is installed) ---------
  // import Stripe from "stripe";
  // const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // let event: Stripe.Event;
  // try {
  //   event = stripe.webhooks.constructEvent(
  //     body,
  //     signature!,
  //     process.env.STRIPE_WEBHOOK_SECRET!,
  //   );
  // } catch (err) {
  //   return new NextResponse(`Webhook signature verification failed`, { status: 400 });
  // }

  let event: { type?: string; data?: unknown };
  try {
    event = body ? JSON.parse(body) : {};
  } catch {
    return new NextResponse("Invalid payload", { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "payment_intent.succeeded":
      // TODO: mark the matching booking as paid/confirmed and record the payment.
      console.log("[stripe] payment succeeded", { hasSignature: Boolean(signature) });
      break;

    case "charge.refunded":
      // TODO: mark the booking refunded / cancelled.
      console.log("[stripe] charge refunded");
      break;

    default:
      console.log("[stripe] unhandled event", event.type ?? "(none)");
  }

  // Always 200 quickly so Stripe doesn't retry once we've accepted the event.
  return NextResponse.json({ received: true });
}
