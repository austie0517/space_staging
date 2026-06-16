import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

/** Tiny class-name joiner (avoids a clsx dependency). */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ Icon */

type IconProps = {
  name: string;
  filled?: boolean;
  className?: string;
};

/** Material Symbols glyph. `name` is the ligature, e.g. "location_on". */
export function Icon({ name, filled, className }: IconProps) {
  return (
    <span
      aria-hidden
      className={cn("material-symbols-outlined", filled && "filled", className)}
    >
      {name}
    </span>
  );
}

/* ---------------------------------------------------------------- Button */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const buttonBase =
  "inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-on-primary shadow-[var(--shadow-soft)] hover:brightness-110 active:brightness-95",
  secondary:
    "bg-surface-card text-on-surface border border-border hover:bg-surface-low",
  ghost: "bg-transparent text-primary hover:bg-primary-container/20",
  danger:
    "bg-surface-card text-error border border-error/40 hover:bg-error-container/40",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-[15px] px-6 py-3",
  lg: "text-base px-8 py-4",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    />
  );
}

/** Link styled identically to <Button>. */
export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  fullWidth,
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonBase,
        buttonVariants[variant],
        buttonSizes[size],
        fullWidth && "w-full",
        className,
      )}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ Card */

export function Card({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface-card border border-border rounded-lg shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Chip */

type ChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  icon?: string;
};

/** Pill-shaped selectable chip used for category filters. */
export function Chip({ active, icon, className, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "flex-none inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-semibold tracking-wide transition-all",
        active
          ? "bg-primary-container text-on-primary-container"
          : "bg-surface-card border border-border text-secondary hover:bg-surface-low",
        className,
      )}
      {...props}
    >
      {icon && <Icon name={icon} className="text-[18px]" />}
      {children}
    </button>
  );
}

/* ----------------------------------------------------------------- Stars */

/** Read-only star rating row (filled vs outlined Material star glyphs). */
export function Stars({
  value,
  size = 16,
  className,
}: {
  value: number;
  size?: number;
  className?: string;
}) {
  const rounded = Math.round(value);
  return (
    <span
      className={cn("inline-flex items-center", className)}
      role="img"
      aria-label={`5段階中${value}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          aria-hidden
          style={{ fontSize: size }}
          className={cn(
            "material-symbols-outlined",
            i <= rounded ? "filled text-primary" : "text-on-surface-variant/30",
          )}
        >
          star
        </span>
      ))}
    </span>
  );
}

/* ----------------------------------------------------------------- Badge */

type BadgeTone = "neutral" | "primary" | "success" | "warning" | "error";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-high text-on-surface-variant",
  primary: "bg-primary-container/40 text-on-primary-container",
  success: "bg-success-container text-success",
  warning: "bg-tertiary-container/50 text-on-surface-variant",
  error: "bg-error-container/60 text-error",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Toast */

type ToastTone = "success" | "error" | "info";

const toastIcons: Record<ToastTone, string> = {
  success: "check_circle",
  error: "error",
  info: "info",
};

const toastIconColor: Record<ToastTone, string> = {
  success: "text-success",
  error: "text-error",
  info: "text-primary-container",
};

/**
 * Snackbar-style feedback. Controlled — render with `show` and the caller is
 * responsible for hiding it (e.g. on a timer). Floats bottom-center.
 */
export function Toast({
  show,
  message,
  tone = "success",
  icon,
}: {
  show: boolean;
  message: string;
  tone?: ToastTone;
  icon?: string;
}) {
  if (!show) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-5"
    >
      <div className="flex items-center gap-2 rounded-full bg-on-surface px-5 py-3 text-sm font-semibold text-surface shadow-[var(--shadow-soft)] animate-[toast-in_180ms_ease-out]">
        <Icon name={icon ?? toastIcons[tone]} filled className={cn("text-[18px]", toastIconColor[tone])} />
        {message}
      </div>
      <style>{`@keyframes toast-in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}
