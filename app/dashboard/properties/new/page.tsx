"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Building2 } from "lucide-react";

export default function NewPropertyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        address: form.get("address"),
        city: form.get("city"),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      toast.error("Failed to create property");
      return;
    }

    const data = await res.json();
    toast.success("Property created");
    router.push(`/dashboard/properties/${data.id}`);
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Back Link */}
      <div>
        <Link 
          href="/dashboard" 
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="size-3.5" /> Back to Properties
        </Link>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Add Property</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Register a new property asset to start configuring rental rooms.
        </p>
      </div>

      <Card className="swiss-card shadow-xs">
        <CardHeader className="flex flex-row items-center gap-3 pb-4">
          <div className="bg-slate-100 dark:bg-slate-900 p-2.5 rounded-lg text-slate-700 dark:text-slate-300">
            <Building2 className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">Property Details</CardTitle>
            <CardDescription className="text-xs text-slate-400">Enter descriptive location and identification info.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-700 dark:text-slate-300 font-medium">Property Name</Label>
              <Input 
                id="name" 
                name="name" 
                required 
                placeholder="Green Villa Apartments" 
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-slate-700 dark:text-slate-300 font-medium">Street Address</Label>
              <Input 
                id="address" 
                name="address" 
                required 
                placeholder="123 Park Avenue, Sector 4"
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city" className="text-slate-700 dark:text-slate-300 font-medium">City</Label>
              <Input 
                id="city" 
                name="city" 
                required 
                placeholder="New Delhi"
                className="border-slate-200 dark:border-slate-800 focus-visible:ring-indigo-600 focus-visible:border-indigo-600"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-indigo-600 text-white hover:bg-indigo-700 font-semibold shadow-sm transition-colors mt-2" 
              disabled={loading}
            >
              {loading ? "Saving…" : "Create Property Asset"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
