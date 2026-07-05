"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DatabaseZap, RotateCw } from "lucide-react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Azure connection failures surface here (unreachable storage, bad
  // connection string). Give the operator an actionable message.
  const isStorage = /connection string|ENOTFOUND|ECONNREFUSED|storage|table|blob/i.test(
    error?.message ?? "",
  );

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border border-border/70 bg-card p-8 text-center">
        <div className="mx-auto mb-4 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <DatabaseZap className="size-5" />
        </div>
        <h1 className="font-heading text-lg font-semibold text-foreground">
          {isStorage ? "Can’t reach storage" : "Couldn’t load your data"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {isStorage
            ? "Could not connect to storage. Check the connection settings and that you’re online, then try again."
            : "Something went wrong loading this page. Please try again."}
        </p>
        <Button
          onClick={reset}
          className="mt-6 h-10 w-full gap-2 rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
        >
          <RotateCw className="size-4" /> Retry
        </Button>
      </div>
    </div>
  );
}
