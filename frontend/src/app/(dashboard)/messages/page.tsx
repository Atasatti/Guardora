import { Suspense } from "react";
import { UserSearchDialog } from "./_components/UserSearchDialog";
import { InboxListClient } from "./_components/InboxListClient";
import PageLoader from "@/app/(dashboard)/users/_components/PageLoader";
import { MessageSquare } from "lucide-react";
import { loadMessagesViewModel } from "@/view-models/admin";
import ViewModelError from "@/views/shared/ViewModelError";

export default async function MessagesPage() {
  return (
    <div className="page-stack">
      {/* Header */}
      <header className="page-header">
        <div>
          <h1 className="page-title">Messages</h1>
          <p className="page-description">
            View your conversations and reach out to residents.
          </p>
        </div>
        <UserSearchDialog />
      </header>

      {/* Inbox List */}
      <div className="flex-1 overflow-hidden rounded-xl border bg-card shadow-sm">
        <Suspense fallback={<PageLoader />}>
          <InboxDataComponent />
        </Suspense>
      </div>
    </div>
  );
}

async function InboxDataComponent() {
  const viewModel = await loadMessagesViewModel();

  if (viewModel.status !== "ready") {
    return (
      <ViewModelError viewModel={viewModel} title="Failed to load messages" />
    );
  }

  const { conversations } = viewModel.data;

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
        <p className="text-lg font-medium">No conversations yet</p>
        <p className="text-sm">Start a new chat to see it here.</p>
      </div>
    );
  }

  return <InboxListClient initialConversations={conversations} />;
}
