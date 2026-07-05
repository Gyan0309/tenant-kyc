"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, DoorOpen } from "lucide-react";

export default function NewRoomPage() {
  const router = useRouter();
  const params = useParams<{ propertyId: string }>();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: params.propertyId,
        roomNumber: form.get("roomNumber"),
        capacity: Number(form.get("capacity")),
        monthlyRent: Number(form.get("monthlyRent")),
        floor: Number(form.get("floor") || 0),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to create room");
      return;
    }

    const data = await res.json();
    toast.success("Room created");
    router.push(`/dashboard/properties/${params.propertyId}/rooms/${data.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6">
      {/* Back Link */}
      <div>
        <Link
          href={`/dashboard/properties/${params.propertyId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to property
        </Link>
      </div>

      <div className="space-y-1 text-center">
        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-brand-muted text-brand">
          <DoorOpen className="size-5" />
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Add room</h1>
        <p className="text-sm text-muted-foreground">
          Set up a new rental unit and configure its parameters.
        </p>
      </div>

      <Card className="swiss-card p-6">
        <CardContent className="p-0">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="roomNumber" className="text-xs font-medium text-foreground">Room number</Label>
              <Input id="roomNumber" name="roomNumber" required placeholder="A-101 or Room 5" className="swiss-focus h-11 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="capacity" className="text-xs font-medium text-foreground">Capacity</Label>
                <Input id="capacity" name="capacity" type="number" min={1} defaultValue={1} required className="swiss-focus h-11 text-sm" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="floor" className="text-xs font-medium text-foreground">Floor</Label>
                <Input id="floor" name="floor" type="number" defaultValue={0} className="swiss-focus h-11 text-sm" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="monthlyRent" className="text-xs font-medium text-foreground">Monthly rent (₹)</Label>
              <Input id="monthlyRent" name="monthlyRent" type="number" min={0} placeholder="12000" required className="swiss-focus h-11 text-sm" />
            </div>
            <Button
              type="submit"
              className="mt-2 h-11 w-full rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={loading}
            >
              {loading ? "Saving…" : "Create room"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
