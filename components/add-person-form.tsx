"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, FileText, Fingerprint, UploadCloud, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentBanner } from "@/components/consent-banner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PersonRole } from "@/lib/types/enums";

export function AddPersonForm({
  propertyId,
  roomId,
  defaultRole = "PRIMARY",
}: {
  propertyId: string;
  roomId: string;
  defaultRole?: PersonRole;
}) {
  const router = useRouter();
  const [role, setRole] = useState<PersonRole>(defaultRole);
  const [gender, setGender] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [documentConsent, setDocumentConsent] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPdf = /\.pdf$/i.test(selectedFileName);

  async function createTenant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!documentConsent) {
      toast.error("Confirm tenant consent before saving the Aadhaar document");
      return;
    }

    const form = new FormData(e.currentTarget);
    form.set("propertyId", propertyId);
    form.set("roomId", roomId);
    form.set("role", role);
    form.set("gender", gender);
    form.set("aadhaarLast4", aadhaarLast4);
    form.set("documentConsent", "true");

    setLoading(true);
    const res = await fetch("/api/tenants", {
      method: "POST",
      body: form,
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Failed to save tenant");
      return;
    }

    const data = await res.json();
    toast.success("Tenant saved with Aadhaar document");
    router.push(`/dashboard/tenants/${data.id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <Link
          href={`/dashboard/properties/${propertyId}/rooms/${roomId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Back to room
        </Link>
      </div>

      <div className="space-y-1 text-center">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          Add tenant
        </h1>
        <p className="text-sm text-muted-foreground">
          Save tenant details and upload the Aadhaar supplied by the tenant.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-foreground">
            1
          </div>
          <span className="text-xs font-medium text-foreground">Tenant details</span>
        </div>
        <div className="h-px flex-1 bg-border" />
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
            2
          </div>
          <span className="text-xs font-medium text-muted-foreground">Aadhaar upload</span>
        </div>
      </div>

      <ConsentBanner />

      <form onSubmit={createTenant} className="space-y-6">
        <Card className="swiss-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold leading-none text-foreground">
              <UserPlus className="size-4 text-brand" /> Tenant record
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-muted-foreground">
              This information is stored in Azure Table Storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {defaultRole !== "PRIMARY" && (
              <div className="space-y-2 max-w-xs">
                <Label className="text-xs font-medium text-foreground">
                  Occupant Role
                </Label>
                <Select value={role} onValueChange={(v) => setRole(v as PersonRole)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROOMMATE">Roommate</SelectItem>
                    <SelectItem value="FAMILY">Family member</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-medium text-foreground">
                  Full Name
                </Label>
                <Input id="name" name="name" required className="swiss-focus" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  placeholder="98XXXXXXXX"
                  required
                  className="swiss-focus"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-xs font-medium text-foreground">
                  Date of Birth
                </Label>
                <Input id="dob" name="dob" type="date" className="swiss-focus" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-xs font-medium text-foreground">
                  Gender
                </Label>
                <input type="hidden" name="gender" value={gender} />
                <Select value={gender} onValueChange={(value) => setGender(value ?? "")}>
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="moveInDate" className="text-xs font-medium text-foreground">
                  Move-in Date
                </Label>
                <Input id="moveInDate" name="moveInDate" type="date" required className="swiss-focus" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-xs font-medium text-foreground">
                  Emergency Contact
                </Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  placeholder="Name - Phone"
                  className="swiss-focus"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-medium text-foreground">
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                required
                rows={3}
                className="swiss-focus"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="swiss-card">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold leading-none text-foreground">
              <FileText className="size-4 text-brand" /> Aadhaar document
            </CardTitle>
            <CardDescription className="mt-1.5 text-xs text-muted-foreground">
              The file is stored as a private blob. Only a masked reference is stored in the tenant row.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aadhaarLast4" className="text-xs font-medium text-foreground">
                  Aadhaar last 4 digits
                </Label>
                <div className="relative">
                  <Fingerprint className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="aadhaarLast4"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="swiss-focus pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaarFile" className="text-xs font-medium text-foreground">
                  Aadhaar scan
                </Label>
                <Input
                  id="aadhaarFile"
                  name="aadhaarFile"
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? "")}
                  className="swiss-focus cursor-pointer text-xs"
                />
              </div>
            </div>

            <div className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
              selectedFileName
                ? "border-brand/40 bg-brand-muted/40"
                : "border-border bg-muted/30",
            )}>
              {selectedFileName ? (
                <>
                  <Check className="mb-2 size-7 text-brand" />
                  <p className="mb-1 text-xs font-medium text-foreground">
                    {selectedFileName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Ready to upload</p>
                </>
              ) : (
                <>
                  <UploadCloud className="mb-2 size-7 text-muted-foreground" />
                  <p className="mb-1 text-xs font-medium text-foreground">
                    PDF or image up to 4MB
                  </p>
                  <p className="text-[11px] text-muted-foreground">Aadhaar file is required for tenant creation</p>
                </>
              )}
            </div>

            {/* Password-protected PDF (e.g. eAadhaar) handling */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-foreground">
                <input
                  type="checkbox"
                  className="mt-0.5 accent-[var(--brand)]"
                  checked={passwordProtected}
                  onChange={(e) => setPasswordProtected(e.target.checked)}
                />
                <span>
                  This PDF is password protected
                  <span className="text-muted-foreground"> — e.g. an eAadhaar / DigiLocker PDF</span>
                </span>
              </label>

              {passwordProtected && (
                <div className="mt-3 space-y-1.5">
                  <Label htmlFor="aadhaarPassword" className="text-xs font-medium text-foreground">
                    Document password
                  </Label>
                  <Input
                    id="aadhaarPassword"
                    name="aadhaarPassword"
                    type="password"
                    autoComplete="off"
                    placeholder="Password to open the PDF"
                    className="swiss-focus max-w-xs"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    We unlock the file and store an unprotected copy. The password is never saved.
                    {!isPdf && selectedFileName && (
                      <span className="text-amber-600"> The selected file isn’t a PDF, so this is ignored.</span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="mt-0.5 accent-[var(--brand)]"
                checked={documentConsent}
                onChange={(e) => setDocumentConsent(e.target.checked)}
              />
              <span>I confirm the tenant provided this Aadhaar document for occupancy records.</span>
            </label>
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={loading || !documentConsent}
          className="h-10 w-full gap-2 rounded-lg bg-brand px-5 text-sm text-brand-foreground hover:bg-brand/90 sm:w-auto"
        >
          {loading ? "Saving Tenant..." : "Save Tenant"}
        </Button>
      </form>
    </div>
  );
}
