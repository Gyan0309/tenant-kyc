import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck } from "lucide-react";

export function ConsentBanner() {
  return (
    <Alert className="border-indigo-200 bg-indigo-50/30 dark:border-indigo-900/40 dark:bg-indigo-950/10 text-indigo-900 dark:text-indigo-400 p-4 rounded-xl flex items-start gap-3 shadow-none">
      <ShieldCheck className="size-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
      <div className="space-y-1 flex-1">
        <AlertTitle className="font-bold text-xs uppercase tracking-wider text-indigo-800 dark:text-indigo-300">Consent & Purpose Notice</AlertTitle>
        <AlertDescription className="text-xs text-indigo-700/80 dark:text-indigo-500 leading-relaxed mt-1">
          Tenant identity data is collected solely for property occupancy records, in compliance with the Digital Personal Data Protection (DPDP) Act. Store only the Aadhaar document and a masked reference, after the tenant has provided consent.
        </AlertDescription>
      </div>
    </Alert>
  );
}
