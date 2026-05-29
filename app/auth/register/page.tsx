"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { User, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch("/api/owners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      toast.error(data.error ?? "Registration failed");
      setLoading(false);
      return;
    }

    const signInResult = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (signInResult?.error) {
      toast.success("Account created. Please sign in.");
      router.push("/auth/login");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="border-2 border-slate-900 bg-white p-6 md:p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] w-full">
      <CardHeader className="space-y-1 p-0 pb-6">
        <div className="bg-slate-900 p-2 text-white mb-4 rounded-none w-fit">
          <ShieldCheck className="size-6" strokeWidth={2} />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">Create account</CardTitle>
        <CardDescription className="text-slate-500 font-medium text-xs">
          Register to manage properties and verify tenants
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4 p-0">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="block text-xs uppercase tracking-wider font-bold text-slate-900">
              Full Name
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User className="w-4 h-4" />
              </span>
              <Input 
                id="name" 
                name="name" 
                placeholder="John Doe"
                required 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-none text-slate-900 placeholder-slate-400 font-medium text-sm transition-all focus-visible:ring-0 focus-visible:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Email Address */}
          <div className="space-y-2">
            <Label htmlFor="email" className="block text-xs uppercase tracking-wider font-bold text-slate-900">
              Email Address
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="w-4 h-4" />
              </span>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="name@organization.com"
                required 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-none text-slate-900 placeholder-slate-400 font-medium text-sm transition-all focus-visible:ring-0 focus-visible:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
          
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password" className="block text-xs uppercase tracking-wider font-bold text-slate-900">
              Password
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock className="w-4 h-4" />
              </span>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                placeholder="Min. 8 characters"
                minLength={8} 
                required 
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-none text-slate-900 placeholder-slate-400 font-medium text-sm transition-all focus-visible:ring-0 focus-visible:outline-none focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 mt-6 p-0">
          <Button 
            type="submit" 
            className="group w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-5 px-4 rounded-none transition-all duration-150 flex items-center justify-center gap-2 active:translate-y-0.5 shadow-none border-none"
            disabled={loading}
          >
            <span>{loading ? "Creating account…" : "Register Owner Account"}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
          
          <div className="text-xs text-center text-slate-500 font-medium">
            Already have an account?{" "}
            <Link href="/auth/login" className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors underline underline-offset-4">
              Sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
