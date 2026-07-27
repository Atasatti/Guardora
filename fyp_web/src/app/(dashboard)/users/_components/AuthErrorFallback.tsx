"use client";

import { useEffect } from "react";
import { logout } from "@/lib/actions";
import PageLoader from "./PageLoader";
import { toast } from "sonner";

export default function AuthErrorFallback({ message }: { message: string }) {
  useEffect(() => {
    toast.error(message || "Authentication Error. Logging you out.");
    logout();
  }, [message]);

  return <PageLoader />;
}
