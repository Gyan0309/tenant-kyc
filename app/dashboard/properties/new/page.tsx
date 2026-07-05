"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        address: form.get("address"),
        city: form.get("city"),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to create property");
      return;
    }

    const data = await res.json();
    toast.success("Property created");
    router.push(`/dashboard/properties/${data.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to properties
        </Link>
      </div>

      <div className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-muted text-brand">
          <Building2 className="size-5" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Add property</h1>
        <p className="text-sm text-muted-foreground">
          Register a new property to start configuring rooms.
        </p>
      </div>

      <Card className="swiss-card p-6">
        <CardContent className="p-0">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-medium text-foreground">Property name</Label>
              <Input id="name" name="name" required placeholder="Green Villa Apartments" className="swiss-focus h-11 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-medium text-foreground">Street address</Label>
              <Input id="address" name="address" required placeholder="123 Park Avenue, Sector 4" className="swiss-focus h-11 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-medium text-foreground">City</Label>
              <Input id="city" name="city" required placeholder="New Delhi" className="swiss-focus h-11 text-sm" />
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={loading}
            >
              {loading ? "Saving…" : "Create property"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
