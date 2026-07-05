"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
import { Mail, Lock } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const result = await signIn("credentials", {
      email: form.get("email") as string,
      password: form.get("password") as string,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Invalid email or password");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  const error = searchParams.get("error");

  return (
    <Card className="w-full rounded-2xl border border-border/70 bg-card p-7 shadow-[0_8px_40px_-12px_rgb(0_0_0/0.12)]">
      <CardHeader className="space-y-1.5 p-0 pb-6">
        <CardTitle className="font-heading text-xl font-semibold tracking-tight text-foreground">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Sign in to your property workspace.
        </CardDescription>
      </CardHeader>

      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4 p-0">
          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive">
              Authentication error. Please try again.
            </p>
          )}

          {/* Email Address */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-foreground">
              Email address
            </Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="name@organization.com"
                required
                className="swiss-focus h-11 pl-9 text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-foreground">
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                className="swiss-focus h-11 pl-9 text-sm"
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="mt-6 flex flex-col gap-4 p-0">
          <Button
            type="submit"
            className="group h-11 w-full gap-2 rounded-lg bg-brand text-brand-foreground hover:bg-brand/90"
            disabled={loading}
          >
            <span>{loading ? "Signing in…" : "Sign in"}</span>
          </Button>

          <div className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/register"
              className="font-medium text-brand underline-offset-4 hover:underline"
            >
              Register
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center rounded-2xl border border-border/70 bg-card p-8">
        <p className="animate-pulse text-sm text-muted-foreground">Loading…</p>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
