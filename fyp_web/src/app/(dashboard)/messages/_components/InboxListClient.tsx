"use client";

import Link from "next/link";
import { Conversation } from "@/models";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight } from "lucide-react";

export function InboxListClient({
  initialConversations,
}: {
  initialConversations: Conversation[];
}) {
  return (
    <div className="flex flex-col divide-y">
      {initialConversations.map((conv) => {
        const otherUser = conv.otherUser;

        // Navigate to the standalone chat route
        return (
          <Link
            key={conv.conversationId}
            href={`/chat/${otherUser._id}`}
            className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-all group"
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
        );
      })}
    </div>
  );
}
