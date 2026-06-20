import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** The user's most recent KYC submission (null = never submitted). */
export async function getLatestKyc(userId: string) {
  return prisma.kycSubmission.findFirst({
    where: { userId },
    orderBy: { submittedAt: "desc" },
  });
}

/** True only after manual KYC review has approved the user's latest/any submission. */
export async function isKycApproved(userId: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ approved: boolean }>>(
    `select exists(
        select 1
        from public.kyc_submissions
        where user_id = $1::uuid
          and status = 'approved'
      ) as approved`,
    userId,
  );
  return rows[0]?.approved ?? false;
}

export async function getCurrentGuestBookingEligibility() {
  const rows = await prisma.$queryRawUnsafe<
    Array<{ canRequestBooking: boolean; requiresLogin: boolean; requiresKyc: boolean }>
  >(
    process.env.DEMO_GUEST_ID
      ? `
        with current_guest as (
          select user_id
          from public.guests
          where id = $1::uuid
          limit 1
        )
        select
          exists(
            select 1
            from public.kyc_submissions ks
            where ks.user_id = (select user_id from current_guest)
              and ks.status = 'approved'
          ) as "canRequestBooking",
          false as "requiresLogin",
          not exists(
            select 1
            from public.kyc_submissions ks
            where ks.user_id = (select user_id from current_guest)
              and ks.status = 'approved'
          ) as "requiresKyc"
        where exists(select 1 from current_guest)
      `
      : `
        with current_guest as (
          select user_id
          from public.guests
          order by created_at asc
          limit 1
        )
        select
          exists(
            select 1
            from public.kyc_submissions ks
            where ks.user_id = (select user_id from current_guest)
              and ks.status = 'approved'
          ) as "canRequestBooking",
          false as "requiresLogin",
          not exists(
            select 1
            from public.kyc_submissions ks
            where ks.user_id = (select user_id from current_guest)
              and ks.status = 'approved'
          ) as "requiresKyc"
        where exists(select 1 from current_guest)
      `,
    ...(process.env.DEMO_GUEST_ID ? [process.env.DEMO_GUEST_ID] : []),
  );

  return (
    rows[0] ?? {
      canRequestBooking: false,
      requiresLogin: true,
      requiresKyc: false,
    }
  );
}

/** Insert a new KYC submission (status starts as pending). */
export async function createKyc(data: Prisma.KycSubmissionUncheckedCreateInput) {
  return prisma.kycSubmission.create({ data });
}
