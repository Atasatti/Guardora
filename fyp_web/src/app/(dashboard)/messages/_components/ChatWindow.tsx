"use client";

import { useEffect, useState, useRef } from "react";
import { ChatMessage, UserSummary } from "@/models";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Loader2,
  Phone,
  Video,
  PhoneOff,
  Check,
  X,
} from "lucide-react";
import { getChatHistory, sendRestMessage } from "@/lib/actions/chat";
import { getProfile } from "@/lib/actions/users"; // To get 'me'
import io, { Socket } from "socket.io-client";
import { format } from "date-fns";

interface ChatWindowProps {
  otherUserId: string; // The ID from the URL
  otherUserData?: UserSummary; // Optional: fetch if not passed
}

export default function ChatWindow({ otherUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [callState, setCallState] = useState<
    "idle" | "calling" | "incoming" | "active"
  >("idle");
  const [callMode, setCallMode] = useState<"audio" | "video">("audio");
  const [pendingOffer, setPendingOffer] =
    useState<RTCSessionDescriptionInit | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const stopCall = (notifyPeer = false) => {
    if (notifyPeer) {
      socketRef.current?.emit("call_end", { receiverId: otherUserId });
    }
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setPendingOffer(null);
    setCallState("idle");
  };

  const createPeer = (activeSocket: Socket, stream: MediaStream) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        ...(process.env.NEXT_PUBLIC_TURN_URL
          ? [
              {
                urls: process.env.NEXT_PUBLIC_TURN_URL,
                username: process.env.NEXT_PUBLIC_TURN_USERNAME,
                credential: process.env.NEXT_PUBLIC_TURN_CREDENTIAL,
              },
            ]
          : []),
      ],
    });
    stream.getTracks().forEach((track) => peer.addTrack(track, stream));
    peer.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        activeSocket.emit("ice_candidate", {
          receiverId: otherUserId,
          candidate: event.candidate.toJSON(),
        });
      }
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
        stopCall();
      }
    };
    peerRef.current = peer;
    return peer;
  };

  const getCallMedia = async (mode: "audio" | "video") => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: mode === "video",
    });
    localStreamRef.current = stream;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    return stream;
  };

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

        const socketTokenResponse = await fetch(
          "/api/resident/users/socket-token",
          { cache: "no-store" }
        );
        const socketTokenBody = socketTokenResponse.ok
          ? ((await socketTokenResponse.json()) as { token?: string })
          : {};
        const newSocket = io(socketUrl, {
          transports: ["websocket"],
          auth: socketTokenBody.token
            ? { token: socketTokenBody.token }
            : undefined,
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

        newSocket.on(
          "call_offer",
          (data: {
            senderId: string;
            offer: RTCSessionDescriptionInit;
            mode?: "audio" | "video";
          }) => {
            if (String(data.senderId) !== String(otherUserId)) return;
            setCallMode(data.mode === "video" ? "video" : "audio");
            setPendingOffer(data.offer);
            setCallState("incoming");
          }
        );
        newSocket.on(
          "call_answer",
          async (data: {
            senderId: string;
            answer: RTCSessionDescriptionInit;
          }) => {
            if (
              String(data.senderId) === String(otherUserId) &&
              peerRef.current
            ) {
              await peerRef.current.setRemoteDescription(data.answer);
              setCallState("active");
            }
          }
        );
        newSocket.on(
          "ice_candidate",
          async (data: {
            senderId: string;
            candidate: RTCIceCandidateInit;
          }) => {
            if (
              String(data.senderId) === String(otherUserId) &&
              peerRef.current &&
              data.candidate
            ) {
              await peerRef.current.addIceCandidate(data.candidate);
            }
          }
        );
        newSocket.on("call_end", () => stopCall());

        socketRef.current = newSocket;
      } finally {
        setIsLoading(false);
      }
    };

    init();

    return () => {
      socketRef.current?.disconnect();
      peerRef.current?.close();
      localStreamRef.current?.getTracks().forEach((track) => track.stop());
    };

    //eslint-disable-next-line
  }, [otherUserId]);

  const startCall = async (mode: "audio" | "video") => {
    const activeSocket = socketRef.current;
    if (!activeSocket || callState !== "idle") return;
    try {
      setCallMode(mode);
      const stream = await getCallMedia(mode);
      const peer = createPeer(activeSocket, stream);
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      activeSocket.emit("call_offer", {
        receiverId: otherUserId,
        offer,
        mode,
      });
      setCallState("calling");
    } catch (error) {
      console.error("Unable to start call:", error);
      stopCall();
    }
  };

  const acceptCall = async () => {
    const activeSocket = socketRef.current;
    if (!activeSocket || !pendingOffer) return;
    try {
      const stream = await getCallMedia(callMode);
      const peer = createPeer(activeSocket, stream);
      await peer.setRemoteDescription(pendingOffer);
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      activeSocket.emit("call_answer", {
        receiverId: otherUserId,
        answer,
      });
      setCallState("active");
    } catch (error) {
      console.error("Unable to accept call:", error);
      stopCall(true);
    }
  };

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
        <span className="font-semibold">Encrypted session</span>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Start audio call"
            disabled={callState !== "idle"}
            onClick={() => startCall("audio")}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Start video call"
            disabled={callState !== "idle"}
            onClick={() => startCall("video")}
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {callState !== "idle" && (
        <div className="border-b bg-slate-950 p-4 text-white">
          <div className="mx-auto flex max-w-3xl flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold">
                  {callMode === "video" ? "Video" : "Audio"} call
                </p>
                <p className="text-xs text-white/65">
                  {callState === "incoming"
                    ? "Incoming call"
                    : callState === "calling"
                      ? "Calling…"
                      : "Connected"}
                </p>
              </div>
              <div className="flex gap-2">
                {callState === "incoming" && (
                  <Button
                    type="button"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500"
                    onClick={acceptCall}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  onClick={() => stopCall(true)}
                >
                  {callState === "incoming" ? (
                    <X className="mr-2 h-4 w-4" />
                  ) : (
                    <PhoneOff className="mr-2 h-4 w-4" />
                  )}
                  {callState === "incoming" ? "Decline" : "End"}
                </Button>
              </div>
            </div>
            <div
              className={`grid gap-3 ${callMode === "video" ? "sm:grid-cols-2" : ""}`}
            >
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className={`w-full rounded-lg bg-black object-cover ${
                  callMode === "video" ? "aspect-video" : "h-12"
                }`}
              />
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className={`w-full rounded-lg bg-black object-cover ${
                  callMode === "video" ? "aspect-video" : "hidden"
                }`}
              />
            </div>
          </div>
        </div>
      )}

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
