import { prisma } from "@/lib/prisma";

/** All users (admin user list). */
export async function getAllUsers() {
  return prisma.user.findMany({
    include: {
      guest: true,
      host: true,
      kycSubmissions: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

/** Set a user's account status (active | pending | suspended). */
export async function setUserStatus(id: string, status: string) {
  return prisma.user.update({ where: { id }, data: { status } });
}

/* ------------------------------------------------------- audit trail */

/** Resolve the acting admin (no auth yet: first admin, else first user). */
export async function getActorUserId() {
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true },
  });
  if (admin) return admin.id;
  const any = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  return any?.id ?? null;
}

/** Write an audit_logs entry. Never throws (logging must not break the op). */
export async function recordAudit(
  action: string,
  targetType: string,
  targetId: string | null,
  actorUserId?: string | null,
) {
  try {
    const actorId = actorUserId ?? (await getActorUserId());
    if (!actorId) return;
    await prisma.auditLog.create({
      data: { userId: actorId, action, targetType, targetId },
    });
  } catch (e) {
    console.error("[audit] failed:", e);
  }
}

/* ----------------------------------------------------- applications */

export async function getHostApplications() {
  return prisma.hostApplication.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGuestApplications() {
  return prisma.guestApplication.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function setHostApplicationStatus(id: string, status: string) {
  return prisma.hostApplication.update({ where: { id }, data: { status } });
}

export async function setGuestApplicationStatus(id: string, status: string) {
  return prisma.guestApplication.update({ where: { id }, data: { status } });
}

/* ------------------------------------------------------------- kyc */

export async function getAllKyc() {
  return prisma.kycSubmission.findMany({
    include: { user: true },
    orderBy: { submittedAt: "desc" },
  });
}

export async function setKycStatus(id: string, status: string) {
  return prisma.kycSubmission.update({ where: { id }, data: { status } });
}

/* ------------------------------------------------------ settlements */

export async function getSettlements() {
  return prisma.settlement.findMany({
    include: { host: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });
}

/** Settlements for one host (host earnings page). */
export async function getSettlementsByHost(hostId: string) {
  return prisma.settlement.findMany({
    where: { hostId },
    orderBy: { createdAt: "desc" },
  });
}

export async function markSettlementPaid(id: string) {
  return prisma.settlement.update({
    where: { id },
    data: { status: "paid", paidAt: new Date() },
  });
}

/* ------------------------------------------------------- audit logs */

export async function getAuditLogs() {
  return prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}
