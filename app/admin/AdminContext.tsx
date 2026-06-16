"use client";

import { createContext, useContext, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Application, ApplicationKind, KycSubmission } from "@/types";
import { setApplicationStatusAction, setKycStatusAction } from "./actions";

/**
 * Admin-wide shared state, seeded from the DB by the /admin layout. Approving /
 * rejecting an application or KYC submission updates optimistically and
 * persists via server actions, then refreshes so every tab (and the pending
 * banner) reflects the new state.
 */
type AdminContextValue = {
  applications: Application[];
  kycSubmissions: KycSubmission[];
  pendingCount: number;
  approve: (id: string, kind: ApplicationKind) => void;
  reject: (id: string, kind: ApplicationKind) => void;
  approveKyc: (id: string) => void;
  rejectKyc: (id: string) => void;
};

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({
  initialApplications,
  initialKyc,
  children,
}: {
  initialApplications: Application[];
  initialKyc: KycSubmission[];
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [applications, setApplications] = useState(initialApplications);
  const [kycSubmissions, setKycSubmissions] = useState(initialKyc);

  const refresh = () => startTransition(() => router.refresh());

  const setApp = (id: string, status: Application["status"]) =>
    setApplications((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a)),
    );
  const setKyc = (id: string, status: KycSubmission["status"]) =>
    setKycSubmissions((prev) =>
      prev.map((k) => (k.id === id ? { ...k, status } : k)),
    );

  const pendingCount =
    applications.filter((a) => a.status === "pending").length +
    kycSubmissions.filter((k) => k.status === "pending").length;

  const decideApp = async (
    id: string,
    kind: ApplicationKind,
    status: "approved" | "rejected",
  ) => {
    setApp(id, status); // optimistic
    const res = await setApplicationStatusAction(kind, id, status);
    if (res.ok) refresh();
    else setApp(id, "pending");
  };

  const decideKyc = async (id: string, status: "approved" | "rejected") => {
    setKyc(id, status);
    const res = await setKycStatusAction(id, status);
    if (res.ok) refresh();
    else setKyc(id, "pending");
  };

  const value: AdminContextValue = {
    applications,
    kycSubmissions,
    pendingCount,
    approve: (id, kind) => decideApp(id, kind, "approved"),
    reject: (id, kind) => decideApp(id, kind, "rejected"),
    approveKyc: (id) => decideKyc(id, "approved"),
    rejectKyc: (id) => decideKyc(id, "rejected"),
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within <AdminProvider>");
  return ctx;
}
