import React from "react";
import { MainNav } from "../_components/main-nav";
import { Header } from "../_components/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-20 lg:hover:w-64 group flex-col border-r bg-muted/40 transition-all duration-300 ease-in-out overflow-y-auto scrollbar-hide">
        <MainNav />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
