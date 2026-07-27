"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useLoginViewModel } from "@/view-models/use-login-view-model";

export default function LoginPage() {
  const viewModel = useLoginViewModel();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <Image src="/logo.png" alt="SecureNest Logo" width={40} height={40} />
          <CardTitle className="text-2xl font-bold">Admin Dashboard</CardTitle>
          <CardDescription>
            Sign in to your SecureNest admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={viewModel.submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="admin@secure-nest.com"
                value={viewModel.email}
                onChange={(event) => viewModel.setEmail(event.target.value)}
                disabled={viewModel.loading}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={viewModel.password}
                onChange={(event) => viewModel.setPassword(event.target.value)}
                disabled={viewModel.loading}
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={viewModel.loading}
            >
              {viewModel.loading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {viewModel.loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
