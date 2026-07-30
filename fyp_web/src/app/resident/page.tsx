import type { Metadata } from "next";
import ResidentPortalClient from "./_components/ResidentPortalClient";

export const metadata: Metadata = {
  title: "Resident Portal",
  description: "Guardora resident safety and community portal.",
};

export default function ResidentPage() {
  return <ResidentPortalClient />;
}
