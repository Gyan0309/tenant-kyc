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
    router.push(`/properties/${tenant?.propertyId}/rooms/${tenant?.roomId}`);
  }

  if (!tenant) {
    return <p className="text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-muted-foreground text-sm">
            {tenant.role} · Room occupant
          </p>
          <div className="mt-2">
            <VerifiedBadge verified={tenant.isVerified} />
          </div>
        </div>
        {photoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl}
            alt="Tenant"
            className="size-24 rounded-lg object-cover border"
          />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Phone:</span> {tenant.phone}
          </p>
          <p>
            <span className="text-muted-foreground">DOB:</span> {tenant.dob}
          </p>
          <p>
            <span className="text-muted-foreground">Gender:</span> {tenant.gender}
          </p>
          <p>
            <span className="text-muted-foreground">Masked Aadhaar:</span>{" "}
            {tenant.maskedAadhaar || "—"}
          </p>
          <p className="sm:col-span-2">
            <span className="text-muted-foreground">Address:</span> {tenant.address}
          </p>
          <p>
            <span className="text-muted-foreground">Move-in:</span>{" "}
            {tenant.moveInDate}
          </p>
          <p>
            <span className="text-muted-foreground">Verified at:</span>{" "}
            {tenant.verifiedAt || "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Short-lived SAS links · 1 hour expiry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tenant.documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No documents.</p>
          ) : (
            tenant.documents.map((d) => (
              <div
                key={d.id}
                className="flex items-center justify-between border rounded-md p-3"
              >
                <div>
                  <p className="font-medium">{d.docType}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.source} · {d.isVerified ? "Verified" : "Unverified"}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => viewDocument(d.id)}>
                  View
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload supplementary document</CardTitle>
          <CardDescription>PAN, driving licence, etc. (manual, unverified)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={uploadDocument} className="space-y-4">
            <div className="space-y-2">
              <Label>Document type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocType)}>
                <SelectTrigger>
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
              <Label htmlFor="file">File</Label>
              <Input id="file" name="file" type="file" accept="image/*,.pdf" required />
            </div>
            <Button type="submit" disabled={loading}>
              Upload
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roommates & family</CardTitle>
        </CardHeader>
        <CardContent>
          <Link
            href={`/properties/${tenant.propertyId}/rooms/${tenant.roomId}/add-person?role=ROOMMATE`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Add roommate via DigiLocker
          </Link>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="destructive" onClick={() => deleteTenant(false)}>
          Remove tenant
        </Button>
        <Button variant="outline" onClick={() => deleteTenant(true)}>
          Request data erasure
        </Button>
      </div>
    </div>
  );
}
