import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ChatWindow from "@/app/(dashboard)/messages/_components/ChatWindow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { loadUserProfileViewModel } from "@/view-models/admin";
import { DashboardShell } from "@/app/_components/dashboard-shell";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <DashboardShell contentClassName="max-w-none p-0">
    <div className="flex h-[calc(100vh-72px)] flex-col bg-card">
      {/* Header Area */}
      <div className="z-10 flex items-center gap-4 border-b border-border/70 bg-card px-4 py-3.5 sm:px-6">
        <Button variant="ghost" size="icon" asChild className="shrink-0">
          <Link href="/messages">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>

        <Suspense
          fallback={
            <div className="h-10 w-40 bg-muted animate-pulse rounded" />
          }
        >
          <ChatHeader userId={id} />
        </Suspense>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden bg-muted/25">
        <ChatWindow otherUserId={id} />
      </div>
    </div>
    </DashboardShell>
  );
}

async function ChatHeader({ userId }: { userId: string }) {
  const viewModel = await loadUserProfileViewModel(userId);

  if (viewModel.status !== "ready") {
    return <div>Unknown User</div>;
  }

  const user = viewModel.data.user;

  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-10 w-10 border">
        <AvatarImage
          src={
            user.profilePicture
              ? `${STORAGE_BASE_URL}/${user.profilePicture}`
              : undefined
          }
        />
        <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
      </Avatar>
      <div>
        <h1 className="font-bold leading-none">{user.name}</h1>
        <p className="text-xs text-muted-foreground mt-1">
          {user.role} • Unit {user.unitNumber}
        </p>
      </div>
    </div>
  );
}
