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
  phone?: string;
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
  const [verificationState, setVerificationState] = useState(sessionState ?? "");
  const [aadhaarNumber, setAadhaarNumber] = useState("");
  const [aadhaarOtp, setAadhaarOtp] = useState("");
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarConsent, setAadhaarConsent] = useState(false);
  const [contactPhone, setContactPhone] = useState("");

  const loadSession = useCallback(async (state = verificationState) => {
    if (!state) return;
    const res = await fetch(
      `/api/verify/digilocker/status?state=${encodeURIComponent(state)}`,
    );
    if (!res.ok) return;
    const data = await res.json();
    if (data.profile) setProfile(data.profile);
  }, [verificationState]);

  useEffect(() => {
    if (!sessionState || profile) return;
    setVerificationState(sessionState);

    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      await loadSession(sessionState);
    };

    poll();
    if (!verified) return;

    const interval = window.setInterval(() => {
      if (attempts >= 10) {
        window.clearInterval(interval);
        return;
      }
      poll();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [verified, sessionState, loadSession, profile]);

  async function startDigiLocker() {
    setLoading(true);
    const res = await fetch("/api/verify/digilocker/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        propertyId,
        role,
        contactPhone: contactPhone || undefined,
      }),
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

    const { authUrl, state } = await res.json();
    if (state) setVerificationState(state);
    toast.info("Redirecting to Sandbox DigiLocker verification.");
    window.location.assign(authUrl);
  }

  async function sendAadhaarOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!aadhaarConsent) {
      toast.error("Consent is required before Aadhaar OTP verification");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/verify/aadhaar/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        propertyId,
        role,
        aadhaarNumber,
        contactPhone: contactPhone || undefined,
        consent: aadhaarConsent,
      }),
    });
    setLoading(false);

    if (res.status === 503) {
      setDigilockerConfigured(false);
      toast.error("Sandbox KYC is not configured");
      return;
    }
    if (!res.ok) {
      toast.error("Could not send Aadhaar OTP");
      return;
    }

    const data = await res.json();
    setVerificationState(data.state);
    setAadhaarNumber("");
    setAadhaarOtpSent(true);
    toast.success("OTP sent to the Aadhaar-linked mobile number");
  }

  async function verifyAadhaarOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!verificationState) {
      toast.error("Start Aadhaar verification first");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/verify/aadhaar/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state: verificationState, otp: aadhaarOtp }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error("Aadhaar OTP verification failed");
      return;
    }

    setAadhaarOtp("");
    await loadSession(verificationState);
    toast.success("Aadhaar verified");
  }

  async function confirmTenant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!verificationState || !profile) {
      toast.error("Complete KYC verification first");
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
        sessionState: verificationState,
        role,
        phone: form.get("phone") || profile.phone,
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
    router.push(`/dashboard/tenants/${data.id}`);
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
            <CardTitle>Step 1 - KYC verification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!digilockerConfigured && (
              <p className="text-sm text-muted-foreground">
                Configure Sandbox KYC credentials in .env.local.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="contactPhone">Contact mobile</Label>
                <Input
                  id="contactPhone"
                  inputMode="numeric"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={contactPhone}
                  onChange={(e) =>
                    setContactPhone(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>
              <form onSubmit={sendAadhaarOtp} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber">Aadhaar number</Label>
                  <Input
                    id="aadhaarNumber"
                    inputMode="numeric"
                    maxLength={12}
                    pattern="[0-9]{12}"
                    value={aadhaarNumber}
                    onChange={(e) =>
                      setAadhaarNumber(e.target.value.replace(/\D/g, ""))
                    }
                    required
                  />
                </div>
                <label className="flex items-start gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={aadhaarConsent}
                    onChange={(e) => setAadhaarConsent(e.target.checked)}
                  />
                  I have the tenant's consent to verify Aadhaar for KYC.
                </label>
                <Button type="submit" disabled={loading || aadhaarNumber.length !== 12}>
                  Send OTP
                </Button>
              </form>

              <form onSubmit={verifyAadhaarOtp} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="aadhaarOtp">Aadhaar OTP</Label>
                  <Input
                    id="aadhaarOtp"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.replace(/\D/g, ""))}
                    disabled={!aadhaarOtpSent}
                    required
                  />
                </div>
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading || !aadhaarOtpSent || aadhaarOtp.length !== 6}
                >
                  Verify OTP
                </Button>
              </form>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={startDigiLocker} disabled={loading}>
                Verify via Sandbox DigiLocker
              </Button>
              {verificationState && (
                <Button
                  variant="outline"
                  onClick={() => loadSession(verificationState)}
                  disabled={loading}
                >
                  I completed verification - refresh
                </Button>
              )}
            </div>
            {sessionState && !verificationState && (
              <Button
                variant="outline"
                onClick={() => loadSession(sessionState)}
                disabled={loading}
              >
                Refresh verification
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Step 2 - Review & confirm</CardTitle>
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
                <Input
                  id="phone"
                  name="phone"
                  defaultValue={profile.phone ?? contactPhone}
                  required
                  placeholder="98XXXXXXXX"
                />
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
