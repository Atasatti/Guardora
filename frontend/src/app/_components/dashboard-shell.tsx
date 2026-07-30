import { cn } from "@/lib/utils";
import { Header } from "./header";
import { MainNav } from "./main-nav";

export function DashboardShell({
  children,
  contentClassName,
}: {
  children: React.ReactNode;
  contentClassName?: string;
}) {
  return (
    <div className="app-shell min-h-screen w-full">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[272px] lg:block">
        <MainNav />
      </aside>
      <div className="min-h-screen lg:pl-[272px]">
        <Header />
        <main
          className={cn(
            "app-content mx-auto w-full max-w-[1680px] p-4 sm:p-6 lg:p-8",
            contentClassName
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
