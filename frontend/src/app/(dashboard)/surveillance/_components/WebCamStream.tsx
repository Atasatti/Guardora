"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Camera,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { config } from "@/lib/config";
import { getAiStreamToken } from "@/lib/actions/cameras";

const WEBSOCKET_URL = config.ai.faceWebSocket;
const FPS = config.ai.webcamFps;

interface StreamData {
  frame: string;
  hasAlert?: boolean;
  alertType?: string;
  name?: string;
}

export default function WebcamStream({
  onAlert,
}: {
  onAlert?: (
    type: string,
    camera: string,
    snapshot: string,
    name?: string
  ) => void;
}) {
  const [status, setStatus] = useState<"Offline" | "Connecting" | "Online">(
    "Offline"
  );
  const [frameSrc, setFrameSrc] = useState<string>("");
  const [isAlerting, setIsAlerting] = useState(false);
  const [detectedName, setDetectedName] = useState<string>("");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const streamRequestRef = useRef(0);

  const stopWebcam = () => {
    const video = videoRef.current;
    const stream =
      mediaStreamRef.current || (video?.srcObject as MediaStream | null);

    video?.pause();
    stream?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;

    if (video) {
      video.srcObject = null;
    }
  };

  const startStream = async () => {
    if (!WEBSOCKET_URL) {
      toast.error("Face-recognition endpoint is not configured.");
      return;
    }

    const requestId = ++streamRequestRef.current;
    const previousSocket = socketRef.current;
    socketRef.current = null;
    if (previousSocket) {
      previousSocket.onclose = null;
      previousSocket.onerror = null;
      previousSocket.close(1000, "Camera restarting");
    }
    stopWebcam();
    setStatus("Connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (requestId !== streamRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        throw new Error("Webcam video element is unavailable");
      }

      mediaStreamRef.current = stream;
      video.srcObject = stream;

      try {
        await video.play();
      } catch (error) {
        if (requestId !== streamRequestRef.current) return;
        if (error instanceof DOMException && error.name === "AbortError") {
          stopWebcam();
          setStatus("Offline");
          return;
        }
        throw error;
      }

      if (requestId !== streamRequestRef.current) {
        stopWebcam();
        return;
      }

      const authorization = await getAiStreamToken();
      if (requestId !== streamRequestRef.current) {
        stopWebcam();
        return;
      }
      if (!authorization.success) {
        stopWebcam();
        setStatus("Offline");
        toast.error(authorization.message || "Webcam AI is not authorised");
        return;
      }

      const ws = new WebSocket(
        `${WEBSOCKET_URL}?token=${encodeURIComponent(authorization.token)}`
      );
      socketRef.current = ws;

      ws.onopen = () => {
        if (socketRef.current !== ws) return;
        setStatus("Online");
        toast.success("Webcam AI Active");
      };

      ws.onmessage = (event) => {
        if (socketRef.current !== ws) return;

        try {
          const data: StreamData = JSON.parse(event.data);

          if (data.frame) {
            setFrameSrc(`data:image/jpeg;base64,${data.frame}`);
          }

          if (data.hasAlert) {
            setIsAlerting(true);
            setDetectedName(data.name || "Unknown");

            if (onAlert) {
              onAlert(
                "BANNED_PERSON",
                "Park Area (Webcam)",
                `data:image/jpeg;base64,${data.frame}`,
                data.name || "Unknown"
              );
            }
          } else {
            setIsAlerting(false);
            setDetectedName("");
          }
        } catch (e) {
          console.error("Frame parse error", e);
        }
      };

      ws.onclose = () => {
        if (socketRef.current !== ws) return;
        socketRef.current = null;
        streamRequestRef.current += 1;
        setStatus("Offline");
        toast.error("Face Server Disconnected");
        stopWebcam();
      };

      ws.onerror = () => {
        if (socketRef.current !== ws) return;
        setStatus("Offline");
        toast.error("Connection Failed");
      };
    } catch (err) {
      if (requestId !== streamRequestRef.current) return;
      console.error("Webcam Access Error:", err);
      toast.error("Camera permission denied or unavailable.");
      stopWebcam();
      setStatus("Offline");
    }
  };

  // --- Frame Sending Loop ---
  useEffect(() => {
    if (status !== "Online" || !videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    const intervalId = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN && ctx) {
        if (
          video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
          video.videoWidth === 0 ||
          video.videoHeight === 0
        ) {
          return;
        }

        if (canvas.width !== video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frameDataUrl = canvas.toDataURL("image/jpeg", 0.5);
        socketRef.current.send(JSON.stringify({ frame: frameDataUrl }));
      }
    }, 1000 / FPS);

    return () => clearInterval(intervalId);
  }, [status]);

  useEffect(() => {
    return () => {
      streamRequestRef.current += 1;
      const socket = socketRef.current;
      socketRef.current = null;
      if (socket) {
        socket.onclose = null;
        socket.onerror = null;
        socket.close(1000, "Component unmounted");
      }
      stopWebcam();
    };
  }, []);

  const getStatusIcon = () => {
    if (status === "Connecting")
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
    if (status === "Online")
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  return (
    <Card
      className={`flex flex-col transition-all duration-300 ${
        isAlerting ? "border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]" : ""
      }`}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
        <div className="flex items-center gap-2">
          {isAlerting ? (
            <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
          ) : (
            <Camera className="h-5 w-5" />
          )}
          <CardTitle className="text-base font-semibold">
            Park Area (Webcam)
          </CardTitle>
        </div>
        {getStatusIcon()}
      </CardHeader>

      <CardContent className="p-0">
        <div className="relative w-full aspect-video bg-secondary overflow-hidden">
          {/* Processed Frame */}
          {frameSrc ? (
            //eslint-disable-next-line
            <img
              src={frameSrc}
              alt="AI Feed"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-muted-foreground text-sm">
                Camera feed inactive
              </p>
            </div>
          )}

          {/* Hidden Raw Video & Canvas */}
          <video ref={videoRef} playsInline muted className="hidden" />
          <canvas ref={canvasRef} className="hidden" />

          {/* Start Button Overlay */}
          {status !== "Online" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <Button onClick={startStream} disabled={status === "Connecting"}>
                {status === "Connecting" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Activate Camera
              </Button>
            </div>
          )}

          {/* Alert Overlay */}
          {isAlerting && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-xs font-bold animate-pulse shadow-lg">
              BANNED: {detectedName.toUpperCase()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
