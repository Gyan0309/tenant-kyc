import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { getProperty } from "@/lib/azure/repos/properties";
import { listRoomsByProperty } from "@/lib/azure/repos/rooms";
import { listPersonsByRoom } from "@/lib/azure/repos/persons";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
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
import { ArrowLeft, Bed, Landmark, Users, DoorOpen } from "lucide-react";

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

  const roomDetails = await Promise.all(
    rooms.map(async (room) => {
      const persons = await listPersonsByRoom(room.rowKey);
      return {
        ...room,
        currentOccupants: persons.length,
      };
    })
  );

  // Occupancy at the property level = rooms that have at least one tenant,
  // out of total rooms (not people / bed-capacity — that lives per-room).
  const occupiedRooms = roomDetails.filter((room) => room.currentOccupants > 0).length;
  const vacantCount = rooms.length - occupiedRooms;
  const activeOccupants = roomDetails.reduce(
    (sum, room) => sum + room.currentOccupants,
    0,
  );

  return (
    <div className="space-y-8">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to properties
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">{property.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
            {property.address}, {property.city}
          </p>
        </div>
        <Link
          href={`/dashboard/properties/${propertyId}/rooms/new`}
          className={cn(buttonVariants(), "bg-brand hover:bg-brand/90 text-brand-foreground py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2 text-xs")}
        >
         Add Room
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="swiss-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Rooms</CardTitle>
            <DoorOpen className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{rooms.length}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Total configured rooms</p>
          </CardContent>
        </Card>

        <Card className="swiss-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Occupancy</CardTitle>
            <Bed className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {occupiedRooms}/{rooms.length}
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Rooms occupied</p>
          </CardContent>
        </Card>

        <Card className="swiss-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Vacancies</CardTitle>
            <Landmark className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{vacantCount}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Fully vacant rooms</p>
          </CardContent>
        </Card>

        <Card className="swiss-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Tenant Records</CardTitle>
            <Users className="size-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{activeOccupants}</div>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Active tenant document records</p>
          </CardContent>
        </Card>
      </div>

      {/* Rooms Table Card */}
      <Card className="swiss-card shadow-xs">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight tracking-tight">Room Configurations</CardTitle>
          <CardDescription className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            Click view to manage occupants and uploaded Aadhaar documents.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roomDetails.length === 0 ? (
            <div className="text-center py-8">
              <DoorOpen className="size-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No rooms set up for this property yet.</p>
              <Link 
                href={`/dashboard/properties/${propertyId}/rooms/new`}
                className="text-xs text-brand hover:text-brand/80 underline font-medium mt-1 inline-block"
              >
                Create a room now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="border-collapse">
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-800">
                    <TableHead className="w-[120px] text-slate-500 font-medium text-[10px] uppercase tracking-wider py-3">Room</TableHead>
                    <TableHead className="text-slate-500 font-medium text-[10px] uppercase tracking-wider py-3">Floor</TableHead>
                    <TableHead className="text-slate-500 font-medium text-[10px] uppercase tracking-wider py-3">Occupancy</TableHead>
                    <TableHead className="text-slate-500 font-medium text-[10px] uppercase tracking-wider py-3">Rent (Monthly)</TableHead>
                    <TableHead className="text-slate-500 font-medium text-[10px] uppercase tracking-wider py-3">Status</TableHead>
                    <TableHead className="text-right text-slate-500 font-medium text-[10px] uppercase tracking-wider py-3">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roomDetails.map((room) => (
                    <TableRow key={room.rowKey} className="group hover:bg-slate-50/80 dark:hover:bg-slate-900/30 border-b border-slate-100 dark:border-slate-800/60 transition-colors">
                      <TableCell className="font-bold text-slate-900 dark:text-white py-3.5 text-sm">{room.roomNumber}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 text-xs py-3.5">
                        {room.floor === 0 ? "Ground" : `${room.floor} Floor`}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 text-xs py-3.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{room.currentOccupants}</span>
                        <span className="text-slate-400">/{room.capacity}</span>
                      </TableCell>
                      <TableCell className="font-bold text-slate-800 dark:text-slate-200 text-xs py-3.5">₹{room.monthlyRent}</TableCell>
                      <TableCell className="py-3.5">
                        {room.status === "OCCUPIED" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50">Occupied</span>
                        )}
                        {room.status === "PARTIAL" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50">Partial</span>
                        )}
                        {room.status === "VACANT" && (
                          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-50 text-slate-500 border border-slate-200/60 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800">Vacant</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right py-3.5">
                        <Link
                          href={`/dashboard/properties/${propertyId}/rooms/${room.rowKey}`}
                          className={cn(
                            buttonVariants({ variant: "ghost", size: "sm" }),
                            "text-brand hover:text-brand/80 font-semibold hover:bg-brand-muted/60 dark:hover:bg-brand-muted/30 text-xs px-3.5"
                          )}
                        >
                          Manage
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
