"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Video,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { config } from "@/lib/config";

interface StreamData {
  frame: string;
  hasAlert: boolean;
  alertType: string;
}

export default function VideoStream({
  videoName,
  title,
  onAlert,
}: {
  videoName: string;
  title: string;
  onAlert?: (type: string, camera: string) => void;
}) {
  const [frameSrc, setFrameSrc] = useState<string>("");
  const [socketStatus, setSocketStatus] = useState<
    "Connecting" | "Online" | "Offline"
  >("Connecting");
  const [isAlerting, setIsAlerting] = useState(false);

  const websocketUrl = config.ai.streamWebSocket
    ? `${config.ai.streamWebSocket}/ws/${encodeURIComponent(videoName)}`
    : "";

  useEffect(() => {
    if (!websocketUrl) {
      setSocketStatus("Offline");
      return;
    }

    const ws = new WebSocket(websocketUrl);

    ws.onopen = () => {
      console.log(`Connected to AI Stream: ${videoName}`);
      setSocketStatus("Online");
    };

    ws.onmessage = (event) => {
      try {
        const data: StreamData = JSON.parse(event.data);

        if (data.frame) {
          setFrameSrc(`data:image/jpeg;base64,${data.frame}`);
        }

        if (data.hasAlert) {
          setIsAlerting(true);
          if (onAlert) onAlert(data.alertType, title);
        } else {
          setIsAlerting(false);
        }
      } catch (e) {
        console.error("Frame parse error: ", e);
      }
    };

    ws.onclose = () => {
      setSocketStatus("Offline");
    };

    ws.onerror = (err) => {
      console.error(`WebSocket Error for ${videoName}:`, err);
      setSocketStatus("Offline");
    };

    return () => {
      ws.close();
    };
  }, [videoName, websocketUrl, title, onAlert]);

  const getStatusIcon = () => {
    if (socketStatus === "Connecting")
      return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
    if (socketStatus === "Online")
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
            <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
          ) : (
            <Video className="h-5 w-5" />
          )}
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
        </div>
        {getStatusIcon()}
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full aspect-video bg-secondary overflow-hidden">
          {frameSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={frameSrc}
              alt="Live AI Feed"
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                {websocketUrl
                  ? "Connecting to AI stream..."
                  : "AI stream endpoint is not configured"}
              </p>
            </div>
          )}

          {/* Overlay Overlay if Alerting */}
          {isAlerting && (
            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold animate-pulse">
              THREAT DETECTED
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
