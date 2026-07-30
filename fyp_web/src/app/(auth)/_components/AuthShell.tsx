import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex lg:flex-col">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(circle at 18% 12%, rgba(34, 211, 238, .17), transparent 25rem), radial-gradient(circle at 85% 80%, rgba(16, 185, 129, .11), transparent 22rem)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.8) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <Link href="/login" className="relative flex items-center gap-3">
          <span className="brand-mark">
            <ShieldCheck className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-semibold tracking-[-0.03em]">
              Guardora
            </span>
            <span className="block text-[0.65rem] font-medium uppercase tracking-[0.16em] text-sidebar-foreground/45">
              Safety operations
            </span>
          </span>
        </Link>

        <div className="relative my-auto max-w-xl py-16">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-sidebar-foreground/70">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Protected operations workspace
          </div>
          <h1 className="max-w-lg text-[3.25rem] font-semibold leading-[1.04] tracking-[-0.055em]">
            One secure view of your entire community.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-sidebar-foreground/58">
            Monitor risks, coordinate access, and keep daily operations moving
            from a trusted command center.
          </p>

          <div className="mt-10 grid max-w-lg gap-3 sm:grid-cols-3">
            <AuthFeature
              icon={Activity}
              title="Live insight"
              detail="Real-time monitoring"
            />
            <AuthFeature
              icon={LockKeyhole}
              title="Controlled"
              detail="Role-based access"
            />
            <AuthFeature
              icon={CheckCircle2}
              title="Accountable"
              detail="Traceable actions"
            />
          </div>
        </div>

        <div className="relative flex items-center justify-between border-t border-white/8 pt-5 text-[0.68rem] text-sidebar-foreground/35">
          <span>Guardora Control</span>
          <span>Authorized personnel only</span>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="absolute left-5 top-6 flex items-center gap-2 lg:hidden">
          <span className="brand-mark size-9 rounded-[0.7rem]">
            <ShieldCheck className="size-4.5" />
          </span>
          <span className="font-semibold tracking-[-0.025em]">Guardora</span>
        </div>
        <div className="w-full max-w-[420px]">{children}</div>
      </section>
    </main>
  );
}

function AuthFeature({
  icon: Icon,
  title,
  detail,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4">
      <Icon className="size-4 text-cyan-300" />
      <p className="mt-5 text-xs font-semibold">{title}</p>
      <p className="mt-1 text-[0.68rem] text-sidebar-foreground/42">{detail}</p>
    </div>
  );
}
