"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-5" />
        </div>
        <h1 className="font-heading text-lg font-semibold text-foreground">
          Something went wrong
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          An unexpected error occurred. You can try again — if it keeps
          happening, restart the app.
        </p>
        <Button
          onClick={reset}
          className="mt-6 h-10 w-full gap-2 rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <RotateCw className="size-4" /> Try again
        </Button>
      </div>
    </div>
  );
}
