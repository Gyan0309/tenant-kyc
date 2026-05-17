import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { getProperty } from "@/lib/azure/repos/properties";
import { listRoomsByProperty } from "@/lib/azure/repos/rooms";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RoomStatusBadge } from "@/components/status-badge";

export default async function PropertyPage({
  params,
}: {
  params: Promise<{ propertyId: string }>;
}) {
  const { propertyId } = await params;
  const session = await auth();
  const ownerId = session!.user!.id;

  const property = await getProperty(ownerId, propertyId);
  if (!property) notFound();

  const rooms = await listRoomsByProperty(propertyId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{property.name}</h1>
          <p className="text-muted-foreground text-sm">
            {property.address}, {property.city}
          </p>
        </div>
        <Link
          href={`/properties/${propertyId}/rooms/new`}
          className={cn(buttonVariants())}
        >
          Add room
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rooms</CardTitle>
          <CardDescription>Occupancy and tenant verification status</CardDescription>
        </CardHeader>
        <CardContent>
          {rooms.length === 0 ? (
            <p className="text-sm text-muted-foreground">No rooms yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Floor</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.rowKey}>
                    <TableCell className="font-medium">{room.roomNumber}</TableCell>
                    <TableCell>{room.floor}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>₹{room.monthlyRent}</TableCell>
                    <TableCell>
                      <RoomStatusBadge status={room.status} />
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/properties/${propertyId}/rooms/${room.rowKey}`}
                        className={cn(buttonVariants({ variant: "link" }))}
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
