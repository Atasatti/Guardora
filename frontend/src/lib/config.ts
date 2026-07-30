function withoutTrailingSlash(value: string | undefined): string {
  return (value || "").replace(/\/+$/, "");
}

function positiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  backend: {
    api: withoutTrailingSlash(process.env.NEXT_PUBLIC_BACKEND_URL),
    storage: withoutTrailingSlash(
      process.env.NEXT_PUBLIC_BACKEND_STORAGE_URL
    ),
    socket: withoutTrailingSlash(process.env.NEXT_PUBLIC_SOCKET_URL),
  },
  ai: {
    streamWebSocket: withoutTrailingSlash(
      process.env.NEXT_PUBLIC_AI_STREAM_WS_URL
    ),
    faceWebSocket: withoutTrailingSlash(process.env.NEXT_PUBLIC_FACE_WS_URL),
    webcamFps: positiveInteger(process.env.NEXT_PUBLIC_AI_WEBCAM_FPS, 3),
  },
  isDevelopment: process.env.NODE_ENV === "development",
} as const;
