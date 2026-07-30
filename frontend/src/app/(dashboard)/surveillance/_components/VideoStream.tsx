"use client";

import React, { useEffect, useRef, useState } from "react";
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
  frame?: string;
  hasAlert?: boolean;
  alertType?: string;
  name?: string;
  error?: string;
}

export default function VideoStream({
  videoName,
  cameraId,
  title,
  onAlert,
}: {
  videoName: string;
  cameraId?: string;
  title: string;
  onAlert?: (
    type: string,
    camera: string,
    snapshot: string,
    name?: string
  ) => void;
}) {
  const websocketUrl = config.ai.streamWebSocket
    ? cameraId
      ? `${config.ai.streamWebSocket}/ws_camera/${encodeURIComponent(cameraId)}`
      : `${config.ai.streamWebSocket}/ws/${encodeURIComponent(videoName)}`
    : "";
  const [frameSrc, setFrameSrc] = useState<string>("");
  const [socketStatus, setSocketStatus] = useState<
    "Connecting" | "Online" | "Offline"
  >(websocketUrl ? "Connecting" : "Offline");
  const [isAlerting, setIsAlerting] = useState(false);
  const [alertLabel, setAlertLabel] = useState("");
  const onAlertRef = useRef(onAlert);

  useEffect(() => {
    onAlertRef.current = onAlert;
  }, [onAlert]);

  useEffect(() => {
    if (!websocketUrl) return;

    let active = true;
    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let reconnectAttempt = 0;

    const connect = () => {
      if (!active) return;

      setSocketStatus("Connecting");
      socket = new WebSocket(websocketUrl);

      socket.onopen = () => {
        if (!active) return;
        reconnectAttempt = 0;
        setSocketStatus("Online");
      };

      socket.onmessage = (event) => {
        if (!active) return;

        try {
          const data: StreamData = JSON.parse(event.data);
          if (data.error) {
            console.warn(`AI stream ${videoName}: ${data.error}`);
            return;
          }

          if (data.frame) {
            setFrameSrc(`data:image/jpeg;base64,${data.frame}`);
          }

          if (data.hasAlert && data.alertType) {
            setIsAlerting(true);
            setAlertLabel(
              data.alertType === "BANNED_PERSON" && data.name
                ? `BANNED: ${data.name}`
                : data.alertType.replaceAll("_", " ")
            );
            onAlertRef.current?.(
              data.alertType,
              title,
              `data:image/jpeg;base64,${data.frame || ""}`,
              data.name
            );
          } else {
            setIsAlerting(false);
            setAlertLabel("");
          }
        } catch {
          console.warn(`AI stream ${videoName} returned an invalid frame`);
        }
      };

      socket.onerror = () => {
        if (active) setSocketStatus("Offline");
      };

      socket.onclose = () => {
        if (!active) return;

        setSocketStatus("Offline");
        reconnectAttempt += 1;
        const retryDelay = Math.min(1000 * 2 ** (reconnectAttempt - 1), 10000);
        reconnectTimer = setTimeout(connect, retryDelay);
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer) clearTimeout(reconnectTimer);

      if (
        socket?.readyState === WebSocket.OPEN ||
        socket?.readyState === WebSocket.CONNECTING
      ) {
        socket.close(1000, "Component unmounted");
      }
    };
  }, [videoName, websocketUrl, title]);

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
              {alertLabel || "THREAT DETECTED"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
