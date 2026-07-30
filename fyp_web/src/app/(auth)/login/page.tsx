"use client";

import Link from "next/link";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { AuthShell } from "../_components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginViewModel } from "@/view-models/use-login-view-model";

export default function LoginPage() {
  const viewModel = useLoginViewModel();

  return (
    <AuthShell>
      <div className="mb-8">
        <p className="page-eyebrow">Secure sign in</p>
        <h2 className="text-[2rem] font-semibold tracking-[-0.045em]">
          Welcome back
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Sign in with your resident, moderator, or administrator account.
        </p>
      </div>

      <form className="space-y-5" onSubmit={viewModel.submit}>
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs font-semibold">
            Work email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@guardora.com"
              className="h-11 pl-10"
              value={viewModel.email}
              onChange={(event) => viewModel.setEmail(event.target.value)}
              disabled={viewModel.loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-xs font-semibold">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Enter your password"
              className="h-11 pl-10"
              value={viewModel.password}
              onChange={(event) => viewModel.setPassword(event.target.value)}
              disabled={viewModel.loading}
            />
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={viewModel.loading}
        >
          {viewModel.loading ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in securely
            </>
          ) : (
            <>
              Sign in to Guardora
              <ArrowRight />
            </>
          )}
        </Button>
      </form>

      <div className="mt-8 flex items-start gap-2.5 rounded-xl border border-border/70 bg-muted/35 p-3.5">
        <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <p className="text-[0.7rem] leading-5 text-muted-foreground">
          Your session is encrypted. Access attempts may be recorded for
          security and compliance.
        </p>
      </div>
    </AuthShell>
  );
}
