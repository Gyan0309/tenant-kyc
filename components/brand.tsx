import { cn } from "@/lib/utils";

// Product name shown in the UI. The vendor (SAGA) lives in package.json only.
export const APP_NAME = "Tenant Manager";

/**
 * App mark — a minimalist "ledger" glyph (three stacked bars) inside a rounded
 * square filled with the brand accent. Single source of truth for the logo;
 * used in the auth screen and the dashboard sidebar.
 */
export function SagaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={cn("text-brand", className)}
      aria-hidden="true"
    >
      <rect width="40" height="40" rx="11" fill="currentColor" />
      <rect x="11" y="12.5" width="18" height="3.4" rx="1.7" fill="white" />
      <rect x="11" y="18.3" width="18" height="3.4" rx="1.7" fill="white" fillOpacity="0.85" />
      <rect x="11" y="24.1" width="11" height="3.4" rx="1.7" fill="white" fillOpacity="0.6" />
    </svg>
  );
}

/**
 * SAGA wordmark + mark. `subtitle` renders a small caps label beneath the name.
 */
export function SagaLogo({
  subtitle,
  className,
  markClassName,
  wordClassName,
}: {
  subtitle?: string;
  className?: string;
  markClassName?: string;
  wordClassName?: string;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <SagaMark className={cn("size-8", markClassName)} />
      <div className="leading-none">
        <span
          className={cn(
            "font-heading text-base font-semibold tracking-tight text-foreground",
            wordClassName,
          )}
        >
          {APP_NAME}
        </span>
        {subtitle ? (
          <span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {subtitle}
          </span>
        ) : null}
      </div>
    </div>
  );
}
