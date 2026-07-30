"use client";

import Link from "next/link";
import { Conversation } from "@/models";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { deleteConversation } from "@/lib/actions/chat";

export function InboxListClient({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  const [conversations, setConversations] = useState(initialConversations);

  return (
    <div className="flex flex-col divide-y">
      {conversations.map((conv) => {
        const otherUser = conv.otherUser;

        // Navigate to the standalone chat route
        return (
          <div
            key={conv.conversationId}
            className="group flex items-center gap-2 p-2 hover:bg-accent/50"
          >
            <Link
              href={`/chat/${otherUser._id}`}
              className="flex min-w-0 flex-1 items-center gap-4 p-2 transition-all"
            >
            {/* Avatar */}
            <Avatar className="h-12 w-12 border-2 border-background">
              <AvatarImage
                src={
                  otherUser.profilePicture
                    ? `${STORAGE_BASE_URL}/${otherUser.profilePicture}`
                    : undefined
                }
              />
              <AvatarFallback className="bg-primary/10 text-primary">
                {otherUser.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-base truncate">
                  {otherUser.name}
                </span>
                {conv.lastMessage && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatDistanceToNow(new Date(conv.lastMessage.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground truncate pr-4">
                  {conv.lastMessage ? conv.lastMessage.text : "No messages yet"}
                </p>
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </div>
            </div>
            </Link>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label={`Delete conversation with ${otherUser.name}`}
              className="shrink-0 text-muted-foreground hover:text-destructive"
              onClick={async () => {
                const result = await deleteConversation(conv.conversationId);
                if (result.success) {
                  setConversations((current) =>
                    current.filter(
                      (item) =>
                        item.conversationId !== conv.conversationId
                    )
                  );
                }
              }}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
