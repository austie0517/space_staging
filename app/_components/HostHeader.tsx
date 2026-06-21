import Link from "next/link";
import { Icon } from "./ui";
import { sampleHost } from "@/mock/users";

/**
 * Mobile header for host pages: avatar + brand + my-page link. Hidden on
 * desktop (md+), where the HostNav top bar provides the brand/navigation.
 */
export function HostHeader({ subtitle }: { subtitle?: string }) {
  return (
    <header className="flex items-center justify-between px-5 pb-2 pt-6 md:hidden">
      <Link href="/host/spaces" prefetch={false} className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sampleHost.avatar}
          alt={sampleHost.name}
          className="h-10 w-10 rounded-full object-cover"
        />
        <div>
          <p className="font-display text-lg leading-tight text-primary">
            Zenith Lumina
          </p>
          {subtitle && (
            <p className="text-xs text-on-surface-variant">{subtitle}</p>
          )}
        </div>
      </Link>
      <Link
        href="/host/me"
        prefetch={false}
        className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-high"
        aria-label="マイページ"
      >
        <Icon name="settings" />
      </Link>
    </header>
  );
}
