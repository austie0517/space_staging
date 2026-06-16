"use client";

import { useState } from "react";
import { cn } from "./ui";

/**
 * Underline-style tab bar used on the host/admin tabbed pages.
 * Uncontrolled by default; pass `value` + `onChange` to drive it from the URL.
 */
export function Tabs({
  tabs,
  children,
  initial = 0,
  value,
  onChange,
}: {
  tabs: string[];
  children: (active: number) => React.ReactNode;
  initial?: number;
  value?: number;
  onChange?: (index: number) => void;
}) {
  const [internal, setInternal] = useState(initial);
  const active = value ?? internal;
  const setActive = (i: number) => {
    onChange?.(i);
    if (value === undefined) setInternal(i);
  };

  return (
    <div>
      <div className="no-scrollbar flex gap-6 overflow-x-auto border-b border-border px-5">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => setActive(i)}
            className={cn(
              "relative flex-none py-3 text-[15px] font-semibold transition-colors",
              active === i
                ? "text-primary"
                : "text-on-surface-variant hover:text-on-surface",
            )}
          >
            {tab}
            {active === i && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>
      <div>{children(active)}</div>
    </div>
  );
}
