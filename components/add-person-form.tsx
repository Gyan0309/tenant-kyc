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
  const [loading, setLoading] = useState(false);

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
    <div className="max-w-4xl space-y-6">
      <div>
        <Link
          href={`/dashboard/properties/${propertyId}/rooms/${roomId}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="size-3.5" /> Back to Room
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
          Add Tenant
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
          Save tenant details and upload the Aadhaar scan supplied by the tenant.
        </p>
      </div>

      <div className="flex items-center gap-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full flex items-center justify-center font-bold text-xs border-2 bg-white border-indigo-600 text-indigo-600 dark:bg-slate-950">
            1
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Tenant Details
          </span>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full flex items-center justify-center font-bold text-xs border-2 bg-white border-indigo-600 text-indigo-600 dark:bg-slate-950">
            2
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Aadhaar Upload
          </span>
        </div>
      </div>

      <ConsentBanner />

      <form onSubmit={createTenant} className="space-y-6">
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none flex items-center gap-2">
              <UserPlus className="size-4 text-indigo-600" /> Tenant Record
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1.5 leading-normal">
              This information is stored in Azure Table Storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {defaultRole !== "PRIMARY" && (
              <div className="space-y-2 max-w-xs">
                <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Occupant Role
                </Label>
                <Select value={role} onValueChange={(v) => setRole(v as PersonRole)}>
                  <SelectTrigger className="border-slate-200 dark:border-slate-800">
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
                <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Full Name
                </Label>
                <Input id="name" name="name" required className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  inputMode="tel"
                  placeholder="98XXXXXXXX"
                  required
                  className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Date of Birth
                </Label>
                <Input id="dob" name="dob" type="date" className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Gender
                </Label>
                <input type="hidden" name="gender" value={gender} />
                <Select value={gender} onValueChange={(value) => setGender(value ?? "")}>
                  <SelectTrigger id="gender" className="border-slate-200 dark:border-slate-800">
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
                <Label htmlFor="moveInDate" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Move-in Date
                </Label>
                <Input id="moveInDate" name="moveInDate" type="date" required className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Emergency Contact
                </Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  placeholder="Name - Phone"
                  className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                Address
              </Label>
              <Textarea
                id="address"
                name="address"
                required
                rows={3}
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none flex items-center gap-2">
              <FileText className="size-4 text-indigo-600" /> Aadhaar Document
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1.5 leading-normal">
              The file is stored as a private blob. Only a masked reference is stored in the tenant row.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aadhaarLast4" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Aadhaar Last 4 Digits
                </Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-3 size-4 text-slate-400" />
                  <Input
                    id="aadhaarLast4"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="1234"
                    value={aadhaarLast4}
                    onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="pl-10 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadhaarFile" className="text-slate-700 dark:text-slate-300 font-medium text-xs">
                  Aadhaar Scan
                </Label>
                <Input
                  id="aadhaarFile"
                  name="aadhaarFile"
                  type="file"
                  accept="image/*,.pdf"
                  required
                  onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? "")}
                  className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 cursor-pointer text-xs"
                />
              </div>
            </div>

            <div className={cn(
              "border-2 border-dashed rounded-lg p-6 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col items-center justify-center text-center transition-colors",
              selectedFileName
                ? "border-indigo-300 dark:border-indigo-800"
                : "border-slate-200 dark:border-slate-800",
            )}>
              {selectedFileName ? (
                <>
                  <Check className="size-8 text-indigo-600 mb-2" />
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    {selectedFileName}
                  </p>
                  <p className="text-[10px] text-slate-400">Ready to upload</p>
                </>
              ) : (
                <>
                  <UploadCloud className="size-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-semibold mb-1">
                    PDF or image up to 4MB
                  </p>
                  <p className="text-[10px] text-slate-400">Aadhaar file is required for tenant creation</p>
                </>
              )}
            </div>

            <label className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 accent-indigo-600"
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
          className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-5 shadow-sm transition-colors text-xs"
        >
          {loading ? "Saving Tenant..." : "Save Tenant"}
        </Button>
      </form>
    </div>
  );
}
