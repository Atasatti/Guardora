"use client";

import React, {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import VideoStream from "./VideoStream";
import LiveAlertFeed from "./LiveAlertFeed";
import { SecurityAlert, SocietyArea } from "@/models";
import WebcamStream from "./WebCamStream";
import SocietyMapSVG from "../../map/_components/SocietyMapSVG";
import AreaDetailsModal from "../../map/_components/AreaDetailsModal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  Camera as CameraIcon,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createSurveillanceAlert } from "@/lib/actions/alerts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SAMPLE_FEEDS = [
  { id: 1, name: "testvideo", title: "CAM 01: Block A / North" },
  { id: 2, name: "testvideo2", title: "CAM 02: Block B / East" },
  { id: 3, name: "testvideo3", title: "CAM 03: Block C / West" },
];

interface Props {
  initialAlerts: SecurityAlert[];
  initialAreas: SocietyArea[];
}

interface EnrolledCamera {
  _id: string;
  name: string;
  enabled: boolean;
  sourceType: "RTSP" | "HTTP_STREAM";
  area?: { _id: string; name: string } | null;
}

export default function SurveillanceClient({
  initialAlerts,
  initialAreas,
}: Props) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(initialAlerts);
  const [areas, setAreas] = useState(initialAreas);
  const [selectedArea, setSelectedArea] = useState<SocietyArea | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<string | number | null>(
    null
  );
  const [cameras, setCameras] = useState<EnrolledCamera[]>([]);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraMessage, setCameraMessage] = useState("");
  const [cameraForm, setCameraForm] = useState({
    name: "",
    sourceUrl: "",
    areaId: "",
    sourceType: "RTSP",
  });
  const lastAlertTimeRef = useRef(0);

  const loadCameras = useCallback(async () => {
    const response = await fetch("/api/resident/cameras", {
      cache: "no-store",
    });
    if (!response.ok) return;
    const body = (await response.json()) as { cameras?: EnrolledCamera[] };
    setCameras(body.cameras || []);
  }, []);

  useEffect(() => {
    loadCameras();
  }, [loadCameras]);

  const enrollCamera = async (event: FormEvent) => {
    event.preventDefault();
    setCameraBusy(true);
    setCameraMessage("");
    const response = await fetch("/api/resident/cameras", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cameraForm),
    });
    const body = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    if (response.ok) {
      setCameraForm({
        name: "",
        sourceUrl: "",
        areaId: "",
        sourceType: "RTSP",
      });
      setCameraMessage("Camera enrolled. The source URL is stored encrypted.");
      await loadCameras();
    } else {
      setCameraMessage(body.message || "Camera could not be enrolled.");
    }
    setCameraBusy(false);
  };

  const removeCamera = async (cameraId: string) => {
    setCameraBusy(true);
    const response = await fetch(`/api/resident/cameras/${cameraId}`, {
      method: "DELETE",
    });
    if (response.ok) await loadCameras();
    setCameraBusy(false);
  };

  const handleAreaUpdated = (updated: SocietyArea) => {
    setAreas((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
  };

  const handleMapClick = (area: SocietyArea) => setSelectedArea(area);

  const handleMapHover = (area: SocietyArea | null) => {
    if (area && area.cctvIndex) setActiveCameraId(area.cctvIndex);
    else setActiveCameraId(null);
  };

  const handleLiveAlert = useCallback(
    async (
      type: string,
      cameraName: string,
      snapshotBase64: string,
      detectedName?: string
    ) => {
      const now = Date.now();
      if (now - lastAlertTimeRef.current < 3000) return;

      lastAlertTimeRef.current = now;

      const result = await createSurveillanceAlert({
        type: type as
          | "DANGEROUS_OBJECT"
          | "BANNED_PERSON"
          | "UNSAFE_AREA",
        cameraName,
        snapshotBase64,
        details: {
          object: type === "DANGEROUS_OBJECT" ? "Dangerous object" : "Person",
          name: detectedName,
        },
      });
      if (result.success && result.alert) {
        setAlerts((prev) => [result.alert, ...prev]);
      }
    },
    []
  );

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Activity className="size-6 text-red-500 animate-pulse" /> Surveillance
            Grid
          </h1>
          <p className="page-description">Live monitoring station</p>
        </div>
        <div className="flex gap-2">
          <Badge
            variant="outline"
            className="px-3 py-1 border-green-500 text-green-600 bg-green-50"
          >
            Systems Nominal
          </Badge>
          <Badge
            variant="outline"
            className="px-3 py-1 border-blue-500 text-blue-600 bg-blue-50"
          >
            {areas.length} Sectors Active
          </Badge>
        </div>
      </header>

      <Card className="p-5">
        <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="section-heading flex items-center gap-2">
              <CameraIcon className="size-4 text-primary" />
              Encrypted camera enrollment
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Add RTSP or HTTP camera sources. Credentials are never returned to
              the browser after saving.
            </p>
            <form
              onSubmit={enrollCamera}
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              <Input
                required
                placeholder="Camera name"
                value={cameraForm.name}
                onChange={(event) =>
                  setCameraForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <select
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={cameraForm.areaId}
                onChange={(event) =>
                  setCameraForm((current) => ({
                    ...current,
                    areaId: event.target.value,
                  }))
                }
              >
                <option value="">No mapped sector</option>
                {areas.map((area) => (
                  <option key={area._id} value={area._id}>
                    {area.name}
                  </option>
                ))}
              </select>
              <Input
                required
                type="password"
                autoComplete="off"
                placeholder="rtsp://user:password@camera/stream"
                className="sm:col-span-2"
                value={cameraForm.sourceUrl}
                onChange={(event) =>
                  setCameraForm((current) => ({
                    ...current,
                    sourceUrl: event.target.value,
                  }))
                }
              />
              <Button disabled={cameraBusy} className="sm:col-span-2">
                {cameraBusy ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Plus />
                )}
                Enroll camera
              </Button>
            </form>
            {cameraMessage && (
              <p className="mt-3 text-xs text-muted-foreground">
                {cameraMessage}
              </p>
            )}
          </div>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Configured sources
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {cameras.map((camera) => (
                <div
                  key={camera._id}
                  className="flex items-center gap-3 rounded-xl border p-3"
                >
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CameraIcon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {camera.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {camera.sourceType} · {camera.area?.name || "Unmapped"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Remove ${camera.name}`}
                    disabled={cameraBusy}
                    onClick={() => removeCamera(camera._id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              {!cameras.length && (
                <p className="text-sm text-muted-foreground">
                  No external cameras enrolled.
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* LEFT COL: Video Matrix */}
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_FEEDS.map((feed) => (
              <div
                key={feed.name}
                className={cn(
                  "rounded-lg overflow-hidden border-4 transition-all duration-300",
                  activeCameraId === feed.id
                    ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-[1.02] z-10"
                    : "border-transparent hover:border-border"
                )}
                onClick={() => setActiveCameraId(feed.id)}
              >
                <VideoStream
                  videoName={feed.name}
                  title={feed.title}
                  onAlert={handleLiveAlert}
                />
              </div>
            ))}
            {cameras
              .filter((camera) => camera.enabled)
              .map((camera) => (
                <div
                  key={camera._id}
                  className={cn(
                    "rounded-lg overflow-hidden border-4 transition-all duration-300",
                    activeCameraId === camera._id
                      ? "border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] scale-[1.02] z-10"
                      : "border-transparent hover:border-border"
                  )}
                  onClick={() => setActiveCameraId(camera._id)}
                >
                  <VideoStream
                    videoName={camera._id}
                    cameraId={camera._id}
                    title={camera.name}
                    onAlert={handleLiveAlert}
                  />
                </div>
              ))}

            <div
              className={cn(
                "rounded-lg overflow-hidden border-4 transition-all duration-300",
                activeCameraId === 4
                  ? "border-blue-500 shadow-lg scale-[1.02]"
                  : "border-transparent hover:border-border"
              )}
              onClick={() => setActiveCameraId(4)}
            >
              <WebcamStream onAlert={handleLiveAlert} />
            </div>
          </div>
        </div>

        {/* RIGHT COL: Map & Logs */}
        <div className="xl:col-span-1 flex flex-col gap-6 h-full min-h-[800px]">
          <Card className="overflow-hidden bg-slate-50/50 dark:bg-slate-900/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CameraIcon className="h-4 w-4" /> Sector Map
              </CardTitle>
            </CardHeader>
            <div className="h-[300px] w-full p-2">
              <SocietyMapSVG
                areas={areas}
                onAreaClick={handleMapClick}
                onAreaHover={handleMapHover}
              />
            </div>
          </Card>

          <div className="flex-1 min-h-0">
            <LiveAlertFeed alerts={alerts} setAlerts={setAlerts} />
          </div>
        </div>
      </div>

      <AreaDetailsModal
        area={selectedArea}
        isOpen={!!selectedArea}
        onClose={() => setSelectedArea(null)}
        onUpdated={handleAreaUpdated}
      />
    </div>
  );
}
