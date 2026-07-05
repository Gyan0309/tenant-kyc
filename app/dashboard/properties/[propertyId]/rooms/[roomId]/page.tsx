import Link from "next/link";
import { auth } from "@/lib/auth/config";
import { findRoomById } from "@/lib/azure/repos/rooms";
import { listPersonsByRoom } from "@/lib/azure/repos/persons";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { RoomStatusBadge } from "@/components/status-badge";
import { ArrowLeft, Phone, Calendar, FileText, User } from "lucide-react";

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
    <div className="space-y-8">
      {/* Breadcrumb / Back Link */}
      <div>
        <Link 
          href={`/dashboard/properties/${propertyId}`} 
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" /> Back to Property Details
        </Link>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Room {room.roomNumber}</h1>
            <RoomStatusBadge status={room.status} />
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 leading-normal">
            <span>Floor: <span className="font-semibold text-slate-700 dark:text-slate-300">{room.floor === 0 ? "Ground" : `${room.floor} Floor`}</span></span>
            <span className="text-slate-300 dark:text-slate-800">•</span>
            <span>Monthly Rent: <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">₹{room.monthlyRent}</span></span>
            <span className="text-slate-300 dark:text-slate-800">•</span>
            <span>Capacity: <span className="font-semibold text-slate-700 dark:text-slate-300">{persons.length}/{room.capacity} Tenants</span></span>
          </p>
        </div>
        <Link
          href={`/dashboard/properties/${propertyId}/rooms/${roomId}/add-person`}
          className={cn(buttonVariants(), "bg-brand hover:bg-brand/90 text-brand-foreground py-2.5 px-4 rounded-lg transition-colors flex items-center gap-2 text-xs")}
        >
          {persons.length === 0 ? "Add tenant" : "Add occupant"}
        </Link>
      </div>

      {/* Occupants cards container */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">Current Occupants</h2>

        {persons.length === 0 ? (
          <Card className="swiss-card border-dashed border-slate-200 dark:border-slate-800 py-10 flex flex-col items-center justify-center text-center">
            <User className="size-12 text-slate-400 dark:text-slate-700 mb-3" />
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">No tenants in this room yet.</p>
            <Link 
              href={`/dashboard/properties/${propertyId}/rooms/${roomId}/add-person`}
              className="text-xs text-brand hover:text-brand/80 underline font-medium mt-1.5 inline-block"
            >
              Add first tenant
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6">
            {persons.map((p) => {
              const initials = p.name
                ? p.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .substring(0, 2)
                : "T";

              return (
                <Card key={p.rowKey} className="swiss-card shadow-[0_1px_2px_rgba(0,0,0,0.05)] p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Primary profile segment */}
                    <div className="flex items-center gap-4">
                      {/* High-contrast initials container */}
                      <div className="size-12 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{p.name}</p>
                          <span className="text-[9px] px-2.5 py-0.5 font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-400 rounded-sm">
                            {p.role}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 leading-normal">
                          <Phone className="size-3.5 text-slate-400" /> 
                          <span className="font-medium text-slate-700 dark:text-slate-300">{p.phone}</span>
                        </p>
                      </div>
                    </div>

                    {/* Metadata columns */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-4 lg:pt-0 lg:pl-8 flex-1">
                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">Documents</p>
                        <p className="mt-1.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          {p.isVerified ? (
                            <>
                              <FileText className="size-4 text-emerald-600 dark:text-emerald-400" />
                              <span className="text-emerald-700 dark:text-emerald-400">Verified</span>
                            </>
                          ) : (
                            <>
                              <FileText className="size-4 text-slate-400" />
                              <span className="text-slate-500 font-semibold">Manual file</span>
                            </>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">Check-In Date</p>
                        <p className="mt-1.5 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                          <Calendar className="size-3.5 text-slate-400" /> {p.moveInDate}
                        </p>
                      </div>

                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none">Emergency Contact</p>
                        <p className="mt-1.5 font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={p.emergencyContact}>
                          {p.emergencyContact || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Quick-action buttons aligned neatly */}
                    <div className="flex sm:flex-row lg:flex-col gap-2 border-t sm:border-t-0 pt-4 sm:pt-0 justify-end flex-shrink-0">
                      <Link
                        href={`/dashboard/tenants/${p.rowKey}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "text-brand hover:text-brand/80 font-semibold text-xs border border-brand/30 hover:border-brand/50 px-4 py-2 hover:bg-brand-muted/60 dark:hover:bg-brand-muted/30"
                        )}
                      >
                        View Tenant Record
                      </Link>
                      <a
                        href={`tel:${p.phone}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white font-semibold text-xs border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 px-4 py-2"
                        )}
                      >
                        Contact Tenant
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
