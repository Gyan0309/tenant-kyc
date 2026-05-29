"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
    <div className="max-w-lg space-y-6">
      {/* Back Link */}
      <div>
        <Link 
          href={`/dashboard/properties/${params.propertyId}`} 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="size-3.5" /> Back to Property Details
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Add Room</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Set up a new rental unit and configure its parameters.
        </p>
      </div>

      <Card className="swiss-card shadow-xs">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg text-slate-700 dark:text-slate-300">
            <DoorOpen className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Room Details</CardTitle>
            <CardDescription className="text-xs text-slate-400">Configure space capacities, rates, and floors.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber" className="text-slate-700 dark:text-slate-300 font-medium">Room Identifier / Number</Label>
              <Input 
                id="roomNumber" 
                name="roomNumber" 
                required 
                placeholder="A-101 or Room 5" 
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-slate-700 dark:text-slate-300 font-medium">Maximum Capacity (Occupants)</Label>
              <Input 
                id="capacity" 
                name="capacity" 
                type="number" 
                min={1} 
                defaultValue={1} 
                required 
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="monthlyRent" className="text-slate-700 dark:text-slate-300 font-medium">Monthly Rent (₹)</Label>
              <Input 
                id="monthlyRent" 
                name="monthlyRent" 
                type="number" 
                min={0} 
                placeholder="12000"
                required 
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="floor" className="text-slate-700 dark:text-slate-300 font-medium">Floor Level</Label>
              <Input 
                id="floor" 
                name="floor" 
                type="number" 
                defaultValue={0} 
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm transition-colors mt-2" 
              disabled={loading}
            >
              {loading ? "Saving…" : "Create Room Unit"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
