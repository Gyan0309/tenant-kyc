"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

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
    router.push(`/properties/${params.propertyId}/rooms/${data.id}`);
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Add room</h1>
      <Card>
        <CardHeader>
          <CardTitle>Room details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room number</Label>
              <Input id="roomNumber" name="roomNumber" required placeholder="A-101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity</Label>
              <Input id="capacity" name="capacity" type="number" min={1} defaultValue={1} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyRent">Monthly rent (₹)</Label>
              <Input id="monthlyRent" name="monthlyRent" type="number" min={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor">Floor</Label>
              <Input id="floor" name="floor" type="number" defaultValue={0} />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving…" : "Create room"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
