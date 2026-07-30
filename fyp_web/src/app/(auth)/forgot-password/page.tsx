import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { AuthShell } from "../_components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <div className="mb-8">
        <p className="page-eyebrow">Account recovery</p>
        <h2 className="text-[2rem] font-semibold tracking-[-0.045em]">
          Reset your password
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your administrator email and we will send secure recovery
          instructions.
        </p>
      </div>

      <form className="space-y-5">
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
            />
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full">
          Send recovery link
        </Button>
      </form>

      <Button variant="ghost" className="mt-4 w-full" asChild>
        <Link href="/login">
          <ArrowLeft />
          Back to sign in
        </Link>
      </Button>
    </AuthShell>
  );
}
