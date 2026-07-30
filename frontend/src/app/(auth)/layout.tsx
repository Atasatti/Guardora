import React from "react";
import { Toaster } from "@/components/ui/sonner"; // Import the Toaster

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <Toaster position="top-right" richColors />
    </>
  );
}
