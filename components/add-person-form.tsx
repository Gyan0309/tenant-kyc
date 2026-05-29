"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { ArrowLeft, UserCheck, ShieldAlert, KeyRound, Smartphone, Check, DoorOpen, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
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
    setOtpArray(["", "", "", "", "", ""]);
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

  // Keyboard navigation for 6-digit OTP fields
  const handleOtpChange = (val: string, index: number) => {
    const cleanDigit = val.replace(/\D/g, "").substring(0, 1);
    const nextOtp = [...otpArray];
    nextOtp[index] = cleanDigit;
    setOtpArray(nextOtp);
    setAadhaarOtp(nextOtp.join(""));

    // Shift focus forward
    if (cleanDigit !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && otpArray[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Back Link */}
      <div>
        <Link 
          href={`/dashboard/properties/${propertyId}/rooms/${roomId}`} 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="size-3.5" /> Back to Room
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">Add Tenant</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 leading-relaxed">
          Verify background records using government identity verification gates.
        </p>
      </div>

      {/* Stepper Headers - Linear step system matching design tokens exactly */}
      <div className="flex items-center gap-4 py-4">
        {/* Step 1 */}
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "size-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-200",
            profile
              ? "bg-indigo-600 border-indigo-600 text-white" // Completed Step 1
              : "bg-white border-indigo-600 text-indigo-600 dark:bg-slate-950" // Active Step 1
          )}>
            {profile ? <Check className="size-4.5" /> : "1"}
          </div>
          <span className={cn(
            "text-sm font-bold tracking-tight",
            !profile ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
          )}>1. Identity Verification</span>
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
        {/* Step 2 */}
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "size-8 rounded-full flex items-center justify-center font-bold text-xs border-2 transition-all duration-200",
            profile
              ? "bg-white border-indigo-600 text-indigo-600 dark:bg-slate-950" // Active Step 2
              : "bg-slate-100 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800" // Pending Step 2
          )}>
            2
          </div>
          <span className={cn(
            "text-sm font-bold tracking-tight",
            profile ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
          )}>2. Confirm Profile</span>
        </div>
      </div>

      <ConsentBanner />

      {defaultRole !== "PRIMARY" && (
        <div className="space-y-2 max-w-xs">
          <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs">Occupant Role</Label>
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

      {!profile ? (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none">KYC Verification Gate</CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1.5 leading-normal">
              A secure identity validation mechanism for tenant onboarding.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!digilockerConfigured && (
              <div className="bg-amber-50 text-amber-800 p-3 rounded-lg text-xs font-semibold border border-amber-200 flex items-start gap-2">
                <ShieldAlert className="size-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  DigiLocker config parameters not found. Live credentials are required to launch official web portals.
                </span>
              </div>
            )}

            {/* Input Contact Phone */}
            <div className="space-y-2 max-w-md">
              <Label htmlFor="contactPhone" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Contact Mobile Number</Label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-3 size-4.5 text-slate-400" />
                <Input
                  id="contactPhone"
                  inputMode="numeric"
                  placeholder="98XXXXXXXX"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value.replace(/\D/g, ""))}
                  className="pl-10 border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
                />
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Used for communication and alerts.</p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-900 pt-6 grid gap-6 sm:grid-cols-2">
              {/* Option A: Direct OTP Gate */}
              <form onSubmit={sendAadhaarOtp} className="space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Option A - Direct Aadhaar API</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="aadhaarNumber" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Aadhaar Card Number</Label>
                  <Input
                     id="aadhaarNumber"
                     inputMode="numeric"
                     placeholder="12-digit Aadhaar"
                     maxLength={12}
                     pattern="[0-9]{12}"
                     value={aadhaarNumber}
                     onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ""))}
                     required
                     className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
                  />
                </div>

                <label className="flex items-start gap-2.5 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-800 text-indigo-600 accent-indigo-600"
                    checked={aadhaarConsent}
                    onChange={(e) => setAadhaarConsent(e.target.checked)}
                  />
                  <span>Confirm tenant consent for verification.</span>
                </label>

                <Button 
                  type="submit" 
                  disabled={loading || aadhaarNumber.length !== 12 || !aadhaarConsent}
                  className="w-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 hover:bg-slate-800 font-semibold text-xs py-2 shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="size-3.5" /> Send Aadhaar OTP
                </Button>
              </form>

              {/* Option A - OTP Verification */}
              <form onSubmit={verifyAadhaarOtp} className="space-y-4 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-900 pt-6 sm:pt-0 sm:pl-6">
                <div className="space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">Aadhaar OTP Gate</h3>
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300 font-medium text-xs block text-center sm:text-left">Enter 6-digit Verification Code</Label>
                    
                    {/* Individual Monospace Inputs for OTP */}
                    <div className="flex gap-2 justify-center py-2">
                      {otpArray.map((digit, idx) => (
                        <input
                          key={idx}
                          id={`otp-${idx}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(e.target.value, idx)}
                          onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                          disabled={!aadhaarOtpSent}
                          required
                          className="size-10 text-center font-mono font-bold text-lg border border-slate-200 dark:border-slate-800 rounded-md focus:border-slate-900 focus:ring-1 focus:ring-slate-900 focus:outline-none dark:bg-slate-950 dark:focus:border-slate-100 dark:focus:ring-slate-100 transition-all"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                
                <Button
                  type="submit"
                  variant="outline"
                  disabled={loading || !aadhaarOtpSent || aadhaarOtp.length !== 6}
                  className="w-full font-bold text-xs py-2 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1.5"
                >
                  <UserCheck className="size-3.5" /> Verify Aadhaar OTP
                </Button>
              </form>
            </div>

            {/* Option B: DigiLocker Redirect Gate */}
            <div className="border-t border-slate-100 dark:border-slate-900 pt-6 space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="size-4.5 stroke-indigo-600 fill-none" strokeWidth="2" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Option B - Official DigiLocker Gateway</h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Send a consent redirect callback. The occupant validates credentials securely inside their personal DigiLocker directory.
              </p>
              
              <div className="flex flex-wrap gap-3 items-center pt-2">
                <Button 
                  onClick={startDigiLocker} 
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-sm transition-colors"
                >
                  Verify via Sandbox DigiLocker
                </Button>
                {verificationState && (
                  <Button
                    variant="outline"
                    onClick={() => loadSession(verificationState)}
                    disabled={loading}
                    className="text-xs font-semibold border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300 transition-colors"
                  >
                    I completed verification - refresh
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-[0_1px_2px_rgba(0,0,0,0.05)] rounded-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white leading-none">Confirm Tenant KYC Record</CardTitle>
            <CardDescription className="text-xs text-slate-400 mt-1.5 leading-normal">
              Review fetched governmental identity data and log local details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={confirmTenant} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Full Name</Label>
                  <Input id="name" name="name" defaultValue={profile.name} required className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Date of Birth</Label>
                  <Input id="dob" name="dob" defaultValue={profile.dob} className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Gender</Label>
                  <Input id="gender" name="gender" defaultValue={profile.gender} className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maskedAadhaar" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Masked Aadhaar Reference</Label>
                  <Input
                    id="maskedAadhaar"
                    name="maskedAadhaar"
                    defaultValue={profile.maskedAadhaar}
                    readOnly
                    className="border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-not-allowed font-mono text-xs"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Permanent Address</Label>
                <Input id="address" name="address" defaultValue={profile.address} className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
              </div>
              
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    defaultValue={profile.phone ?? contactPhone}
                    required
                    placeholder="98XXXXXXXX"
                    className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveInDate" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Move-in Date</Label>
                  <Input id="moveInDate" name="moveInDate" type="date" required className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContact" className="text-slate-700 dark:text-slate-300 font-medium text-xs">Emergency Contact</Label>
                  <Input id="emergencyContact" name="emergencyContact" placeholder="Name - Phone" className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600" />
                </div>
              </div>
              
              <Button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 mt-4 shadow-sm transition-colors text-xs"
              >
                {loading ? "Saving Tenant…" : "Confirm & Register Occupant"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
