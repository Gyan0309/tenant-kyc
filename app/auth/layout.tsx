import { SagaLogo } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-surface relative flex min-h-screen w-full flex-col items-center justify-center px-4 py-10">
      {/* Draggable strip for the frameless desktop window (empty area, no-op in browser). */}
      <div className="app-drag-strip fixed inset-x-0 top-0 z-30 h-9" />
      <ThemeToggle className="fixed bottom-4 right-4 z-50 border border-border bg-card" />
      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <SagaLogo subtitle="Property Suite" />
        </div>
        {children}
        <p className="mt-8 text-center text-[11px] text-muted-foreground/70">
          © {new Date().getFullYear()} · Secure property records
        </p>
      </div>
    </div>
  );
}
