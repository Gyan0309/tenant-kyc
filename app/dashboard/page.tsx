import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { listPropertiesByOwner } from "@/lib/azure/repos/properties";
import { listRoomsByOwner } from "@/lib/azure/repos/rooms";
import { listPersonsByOwner } from "@/lib/azure/repos/persons";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Users, MapPin, Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  const ownerId = session!.user!.id;

  // Three owner-scoped queries fetched in parallel, then aggregated in memory —
  // replaces the previous per-property/per-room query waterfall.
  const [properties, allRooms, allPersons] = await Promise.all([
    listPropertiesByOwner(ownerId),
    listRoomsByOwner(ownerId),
    listPersonsByOwner(ownerId),
  ]);

  const tenantsByProperty = new Map<string, number>();
  for (const person of allPersons) {
    tenantsByProperty.set(
      person.propertyId,
      (tenantsByProperty.get(person.propertyId) ?? 0) + 1,
    );
  }

  const roomsByProperty = new Map<string, typeof allRooms>();
  for (const room of allRooms) {
    const list = roomsByProperty.get(room.propertyId) ?? [];
    list.push(room);
    roomsByProperty.set(room.propertyId, list);
  }

  const propertyDetails = properties.map((p) => {
    const rooms = roomsByProperty.get(p.rowKey) ?? [];

    let pOccupied = 0;
    let pVacant = 0;
    let pPartial = 0;
    for (const r of rooms) {
      if (r.status === "OCCUPIED") pOccupied++;
      else if (r.status === "PARTIAL") pPartial++;
      else pVacant++;
    }

    return {
      ...p,
      roomsCount: rooms.length,
      occupiedRooms: pOccupied,
      partialRooms: pPartial,
      vacantRooms: pVacant,
      tenantsCount: tenantsByProperty.get(p.rowKey) ?? 0,
    };
  });

  const totalRooms = propertyDetails.reduce((sum, p) => sum + p.roomsCount, 0);
  const occupiedRoomsCount = propertyDetails.reduce((sum, p) => sum + p.occupiedRooms, 0);
  const partialRoomsCount = propertyDetails.reduce((sum, p) => sum + p.partialRooms, 0);
  const totalTenants = propertyDetails.reduce((sum, p) => sum + p.tenantsCount, 0);

  const occupancyRate = totalRooms > 0 
    ? Math.round(((occupiedRoomsCount + partialRoomsCount * 0.5) / totalRooms) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">Properties</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage rental assets, rooms, tenants, and uploaded documents.
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className={cn(buttonVariants(), "h-10 gap-2 rounded-lg bg-brand px-4 text-sm text-brand-foreground hover:bg-brand/90")}
        >
          <Plus className="size-4" /> Add property
        </Link>
      </div>

      {/* Stats Grid - Three horizontal cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Card 1: Total Properties */}
        <Card className="swiss-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total properties</CardTitle>
            <Building2 className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold leading-none text-foreground">{properties.length}</div>
            <p className="mt-2 text-xs text-muted-foreground">Registered rental properties</p>
          </CardContent>
        </Card>

        {/* Card 2: Room Occupancy Rate (circular SVG progress ring) */}
        <Card className="swiss-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Room occupancy</CardTitle>
            <div className="relative flex size-10 flex-shrink-0 items-center justify-center">
              <svg className="size-10 -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="fill-none stroke-muted"
                  strokeWidth="3.5"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="fill-none stroke-brand"
                  strokeWidth="3.5"
                  strokeDasharray={100.53}
                  strokeDashoffset={100.53 - (occupancyRate / 100) * 100.53}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold leading-none text-foreground">{occupancyRate}%</div>
            <p className="mt-2 text-xs text-muted-foreground">
              {occupiedRoomsCount + partialRoomsCount} of {totalRooms} rooms occupied
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Active tenants */}
        <Card className="swiss-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active tenants</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold leading-none text-foreground">{totalTenants}</div>
            <p className="mt-2 text-xs text-muted-foreground">
              Tenant records with private document storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Grid */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered properties</h2>

        {properties.length === 0 ? (
          <Card className="swiss-card flex flex-col items-center justify-center border-dashed py-14 text-center">
            <Building2 className="mb-4 size-10 text-muted-foreground/50" />
            <CardTitle className="text-base font-semibold text-foreground">No properties yet</CardTitle>
            <CardDescription className="mb-6 mt-1 max-w-sm text-sm text-muted-foreground">
              Create your first property to start adding rooms and tenant records.
            </CardDescription>
            <Link
              href="/dashboard/properties/new"
              className={cn(buttonVariants(), "h-9 gap-2 rounded-lg bg-brand px-4 text-sm text-brand-foreground hover:bg-brand/90")}
            >
              <Plus className="size-4" /> Add property
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {propertyDetails.map((p) => {
              // Occupancy calculation for property
              const pOccupancy = p.roomsCount > 0 
                ? Math.round(((p.occupiedRooms + p.partialRooms * 0.5) / p.roomsCount) * 100) 
                : 0;

              // Dynamically classify categories
              const isCommercial = p.name.toLowerCase().includes("commercial") || 
                                  p.name.toLowerCase().includes("office") || 
                                  p.name.toLowerCase().includes("shop");
              const category = isCommercial ? "Commercial" : "Residential";

              return (
                <Link key={p.rowKey} href={`/dashboard/properties/${p.rowKey}`} className="group block">
                  <Card className="swiss-card swiss-card-hover h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-base font-semibold leading-tight tracking-tight text-foreground transition-colors group-hover:text-brand">
                          {p.name}
                        </CardTitle>
                        <span className={cn(
                          "flex-shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
                          isCommercial
                            ? "bg-brand-muted text-brand"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {category}
                        </span>
                      </div>
                      <CardDescription className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="size-3.5 flex-shrink-0" />
                        <span className="truncate">{p.address}, {p.city}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Occupancy</span>
                          <span className="font-medium text-foreground">{pOccupancy}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-brand transition-all duration-300"
                            style={{ width: `${pOccupancy}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 border-t border-border pt-3 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium text-foreground">{p.roomsCount}</span> {p.roomsCount === 1 ? "room" : "rooms"}
                        </div>
                        <div className="text-border">•</div>
                        <div>
                          <span className="font-medium text-foreground">{p.occupiedRooms}</span> occupied
                        </div>
                        <div className="text-border">•</div>
                        <div>
                          <span className="font-medium text-foreground">{p.vacantRooms}</span> vacant
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
