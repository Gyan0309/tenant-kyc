"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VerifiedBadge } from "@/components/status-badge";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DOC_TYPES, type DocType } from "@/lib/types/enums";
import Link from "next/link";
import { 
  ArrowLeft, 
  Phone, 
  Calendar, 
  User, 
  ShieldCheck, 
  FileText, 
  UploadCloud, 
  Users, 
  Trash2, 
  Lock,
  Eye,
  CheckCircle2
} from "lucide-react";

interface TenantData {
  id: string;
  roomId: string;
  propertyId: string;
  role: string;
  name: string;
  dob: string;
  gender: string;
  maskedAadhaar: string;
  phone: string;
  address: string;
  isVerified: boolean;
  verifiedAt: string;
  moveInDate: string;
  emergencyContact: string;
  documents: {
    id: string;
    docType: string;
    isVerified: boolean;
    source: string;
    uploadedAt: string;
  }[];
}

export function TenantDetailClient({ tenantId }: { tenantId: string }) {
  const router = useRouter();
  const [tenant, setTenant] = useState<TenantData | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [docType, setDocType] = useState<DocType>("PAN");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (!res.ok) return;
      const data = await res.json();
      setTenant(data);

      const photoRes = await fetch(`/api/persons/${tenantId}/photo-url`);
      if (photoRes.ok) {
        const { url } = await photoRes.json();
        setPhotoUrl(url);
      }
    }
    load();
  }, [tenantId]);

  async function viewDocument(docId: string) {
    const res = await fetch(`/api/documents/${docId}/signed-url`);
    if (!res.ok) {
      toast.error("Could not load document");
      return;
    }
    const { url } = await res.json();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function uploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;
    const form = new FormData(e.currentTarget);
    form.set("personId", tenant.id);
    form.set("docType", docType);

    setLoading(true);
    const res = await fetch("/api/documents/upload", {
      method: "POST",
      body: form,
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Upload failed");
      return;
    }
    toast.success("Document uploaded");
    router.refresh();
    const t = await fetch(`/api/tenants/${tenantId}`);
    if (t.ok) setTenant(await t.json());
  }

  async function deleteTenant(erasure = false) {
    if (
      !confirm(
        erasure
          ? "Request data erasure? This logs a DPDP erasure request."
          : "Remove this tenant from the room?",
      )
    ) {
      return;
    }

    const res = await fetch(
      `/api/tenants/${tenantId}${erasure ? "?erasure=1" : ""}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success(erasure ? "Erasure request logged" : "Tenant removed");
    router.push(`/dashboard/properties/${tenant?.propertyId}/rooms/${tenant?.roomId}`);
  }

  if (!tenant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="size-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Loading compliance report…</p>
      </div>
    );
  }

  const initials = tenant.name
    ? tenant.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "T";

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link 
          href={`/dashboard/properties/${tenant.propertyId}/rooms/${tenant.roomId}`} 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="size-3.5" /> Back to Room Details
        </Link>
      </div>

      {/* Main Grid Section: Asymmetrical Grid (col-span-4 vs col-span-8) */}
      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column (1/3 width: Profile Verification Summary) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="swiss-card shadow-xs overflow-hidden">
            <div className="bg-slate-950 p-6 flex flex-col items-center text-center text-white">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoUrl}
                  alt={tenant.name}
                  className="size-24 rounded-full object-cover border border-slate-800 bg-slate-900 mb-4"
                />
              ) : (
                <div className="size-24 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-400 mb-4">
                  {initials}
                </div>
              )}
              <h2 className="text-xl font-bold tracking-tight">{tenant.name}</h2>
              <span className="text-[9px] px-2 py-0.5 mt-1.5 font-bold uppercase tracking-wider bg-slate-800 text-slate-300 rounded-sm">
                {tenant.role}
              </span>
              <div className="mt-4">
                <VerifiedBadge verified={tenant.isVerified} />
              </div>
            </div>
            
            <CardContent className="p-0 text-xs">
              <div className="divide-y divide-slate-100 dark:divide-slate-900">
                <div className="px-6 py-3.5 flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Phone</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                    <Phone className="size-3.5 text-slate-400" /> {tenant.phone}
                  </span>
                </div>
                <div className="px-6 py-3.5 flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">DOB</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">{tenant.dob}</span>
                </div>
                <div className="px-6 py-3.5 flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Gender</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold capitalize">{tenant.gender}</span>
                </div>
                <div className="px-6 py-3.5 flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Aadhaar</span>
                  <span className="text-slate-800 dark:text-slate-200 font-mono font-semibold">{tenant.maskedAadhaar || "—"}</span>
                </div>
                <div className="px-6 py-3.5 flex flex-col gap-1.5">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Permanent Address</span>
                  <span className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {tenant.address}
                  </span>
                </div>
                <div className="px-6 py-3.5 flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Move-In Date</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold flex items-center gap-1">
                    <Calendar className="size-3.5 text-slate-400" /> {tenant.moveInDate}
                  </span>
                </div>
                <div className="px-6 py-3.5 flex justify-between gap-4">
                  <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Emergency</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[140px]" title={tenant.emergencyContact}>
                    {tenant.emergencyContact || "—"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (2/3 width: Documents, Timeline & DPDP compliance) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Documents Card */}
          <Card className="swiss-card shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none">Verification Documents</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1.5 leading-normal">
                Strict compliance storage. Links expire automatically in 1 hour.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {tenant.documents.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <FileText className="size-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No verified documents available.</p>
                </div>
              ) : (
                tenant.documents.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-white dark:bg-slate-950/20 hover:border-slate-300 transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2.5 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <FileText className="size-4.5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-200 text-sm leading-none">{d.docType}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                          {d.source} · {d.isVerified ? "Verified" : "Manual upload"}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => viewDocument(d.id)}
                      className="text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 flex items-center gap-1.5 px-3 py-1.5"
                    >
                      <Eye className="size-3.5" /> View File
                    </Button>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Dotted border upload card */}
          <Card className="swiss-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none">Upload Supplementary Document</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={uploadDocument} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs">Document Type</Label>
                    <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
                      <SelectTrigger className="border-slate-200 dark:border-slate-800">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DOC_TYPES.filter((t) => t !== "AADHAAR" && t !== "PHOTO").map(
                          (t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="file" className="text-slate-700 dark:text-slate-300 font-medium text-xs">File Selection</Label>
                    <Input 
                      id="file" 
                      name="file" 
                      type="file" 
                      accept="image/*,.pdf" 
                      required 
                      className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-500 cursor-pointer text-xs"
                    />
                  </div>
                </div>

                <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-800 rounded-lg p-6 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col items-center justify-center text-center transition-colors">
                  <UploadCloud className="size-8 text-slate-400 mb-2" />
                  <p className="text-xs text-slate-500 font-semibold mb-1">Click the button below to upload the selected file</p>
                  <p className="text-[10px] text-slate-400">PDF or Image up to 4MB</p>
                </div>
                
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-sm transition-colors flex items-center gap-2"
                >
                  {loading ? "Uploading…" : "Commit Document"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Audit Log Vertical Timeline */}
          <Card className="swiss-card shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none">KYC Verification Audit Log</CardTitle>
              <CardDescription className="text-xs text-slate-500 mt-1">Compliance history under DPDP guidelines.</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 bg-emerald-600 border-4 border-white dark:border-slate-950 size-4.5 rounded-full" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    DigiLocker Consent & Fetch <CheckCircle2 className="size-3 text-emerald-600" />
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Tenant granted official access to Aadhaar credentials. Auditable OAuth2 verification session created.
                  </p>
                </div>
                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 bg-emerald-600 border-4 border-white dark:border-slate-950 size-4.5 rounded-full" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    Cryptographic Identity Matching <CheckCircle2 className="size-3 text-emerald-600" />
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Verified name, DOB, and address boundaries. Extracted masked Aadhaar reference codes.
                  </p>
                </div>
                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-[30px] top-1 bg-indigo-600 border-4 border-white dark:border-slate-950 size-4.5 rounded-full" />
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Owner Sign-off & Registry Log</h4>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Tenant record committed to registry. Verified stamp logged at {tenant.verifiedAt ? new Date(tenant.verifiedAt).toLocaleString() : new Date().toLocaleString()}.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roommates Section */}
          <Card className="swiss-card shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none">Roommates & Family Links</CardTitle>
            </CardHeader>
            <CardContent>
              <Link
                href={`/dashboard/properties/${tenant.propertyId}/rooms/${tenant.roomId}/add-person?role=ROOMMATE`}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "text-xs font-bold border-slate-200 dark:border-slate-800 hover:bg-slate-100 flex items-center gap-2"
                )}
              >
                <Users className="size-4 text-slate-400" /> Add Roommate via DigiLocker
              </Link>
            </CardContent>
          </Card>

          {/* DPDP Compliance Block (Danger Zone) */}
          <div className="border border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/10 p-6 rounded-lg space-y-4">
            <div className="flex items-center gap-2 text-rose-900 dark:text-rose-400">
              <Lock className="size-4.5 stroke-[2.5]" />
              <h3 className="font-extrabold text-sm tracking-tight uppercase">Right to Erasure (DPDP Act 2023)</h3>
            </div>
            
            <p className="text-xs text-rose-800/80 dark:text-rose-500/80 leading-relaxed">
              Under section 12 of the DPDP Act 2023, data principals have the right to erase all digital personal details upon cessation of purpose. Processing an erasure request deletes identity logs, masks, uploaded images, and verification timestamps from all active Azure tables and blob storages permanently.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-2">
              <Button 
                variant="destructive" 
                onClick={() => deleteTenant(false)}
                className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs py-2 shadow-xs transition-colors"
              >
                Remove Occupant
              </Button>
              <Button 
                variant="outline" 
                onClick={() => deleteTenant(true)}
                className="text-rose-800 border-rose-200 bg-white hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900/60 dark:bg-transparent dark:hover:bg-rose-950/20 font-semibold text-xs py-2 transition-colors"
              >
                Process Data Erasure
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
