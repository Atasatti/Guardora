"use client";

import { useEffect, useState, useRef } from "react";
import { ChatMessage, UserSummary } from "@/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { getChatHistory, sendRestMessage } from "@/lib/actions/chat";
import { getProfile } from "@/lib/actions/users"; // To get 'me'
import io, { Socket } from "socket.io-client";
import { format } from "date-fns";

interface ChatWindowProps {
  otherUserId: string; // The ID from the URL
  otherUserData?: UserSummary; // Optional: fetch if not passed
}

export default function ChatWindow({ otherUserId }: ChatWindowProps) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Initialize Data & Socket
  useEffect(() => {
    const init = async () => {
      try {
        // Get current admin ID
        const profileRes = await getProfile();
        if (!profileRes.success || !profileRes.user) return;
        const myId = profileRes.user._id;
        setCurrentUserId(myId);

        // Get History
        const historyRes = await getChatHistory(otherUserId);
        if (historyRes.success && historyRes.messages) {
          setMessages(historyRes.messages);
        }

        // Connect Socket
        // Remove /api from base url for socket connection
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

        const newSocket = io(socketUrl, {
          transports: ["websocket"],
        });

        newSocket.on("connect", () => {
          console.log("Socket connected");
          newSocket.emit("join", myId); // Join my own room to receive messages
        });

        newSocket.on("receive_message", (data: ChatMessage) => {
          // Only add if it belongs to this conversation
          if (data.sender === otherUserId || data.sender === myId) {
            setMessages((prev) => [...prev, data]);
          }
        });

        setSocket(newSocket);
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      socket?.disconnect();
    };

    //eslint-disable-next-line
  }, [otherUserId]);

  // 2. Auto Scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;

    const textToSend = inputText;
    setInputText("");
    setIsSending(true);

    // 1. Optimistic Update
    const tempId = Date.now().toString();
    const tempMessage: ChatMessage = {
      _id: tempId,
      conversationId: "temp",
      sender: currentUserId,
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);

    // 2. Send via API
    const result = await sendRestMessage(otherUserId, textToSend);

    if (result.success) {
      // FIX: Cast result to specific success type so TS knows 'data' exists
      const successData = result as {
        success: true;
        data: { message: ChatMessage };
      };
      const realMessage = successData.data.message;

      setMessages((prev) =>
        prev.map((msg) => (msg._id === tempId ? realMessage : msg))
      );
    } else {
      // Handle Failure
      console.error("Failed to send message");
      setMessages((prev) => prev.filter((msg) => msg._id !== tempId));
      setInputText(textToSend);
    }

    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-muted/5 flex items-center gap-3">
        {/* We could fetch detailed user info here if needed, 
            or pass it from layout if available */}
        <span className="font-semibold">Chat</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => {
          const isMe = msg.sender === currentUserId;
          return (
            <div
              key={idx}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 text-sm ${
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                }`}
              >
                <p>{msg.text}</p>
                <p
                  className={`text-[10px] mt-1 text-right ${
                    isMe
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground"
                  }`}
                >
                  {format(new Date(msg.createdAt), "h:mm a")}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
