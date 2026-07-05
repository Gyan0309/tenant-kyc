"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Fingerprint, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { DatePicker } from "@/components/ui/date-picker";
import { isAdultDob, maxAdultDob } from "@/lib/age";
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
  const [selectedFileName, setSelectedFileName] = useState("");
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPdf = /\.pdf$/i.test(selectedFileName);

  async function createTenant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = new FormData(e.currentTarget);
    const dob = (form.get("dob") as string) || "";
    if (!dob) {
      toast.error("Date of birth is required");
      return;
    }
    if (!isAdultDob(dob)) {
      toast.error("Occupant must be at least 18 years old");
      return;
    }
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
    <div className="space-y-5">
      <Link
        href={`/dashboard/properties/${propertyId}/rooms/${roomId}`}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to room
      </Link>

      <div className="mx-auto w-full max-w-3xl space-y-5">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
            Add tenant
          </h1>
          <p className="text-sm text-muted-foreground">
            Save tenant details and upload the Aadhaar supplied by the tenant.
          </p>
        </div>

        <form onSubmit={createTenant} className="space-y-5">
          <Card className="swiss-card p-6">
            <CardContent className="space-y-6 p-0">
              {/* Tenant details */}
              <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Tenant details
                </h2>

                {defaultRole !== "PRIMARY" && (
                  <div className="max-w-xs space-y-1.5">
                    <Label className="text-xs font-medium text-foreground">Occupant role</Label>
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

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium text-foreground">Full name</Label>
                    <Input id="name" name="name" required className="swiss-focus h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium text-foreground">Phone number</Label>
                    <Input id="phone" name="phone" inputMode="tel" placeholder="98XXXXXXXX" required className="swiss-focus h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs font-medium text-foreground">Date of birth (18+)</Label>
                    <DatePicker id="dob" name="dob" required max={maxAdultDob()} placeholder="Select date" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="gender" className="text-xs font-medium text-foreground">Gender</Label>
                    <input type="hidden" name="gender" value={gender} />
                    <Select value={gender} onValueChange={(value) => setGender(value ?? "")}>
                      <SelectTrigger id="gender" className="h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="moveInDate" className="text-xs font-medium text-foreground">Move-in date</Label>
                    <DatePicker id="moveInDate" name="moveInDate" required placeholder="Select date" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContact" className="text-xs font-medium text-foreground">Emergency contact</Label>
                    <Input id="emergencyContact" name="emergencyContact" placeholder="Name - Phone" className="swiss-focus h-9" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-medium text-foreground">Address</Label>
                  <Textarea id="address" name="address" required rows={2} className="swiss-focus" />
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Aadhaar document */}
              <div className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Aadhaar document
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="aadhaarLast4" className="text-xs font-medium text-foreground">Aadhaar last 4 digits</Label>
                    <div className="relative">
                      <Fingerprint className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="aadhaarLast4"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="1234"
                        value={aadhaarLast4}
                        onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        className="swiss-focus h-9 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="aadhaarFile" className="text-xs font-medium text-foreground">Aadhaar scan</Label>
                    <Input
                      id="aadhaarFile"
                      name="aadhaarFile"
                      type="file"
                      accept="image/*,.pdf"
                      required
                      onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? "")}
                      className="swiss-focus h-9 cursor-pointer text-xs"
                    />
                  </div>
                </div>

                {selectedFileName && (
                  <div className="flex items-center gap-2 rounded-lg border border-brand/40 bg-brand-muted/40 px-3 py-2 text-xs">
                    <Check className="size-4 flex-shrink-0 text-brand" />
                    <span className="truncate font-medium text-foreground">{selectedFileName}</span>
                    <span className="ml-auto flex-shrink-0 text-muted-foreground">Ready</span>
                  </div>
                )}
                {!selectedFileName && (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                    <UploadCloud className="size-4 flex-shrink-0" />
                    Select a PDF or image up to 4MB (required).
                  </div>
                )}

                {/* Password-protected PDF (e.g. eAadhaar) handling */}
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <label className="flex cursor-pointer select-none items-start gap-2.5 text-xs text-foreground">
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
                      <Label htmlFor="aadhaarPassword" className="text-xs font-medium text-foreground">Document password</Label>
                      <Input
                        id="aadhaarPassword"
                        name="aadhaarPassword"
                        type="password"
                        autoComplete="off"
                        placeholder="Password to open the PDF"
                        className="swiss-focus h-9 max-w-xs"
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
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={loading}
              className="h-10 gap-2 rounded-lg bg-brand px-6 text-sm text-brand-foreground hover:bg-brand/90"
            >
              {loading ? "Saving…" : "Save tenant"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
