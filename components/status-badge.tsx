import { Badge } from "@/components/ui/badge";
import type { RoomStatus } from "@/lib/types/enums";
import { ShieldCheck, FileText, Bed, UserCheck } from "lucide-react";

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  if (status === "OCCUPIED") {
    return (
      <Badge className="bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-none font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit rounded-full px-2.5 py-0.5 shadow-none">
        <Bed className="size-3" /> Occupied
      </Badge>
    );
  }
  if (status === "PARTIAL") {
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit rounded-full px-2.5 py-0.5 shadow-none">
        <UserCheck className="size-3" /> Partial
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit rounded-full px-2.5 py-0.5 shadow-none">
      Vacant
    </Badge>
  );
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit rounded-full px-3 py-1 shadow-none">
        <ShieldCheck className="size-3.5 text-emerald-600 dark:text-emerald-400" /> Officially Verified
      </Badge>
    );
  }
  return (
    <Badge className="bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-800 font-semibold text-[10px] uppercase tracking-wider flex items-center gap-1 w-fit rounded-full px-3 py-1 shadow-none">
      <FileText className="size-3.5 text-slate-500 dark:text-slate-400" /> Manual Document
    </Badge>
  );
}
