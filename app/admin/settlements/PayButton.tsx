"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../_components/ui";
import { paySettlementAction } from "../actions";

export function PayButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const pay = async () => {
    const res = await paySettlementAction(id);
    if (res.ok) startTransition(() => router.refresh());
  };

  return (
    <Button size="sm" fullWidth className="mt-3" disabled={pending} onClick={pay}>
      {pending ? "処理中..." : "振込を実行"}
    </Button>
  );
}
