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
  const count = await prisma.kycSubmission.count({
    where: { userId, status: "approved" },
  });
  return count > 0;
}

/** Insert a new KYC submission (status starts as pending). */
export async function createKyc(data: Prisma.KycSubmissionUncheckedCreateInput) {
  return prisma.kycSubmission.create({ data });
}
