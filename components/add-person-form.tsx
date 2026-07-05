"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Fingerprint, UploadCloud, ImagePlus } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { PersonRole } from "@/lib/types/enums";

export function AddPersonForm({
  propertyId,
  roomId,
  hasPrimary,
  primaryName,
  primaryAddress,
}: {
  propertyId: string;
  roomId: string;
  hasPrimary: boolean;
  primaryName: string;
  primaryAddress: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  const [role, setRole] = useState<PersonRole>(hasPrimary ? "ROOMMATE" : "PRIMARY");
  const [gender, setGender] = useState("");
  const [phone, setPhone] = useState("");
  const [aadhaarLast4, setAadhaarLast4] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [sameAddress, setSameAddress] = useState(true);
  const [collectAadhaar, setCollectAadhaar] = useState(true);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);

  const isPrimary = role === "PRIMARY";
  const isFamily = role === "FAMILY";
  const isPdf = /\.pdf$/i.test(selectedFileName);
  const primaryLabel = primaryName || "the primary tenant";
  // Whether an Aadhaar step exists: always for the primary; for co-occupants
  // only when the owner opts in.
  const twoStep = isPrimary || collectAadhaar;

  function validateStep1(fd: FormData): boolean {
    if (!((fd.get("name") as string) || "").trim()) {
      toast.error("Full name is required");
      return false;
    }
    if (!/^[1-9]\d{9}$/.test(phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return false;
    }
    const dob = (fd.get("dob") as string) || "";
    if (!dob) {
      toast.error("Date of birth is required");
      return false;
    }
    if (!isAdultDob(dob)) {
      toast.error("Occupant must be at least 18 years old");
      return false;
    }
    if (isFamily && !((fd.get("relation") as string) || "").trim()) {
      toast.error("Relation is required for a family member");
      return false;
    }
    if (isPrimary) {
      if (!((fd.get("moveInDate") as string) || "")) {
        toast.error("Move-in date is required");
        return false;
      }
      if (!((fd.get("address") as string) || "").trim()) {
        toast.error("Address is required");
        return false;
      }
    } else if (!sameAddress && !((fd.get("address") as string) || "").trim()) {
      toast.error("Address is required");
      return false;
    }
    return true;
  }

  function onContinue() {
    if (!formRef.current) return;
    if (validateStep1(new FormData(formRef.current))) setStep(2);
  }

  async function doSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    if (!validateStep1(form)) {
      setStep(1);
      return;
    }

    const aadhaarWanted = twoStep;
    const aadhaar = form.get("aadhaarFile");
    if (isPrimary && !(aadhaar instanceof File && aadhaar.size > 0)) {
      toast.error("Aadhaar document is required for the primary tenant");
      setStep(2);
      return;
    }

    form.set("propertyId", propertyId);
    form.set("roomId", roomId);
    form.set("role", role);
    form.set("gender", gender);
    form.set("phone", phone);
    form.set("documentConsent", "true");
    if (aadhaarWanted) form.set("aadhaarLast4", aadhaarLast4);
    if (!isPrimary && sameAddress) form.delete("address");
    // If the owner chose not to collect this co-occupant's Aadhaar, drop it.
    if (!aadhaarWanted) {
      form.delete("aadhaarFile");
      form.delete("aadhaarPassword");
      form.delete("aadhaarLast4");
    }

    setLoading(true);
    const res = await fetch("/api/tenants", { method: "POST", body: form });
    setLoading(false);

    if (!res.ok) {
      // Keep everything filled in so the owner can just correct and resubmit.
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "Failed to save occupant");
      return;
    }

    const data = await res.json();
    toast.success(isPrimary ? "Tenant saved" : "Member added");
    router.push(`/dashboard/tenants/${data.id}`);
    router.refresh();
  }

  const stepStyle = (n: 1 | 2) => cn(step !== n && "hidden");

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
            {hasPrimary ? "Add member" : "Add tenant"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {hasPrimary
              ? `Add a roommate or family member sharing this room with ${primaryLabel}.`
              : "Save the primary tenant's details and upload their Aadhaar."}
          </p>
        </div>

        {/* Step indicator (only when there's an Aadhaar step) */}
        {twoStep && (
          <div className="flex items-center gap-3">
            <StepDot n={1} active={step === 1} done={step > 1} label="Details" />
            <div className="h-px flex-1 bg-border" />
            <StepDot n={2} active={step === 2} done={false} label="Aadhaar" />
          </div>
        )}

        <form ref={formRef} onSubmit={doSubmit} noValidate className="space-y-5">
          {/* ---------------- Step 1: details ---------------- */}
          <Card className={cn("swiss-card p-6", stepStyle(1))}>
            <CardContent className="space-y-6 p-0">
              {hasPrimary && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-foreground">Member type</Label>
                  <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
                    {(["ROOMMATE", "FAMILY"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={cn(
                          "rounded-md px-5 py-1.5 text-xs font-medium transition-colors",
                          role === r
                            ? "bg-brand text-brand-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {r === "ROOMMATE" ? "Roommate" : "Family"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                {/* Optional photo */}
                <div className="flex flex-col items-center gap-2">
                  <label className="group relative flex size-20 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-brand/50">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="preview" className="size-full object-cover" />
                    ) : (
                      <ImagePlus className="size-5" />
                    )}
                    <input
                      name="photoFile"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        setPhotoPreview(f ? URL.createObjectURL(f) : null);
                      }}
                    />
                  </label>
                  <span className="text-[10px] text-muted-foreground">Photo (optional)</span>
                </div>

                <div className="grid flex-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-medium text-foreground">Full name</Label>
                    <Input id="name" name="name" className="swiss-focus h-9" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-xs font-medium text-foreground">Phone number</Label>
                    <Input
                      id="phone"
                      inputMode="numeric"
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="swiss-focus h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="dob" className="text-xs font-medium text-foreground">Date of birth (18+)</Label>
                    <DatePicker id="dob" name="dob" max={maxAdultDob()} placeholder="Select date" />
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
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {!isPrimary && (
                  <div className="space-y-1.5">
                    <Label htmlFor="relation" className="text-xs font-medium text-foreground">
                      Relation{isFamily ? "" : " (optional)"}
                    </Label>
                    <Input
                      id="relation"
                      name="relation"
                      placeholder={isFamily ? "e.g. Spouse, Son" : "e.g. Colleague"}
                      className="swiss-focus h-9"
                    />
                  </div>
                )}
                {isPrimary && (
                  <div className="space-y-1.5">
                    <Label htmlFor="moveInDate" className="text-xs font-medium text-foreground">Move-in date</Label>
                    <DatePicker id="moveInDate" name="moveInDate" placeholder="Select date" />
                  </div>
                )}
                {isPrimary && (
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyContact" className="text-xs font-medium text-foreground">Emergency contact (optional)</Label>
                    <Input id="emergencyContact" name="emergencyContact" placeholder="Name - Phone" className="swiss-focus h-9" />
                  </div>
                )}
              </div>

              {/* Address */}
              {isPrimary ? (
                <div className="space-y-1.5">
                  <Label htmlFor="address" className="text-xs font-medium text-foreground">Address</Label>
                  <Textarea id="address" name="address" rows={2} className="swiss-focus" />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="flex cursor-pointer select-none items-center gap-2.5 text-xs text-foreground">
                    <input
                      type="checkbox"
                      className="accent-[var(--brand)]"
                      checked={sameAddress}
                      onChange={(e) => setSameAddress(e.target.checked)}
                    />
                    <span>Same address as {primaryLabel}</span>
                  </label>
                  {!sameAddress && (
                    <Textarea name="address" rows={2} placeholder="Address" className="swiss-focus" />
                  )}
                  {sameAddress && primaryAddress && (
                    <p className="text-[11px] text-muted-foreground">{primaryAddress}</p>
                  )}
                </div>
              )}

              {/* Co-occupant: opt in/out of collecting Aadhaar */}
              {!isPrimary && (
                <label className="flex cursor-pointer select-none items-start gap-2.5 rounded-lg border border-border bg-muted/30 p-3 text-xs text-foreground">
                  <input
                    type="checkbox"
                    className="mt-0.5 accent-[var(--brand)]"
                    checked={collectAadhaar}
                    onChange={(e) => setCollectAadhaar(e.target.checked)}
                  />
                  <span>
                    Also collect this occupant&apos;s Aadhaar
                    <span className="text-muted-foreground"> — uncheck to skip the document step.</span>
                  </span>
                </label>
              )}
            </CardContent>
          </Card>

          {/* ---------------- Step 2: Aadhaar ---------------- */}
          <Card className={cn("swiss-card p-6", stepStyle(2))}>
            <CardContent className="space-y-4 p-0">
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
                    onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? "")}
                    className="swiss-focus h-9 cursor-pointer text-xs"
                  />
                </div>
              </div>

              {selectedFileName ? (
                <div className="flex items-center gap-2 rounded-lg border border-brand/40 bg-brand-muted/40 px-3 py-2 text-xs">
                  <Check className="size-4 flex-shrink-0 text-brand" />
                  <span className="truncate font-medium text-foreground">{selectedFileName}</span>
                  <span className="ml-auto flex-shrink-0 text-muted-foreground">Ready</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  <UploadCloud className="size-4 flex-shrink-0" />
                  {isPrimary ? "PDF or image up to 4MB (required)." : "Optional — PDF or image up to 4MB."}
                </div>
              )}

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
            </CardContent>
          </Card>

          {/* ---------------- Footer navigation ---------------- */}
          <div className="flex items-center justify-between">
            <div>
              {step === 2 && (
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="h-10 gap-1.5 rounded-lg">
                  <ArrowLeft className="size-4" /> Back
                </Button>
              )}
            </div>
            <div>
              {step === 1 && twoStep && (
                <Button type="button" onClick={onContinue} className="h-10 gap-2 rounded-lg bg-brand px-6 text-sm text-brand-foreground hover:bg-brand/90">
                  Continue <ArrowRight className="size-4" />
                </Button>
              )}
              {(step === 2 || !twoStep) && (
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-10 gap-2 rounded-lg bg-brand px-6 text-sm text-brand-foreground hover:bg-brand/90"
                >
                  {loading ? "Saving…" : hasPrimary ? "Save member" : "Save tenant"}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StepDot({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-xs font-semibold",
          active || done ? "bg-brand text-brand-foreground" : "bg-muted text-muted-foreground",
        )}
      >
        {done ? <Check className="size-3.5" /> : n}
      </div>
      <span className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
        {label}
      </span>
    </div>
  );
}
