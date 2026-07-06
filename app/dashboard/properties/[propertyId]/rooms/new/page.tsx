"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, DoorOpen, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type RoomRow = {
  roomNumber: string;
  capacity: string;
  monthlyRent: string;
  floor: string;
};

const blankRoom = (): RoomRow => ({ roomNumber: "", capacity: "1", monthlyRent: "", floor: "0" });

export default function NewRoomPage() {
  const router = useRouter();
  const params = useParams<{ propertyId: string }>();
  const propertyId = params.propertyId;

  const [mode, setMode] = useState<"bulk" | "custom">("bulk");
  const [loading, setLoading] = useState(false);

  // Bulk mode
  const [block, setBlock] = useState("A");
  const [startNumber, setStartNumber] = useState("101");
  const [count, setCount] = useState("5");
  const [bulkCapacity, setBulkCapacity] = useState("1");
  const [bulkRent, setBulkRent] = useState("");
  const [bulkFloor, setBulkFloor] = useState("0");

  // Custom mode
  const [rooms, setRooms] = useState<RoomRow[]>([blankRoom()]);

  function update(i: number, field: keyof RoomRow, value: string) {
    setRooms((rs) => rs.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)));
  }

  const start = parseInt(startNumber || "0", 10) || 0;
  const nCount = Math.min(Math.max(parseInt(count || "0", 10) || 0, 0), 60);
  const bulkNames = Array.from({ length: nCount }, (_, i) => {
    const b = block.trim();
    return b ? `${b}-${start + i}` : `${start + i}`;
  });

  function buildRooms(): RoomRow[] {
    if (mode === "bulk") {
      return bulkNames.map((roomNumber) => ({
        roomNumber,
        capacity: bulkCapacity,
        monthlyRent: bulkRent,
        floor: bulkFloor,
      }));
    }
    return rooms;
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const toCreate = buildRooms();
    if (toCreate.length === 0) return toast.error("Add at least one room");

    for (const [i, r] of toCreate.entries()) {
      if (!r.roomNumber.trim()) return toast.error(`Room ${i + 1}: number is required`);
      if (Number(r.capacity) < 1) return toast.error(`Room ${i + 1}: capacity must be at least 1`);
      if (r.monthlyRent === "" || Number(r.monthlyRent) < 0) return toast.error(`Room ${i + 1}: enter a valid rent`);
    }

    const nums = toCreate.map((r) => r.roomNumber.trim().toLowerCase());
    const dupIndex = nums.findIndex((n, i) => n && nums.indexOf(n) !== i);
    if (dupIndex !== -1) return toast.error(`Duplicate room number "${toCreate[dupIndex].roomNumber}"`);

    setLoading(true);
    try {
      const results = await Promise.all(
        toCreate.map((r) =>
          fetch("/api/rooms", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              propertyId,
              roomNumber: r.roomNumber.trim(),
              capacity: Number(r.capacity),
              monthlyRent: Number(r.monthlyRent),
              floor: Number(r.floor || 0),
            }),
          }),
        ),
      );
      const failed = results.filter((r) => !r.ok);
      if (failed.length > 0) {
        const first = await failed[0].json().catch(() => null);
        toast.error(first?.error ?? `${failed.length} of ${toCreate.length} room(s) failed`);
        setLoading(false);
        return;
      }

      toast.success(toCreate.length === 1 ? "Room created" : `${toCreate.length} rooms created`);
      if (toCreate.length === 1) {
        const data = await results[0].json();
        router.push(`/dashboard/properties/${propertyId}/rooms/${data.id}`);
      } else {
        router.push(`/dashboard/properties/${propertyId}`);
      }
    } catch {
      toast.error("Failed to create rooms");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href={`/dashboard/properties/${propertyId}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to property
      </Link>

      <Card className="swiss-card mx-auto w-full max-w-lg p-6">
        <CardContent className="space-y-5 p-0">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-muted text-brand">
              <DoorOpen className="size-4.5" />
            </div>
            <div>
              <h1 className="font-heading text-base font-semibold text-foreground">Add rooms</h1>
              <p className="text-xs text-muted-foreground">Create a block of rooms at once, or add them individually.</p>
            </div>
          </div>

          {/* Mode toggle */}
          <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
            {(["bulk", "custom"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={cn(
                  "rounded-md px-5 py-1.5 text-xs font-medium transition-colors",
                  mode === m ? "bg-brand text-brand-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "bulk" ? "Block (bulk)" : "Custom"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "bulk" ? (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Block</Label>
                    <Input value={block} onChange={(e) => setBlock(e.target.value)} placeholder="A" className="swiss-focus h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Start #</Label>
                    <Input type="number" value={startNumber} onChange={(e) => setStartNumber(e.target.value)} className="swiss-focus h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">No. of rooms</Label>
                    <Input type="number" min={1} max={60} value={count} onChange={(e) => setCount(e.target.value)} className="swiss-focus h-10 text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Capacity</Label>
                    <Input type="number" min={1} value={bulkCapacity} onChange={(e) => setBulkCapacity(e.target.value)} className="swiss-focus h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Floor</Label>
                    <Input type="number" value={bulkFloor} onChange={(e) => setBulkFloor(e.target.value)} className="swiss-focus h-10 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Rent (₹)</Label>
                    <Input type="number" min={0} value={bulkRent} onChange={(e) => setBulkRent(e.target.value)} placeholder="12000" className="swiss-focus h-10 text-sm" />
                  </div>
                </div>

                {/* Live preview of generated room numbers */}
                {bulkNames.length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <p className="mb-2 text-[11px] font-medium text-muted-foreground">
                      Will create {bulkNames.length} room{bulkNames.length > 1 ? "s" : ""}:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {bulkNames.slice(0, 12).map((n) => (
                        <span key={n} className="rounded-md bg-background px-2 py-0.5 text-[11px] font-medium text-foreground ring-1 ring-border">
                          {n}
                        </span>
                      ))}
                      {bulkNames.length > 12 && (
                        <span className="px-1 text-[11px] text-muted-foreground">+{bulkNames.length - 12} more</span>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {rooms.map((room, i) => (
                  <div key={i} className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Room {i + 1}</span>
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setRooms((rs) => rs.filter((_, idx) => idx !== i))}
                          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remove room"
                        >
                          <X className="size-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-foreground">Room number</Label>
                      <Input value={room.roomNumber} onChange={(e) => update(i, "roomNumber", e.target.value)} placeholder="A-101" className="swiss-focus h-10 text-sm" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">Capacity</Label>
                        <Input type="number" min={1} value={room.capacity} onChange={(e) => update(i, "capacity", e.target.value)} className="swiss-focus h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">Floor</Label>
                        <Input type="number" value={room.floor} onChange={(e) => update(i, "floor", e.target.value)} className="swiss-focus h-10 text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-foreground">Rent (₹)</Label>
                        <Input type="number" min={0} value={room.monthlyRent} onChange={(e) => update(i, "monthlyRent", e.target.value)} placeholder="12000" className="swiss-focus h-10 text-sm" />
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setRooms((rs) => [...rs, blankRoom()])}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-brand/50 hover:text-foreground"
                >
                  <Plus className="size-4" /> Add another room
                </button>
              </>
            )}

            <Button
              type="submit"
              className="mt-1 h-10 w-full rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
              disabled={loading}
            >
              {loading ? "Saving…" : mode === "bulk" ? `Create ${bulkNames.length || 0} room${bulkNames.length === 1 ? "" : "s"}` : rooms.length === 1 ? "Create room" : `Create ${rooms.length} rooms`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
