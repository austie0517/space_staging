import { sendNotificationEmail } from "@/lib/email";

export async function GET() {
  return Response.json({
    hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
    resendApiKeyPrefix: process.env.RESEND_API_KEY?.slice(0, 8) ?? null,
    from: "noreply@enbria.space",
  });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    to?: string;
    subject?: string;
    text?: string;
  };

  if (!body.to) {
    return Response.json({ error: "Missing to" }, { status: 400 });
  }

  try {
    await sendNotificationEmail({
      to: body.to,
      subject: body.subject ?? "Resend debug test",
      text: body.text ?? "Next.js server route からの送信テストです。",
      category: "その他",
      recipientName: null,
    });
    return Response.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
