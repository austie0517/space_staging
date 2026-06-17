import Link from "next/link";
import { cn } from "../../_components/ui";

function buildHref(pathname: string, page: number) {
  return page <= 1 ? pathname : `${pathname}?page=${page}`;
}

export function AdminPagination({
  pathname,
  page,
  totalPages,
}: {
  pathname: string;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1).slice(
    Math.max(0, page - 3),
    Math.max(5, Math.min(totalPages, page + 2)),
  );

  return (
    <nav className="mt-6 flex flex-wrap items-center justify-center gap-2">
      <Link
        href={buildHref(pathname, page - 1)}
        aria-disabled={page <= 1}
        className={cn(
          "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
          page <= 1
            ? "pointer-events-none border-border bg-surface-low text-on-surface-variant/50"
            : "border-border bg-surface-card text-on-surface-variant hover:bg-surface-low",
        )}
      >
        前へ
      </Link>
      {pages.map((value) => (
        <Link
          key={value}
          href={buildHref(pathname, value)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
            value === page
              ? "border-primary bg-primary text-on-primary"
              : "border-border bg-surface-card text-on-surface-variant hover:bg-surface-low",
          )}
        >
          {value}
        </Link>
      ))}
      <Link
        href={buildHref(pathname, page + 1)}
        aria-disabled={page >= totalPages}
        className={cn(
          "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
          page >= totalPages
            ? "pointer-events-none border-border bg-surface-low text-on-surface-variant/50"
            : "border-border bg-surface-card text-on-surface-variant hover:bg-surface-low",
        )}
      >
        次へ
      </Link>
    </nav>
  );
}

