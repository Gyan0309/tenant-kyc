import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { listPropertiesByOwner } from "@/lib/azure/repos/properties";
import { listRoomsByProperty } from "@/lib/azure/repos/rooms";
import { listPersonsByRoom } from "@/lib/azure/repos/persons";
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
  
  // Fetch properties
  const properties = await listPropertiesByOwner(ownerId);

  const propertyDetails = await Promise.all(
    properties.map(async (p) => {
      const rooms = await listRoomsByProperty(p.rowKey);
      
      let pOccupied = 0;
      let pVacant = 0;
      let pPartial = 0;

      for (const r of rooms) {
        if (r.status === "OCCUPIED") pOccupied++;
        else if (r.status === "PARTIAL") pPartial++;
        else pVacant++;
      }

      const tenantCounts = await Promise.all(
        rooms.map(async (r) => {
          const persons = await listPersonsByRoom(r.rowKey);
          return persons.length;
        }),
      );

      return {
        ...p,
        roomsCount: rooms.length,
        occupiedRooms: pOccupied,
        partialRooms: pPartial,
        vacantRooms: pVacant,
        tenantsCount: tenantCounts.reduce((sum, count) => sum + count, 0),
      };
    })
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Properties Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 leading-relaxed">
            Manage rental assets, rooms, tenants, and uploaded identity documents.
          </p>
        </div>
        <Link 
          href="/dashboard/properties/new" 
          className={cn(buttonVariants(), "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-4 rounded-md shadow-sm transition-colors flex items-center gap-2 text-xs")}
        >
          <Plus className="size-4" /> Add Property
        </Link>
      </div>

      {/* Stats Grid - Three horizontal cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Card 1: Total Properties */}
        <Card className="swiss-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Properties</CardTitle>
            <Building2 className="size-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{properties.length}</div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">Registered rental properties</p>
          </CardContent>
        </Card>

        {/* Card 2: Room Occupancy Rate (circular SVG progress ring) */}
        <Card className="swiss-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Room Occupancy</CardTitle>
            <div className="relative size-10 flex items-center justify-center flex-shrink-0">
              <svg className="size-10 transform -rotate-90">
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="stroke-slate-100 dark:stroke-slate-800 fill-none"
                  strokeWidth="3.5"
                />
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  className="stroke-indigo-600 fill-none"
                  strokeWidth="3.5"
                  strokeDasharray={100.53}
                  strokeDashoffset={100.53 - (occupancyRate / 100) * 100.53}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[9px] font-bold text-slate-700 dark:text-slate-300">{occupancyRate}%</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{occupancyRate}%</div>
            <p className="text-[10px] text-slate-400 mt-2 font-medium">
              {occupiedRoomsCount + partialRoomsCount} of {totalRooms} rooms occupied
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Active tenants */}
        <Card className="swiss-card shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Tenants</CardTitle>
            <Users className="size-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white leading-none">{totalTenants}</div>
            <p className="text-[10px] text-slate-400 font-medium">
              Tenant records with private document storage
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Properties Grid */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Registered Properties</h2>
        
        {properties.length === 0 ? (
          <Card className="swiss-card border-dashed border-slate-200 dark:border-slate-800 py-12 flex flex-col items-center justify-center text-center">
            <Building2 className="size-12 text-slate-400 dark:text-slate-700 mb-4" />
            <CardTitle className="text-base text-slate-700 dark:text-slate-300 font-semibold">No properties registered</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-500 text-xs mt-1 mb-6 max-w-sm">
              Create your first property to start adding rooms and tenant records.
            </CardDescription>
            <Link 
              href="/dashboard/properties/new" 
              className={cn(buttonVariants(), "bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors text-xs py-2 px-4 rounded-md shadow-xs")}
            >
              Add Property
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
                  <Card className="swiss-card swiss-card-hover h-full shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between gap-4">
                        <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 dark:text-slate-100 dark:group-hover:text-indigo-400 transition-colors leading-tight tracking-tight">
                          {p.name}
                        </CardTitle>
                        <span className={cn(
                          "text-[9px] px-2.5 py-0.5 font-bold uppercase tracking-wider rounded-sm flex-shrink-0 border",
                          isCommercial 
                            ? "bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900" 
                            : "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800"
                        )}>
                          {category}
                        </span>
                      </div>
                      <CardDescription className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1 leading-normal">
                        <MapPin className="size-3.5 flex-shrink-0 text-slate-400" />
                        <span className="truncate">{p.address}, {p.city}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400 font-semibold uppercase tracking-wider text-[9px]">Occupancy</span>
                          <span className="text-slate-700 dark:text-slate-300 font-bold">{pOccupancy}%</span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-900 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                            style={{ width: `${pOccupancy}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 text-[10px] border-t border-slate-100 dark:border-slate-900 pt-3 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                        <div>
                          <span className="text-slate-800 dark:text-slate-200">{p.roomsCount}</span> {p.roomsCount === 1 ? "Room" : "Rooms"}
                        </div>
                        <div className="text-slate-200 dark:text-slate-800">•</div>
                        <div>
                          <span className="text-slate-800 dark:text-slate-200">{p.occupiedRooms}</span> Occupied
                        </div>
                        <div className="text-slate-200 dark:text-slate-800">•</div>
                        <div>
                          <span className="text-slate-800 dark:text-slate-200">{p.vacantRooms}</span> Vacant
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
