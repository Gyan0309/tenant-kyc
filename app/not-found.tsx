import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6">
      <div className="text-center">
        <p className="font-heading text-5xl font-semibold tracking-tight text-foreground">
          404
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page doesn’t exist.
        </p>
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants(),
            "mt-6 h-10 rounded-lg bg-brand px-5 text-sm text-brand-foreground hover:bg-brand/90",
          )}
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
