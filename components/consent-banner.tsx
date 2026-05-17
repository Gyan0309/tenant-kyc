import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield } from "lucide-react";

export function ConsentBanner() {
  return (
    <Alert>
      <Shield className="size-4" />
      <AlertTitle>Consent & purpose</AlertTitle>
      <AlertDescription>
        Tenant identity data is collected solely for KYC verification and
        property occupancy records, in compliance with the Digital Personal
        Data Protection Act. Only masked Aadhaar numbers are stored. The tenant
        must complete DigiLocker consent on their own device.
      </AlertDescription>
    </Alert>
  );
}
