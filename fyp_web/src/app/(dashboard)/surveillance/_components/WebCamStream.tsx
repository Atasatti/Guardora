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
  onAlert?: (type: string, camera: string) => void;
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

  const startStream = async () => {
    if (!WEBSOCKET_URL) {
      toast.error("Face-recognition endpoint is not configured.");
      return;
    }

    setStatus("Connecting");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      const ws = new WebSocket(WEBSOCKET_URL);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("Connected to Face Recognition Server");
        setStatus("Online");
        toast.success("Webcam AI Active");
      };

      ws.onmessage = (event) => {
        try {
          const data: StreamData = JSON.parse(event.data);

          if (data.frame) {
            setFrameSrc(`data:image/jpeg;base64,${data.frame}`);
          }

          if (data.hasAlert) {
            setIsAlerting(true);
            setDetectedName(data.name || "Unknown");

            if (onAlert) {
              onAlert("BANNED_PERSON", `Webcam (${data.name || "Unknown"})`);
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
        setStatus("Offline");
        toast.error("Face Server Disconnected");
        stopWebcam();
      };

      ws.onerror = () => {
        setStatus("Offline");
        toast.error("Connection Failed");
      };
    } catch (err) {
      console.error("Webcam Access Error:", err);
      toast.error("Camera permission denied or unavailable.");
      setStatus("Offline");
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
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
      socketRef.current?.close();
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
          <video ref={videoRef} autoPlay playsInline muted className="hidden" />
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
