import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { findRoomById } from "@/lib/azure/repos/rooms";
import { listPersonsByRoom } from "@/lib/azure/repos/persons";
import { notFound } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RoomStatusBadge, VerifiedBadge } from "@/components/status-badge";

export default async function RoomPage({
  params,
}: {
  params: Promise<{ propertyId: string; roomId: string }>;
}) {
  const { propertyId, roomId } = await params;
  const session = await auth();
  const ownerId = session!.user!.id;

  const room = await findRoomById(roomId);
  if (!room || room.ownerId !== ownerId || room.propertyId !== propertyId) {
    notFound();
  }

  const persons = await listPersonsByRoom(roomId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Room {room.roomNumber}</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2">
            <RoomStatusBadge status={room.status} />
            Capacity {persons.length}/{room.capacity} · ₹{room.monthlyRent}/mo
          </p>
        </div>
        <Link
          href={`/properties/${propertyId}/rooms/${roomId}/add-person`}
          className={cn(buttonVariants())}
        >
          Add tenant
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Occupants</CardTitle>
          <CardDescription>Verified via DigiLocker or added manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {persons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tenants in this room.</p>
          ) : (
            persons.map((p) => (
              <div
                key={p.rowKey}
                className="flex items-center justify-between border rounded-lg p-4"
              >
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {p.role} · {p.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <VerifiedBadge verified={p.isVerified} />
                  <Link
                    href={`/tenants/${p.rowKey}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
