import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import ChatWindow from "@/app/(dashboard)/messages/_components/ChatWindow";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { loadUserProfileViewModel } from "@/view-models/admin";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Area */}
      <div className="border-b p-4 flex items-center gap-4 bg-card shadow-sm z-10">
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
      <div className="flex-1 overflow-hidden bg-muted/10">
        <ChatWindow otherUserId={id} />
      </div>
    </div>
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
