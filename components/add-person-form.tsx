"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConsentBanner } from "@/components/consent-banner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PersonRole } from "@/lib/types/enums";

interface Profile {
  name: string;
  dob: string;
  gender: string;
  address: string;
  maskedAadhaar: string;
  photoBlobKey?: string;
}

export function AddPersonForm({
  propertyId,
  roomId,
  sessionState,
  verified,
  defaultRole = "PRIMARY",
}: {
  propertyId: string;
  roomId: string;
  sessionState?: string;
  verified?: boolean;
  defaultRole?: PersonRole;
}) {
  const router = useRouter();
  const [role, setRole] = useState<PersonRole>(defaultRole);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [digilockerConfigured, setDigilockerConfigured] = useState(true);

  const loadSession = useCallback(async () => {
    if (!sessionState) return;
    const res = await fetch(
      `/api/verify/digilocker/status?state=${encodeURIComponent(sessionState)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.profile) setProfile(data.profile);
  }, [sessionState]);

  useEffect(() => {
    if (verified && sessionState) loadSession();
  }, [verified, sessionState, loadSession]);

  async function startDigiLocker() {
    setLoading(true);
    const res = await fetch("/api/verify/digilocker/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, propertyId, role }),
    });
    setLoading(false);

    if (res.status === 503) {
      setDigilockerConfigured(false);
      toast.error("DigiLocker not configured — see docs/digilocker-integration.md");
      return;
    }

    if (!res.ok) {
      toast.error("Could not start DigiLocker verification");
      return;
    }

    const { authUrl } = await res.json();
    window.open(authUrl, "_blank", "noopener,noreferrer");
    toast.info("Complete verification on the tenant's device, then return here.");
  }

  async function confirmTenant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!sessionState || !profile) {
      toast.error("Complete DigiLocker verification first");
      return;
    }

    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/tenants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        propertyId,
        sessionState,
        role,
        phone: form.get("phone"),
        moveInDate: form.get("moveInDate"),
        emergencyContact: form.get("emergencyContact") || undefined,
        name: form.get("name") || profile.name,
        dob: form.get("dob") || profile.dob,
        gender: form.get("gender") || profile.gender,
        address: form.get("address") || profile.address,
        maskedAadhaar: form.get("maskedAadhaar") || profile.maskedAadhaar,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Failed to save tenant");
      return;
    }

    const data = await res.json();
    toast.success("Tenant saved");
    router.push(`/tenants/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Add tenant</h1>
      <ConsentBanner />

      {defaultRole !== "PRIMARY" && (
        <div className="space-y-2">
          <Label>Role</Label>
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

      {!profile ? (
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — DigiLocker verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!digilockerConfigured && (
              <p className="text-sm text-muted-foreground">
                Configure DigiLocker credentials in .env.local (see docs).
              </p>
            )}
            <Button onClick={startDigiLocker} disabled={loading}>
              Verify via DigiLocker
            </Button>
            {sessionState && (
              <Button variant="outline" onClick={loadSession} disabled={loading}>
                I completed verification — refresh
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Review & confirm</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={confirmTenant} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={profile.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of birth</Label>
                  <Input id="dob" name="dob" defaultValue={profile.dob} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input id="gender" name="gender" defaultValue={profile.gender} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maskedAadhaar">Masked Aadhaar</Label>
                  <Input
                    id="maskedAadhaar"
                    name="maskedAadhaar"
                    defaultValue={profile.maskedAadhaar}
                    readOnly
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" defaultValue={profile.address} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" name="phone" required placeholder="98XXXXXXXX" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="moveInDate">Move-in date</Label>
                <Input id="moveInDate" name="moveInDate" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency contact</Label>
                <Input id="emergencyContact" name="emergencyContact" />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving…" : "Confirm & save tenant"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
