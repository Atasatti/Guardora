"use client";

import React, { useState, useCallback } from "react";
import VideoStream from "./VideoStream";
import LiveAlertFeed from "./LiveAlertFeed";
import { SecurityAlert, SocietyArea } from "@/models";
import WebcamStream from "./WebCamStream";
import SocietyMapSVG from "../../map/_components/SocietyMapSVG";
import AreaDetailsModal from "../../map/_components/AreaDetailsModal";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Camera } from "lucide-react";
import { cn } from "@/lib/utils";

const SAMPLE_FEEDS = [
  { id: 1, name: "testvideo1", title: "CAM 01: Block A / North" },
  { id: 2, name: "testvideo2", title: "CAM 02: Block B / East" },
  { id: 3, name: "testvideo3", title: "CAM 03: Block C / West" },
];

interface Props {
  initialAlerts: SecurityAlert[];
  initialAreas: SocietyArea[];
}

export default function SurveillanceClient({
  initialAlerts,
  initialAreas,
}: Props) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(initialAlerts);
  const [areas, setAreas] = useState(initialAreas);
  const [selectedArea, setSelectedArea] = useState<SocietyArea | null>(null);
  const [activeCameraId, setActiveCameraId] = useState<number | null>(null);
  const [lastAlertTime, setLastAlertTime] = useState(0);

  const handleAreaUpdated = (updated: SocietyArea) => {
    setAreas((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
  };

  const handleMapClick = (area: SocietyArea) => setSelectedArea(area);

  const handleMapHover = (area: SocietyArea | null) => {
    if (area && area.cctvIndex) setActiveCameraId(area.cctvIndex);
    else setActiveCameraId(null);
  };

  const handleLiveAlert = useCallback(
    (type: string, cameraName: string) => {
      const now = Date.now();
      if (now - lastAlertTime < 3000) return;

      setLastAlertTime(now);

      const newAlert: SecurityAlert = {
        _id: now.toString(),
        //eslint-disable-next-line
        type: type as any,
        status: "NEW",
        cameraName: cameraName,
        timestamp: new Date().toISOString(),
        snapshotUrl: "",
        details: {
          object: type === "DANGEROUS_OBJECT" ? "Gun" : "Intruder",
        },
      };

      setAlerts((prev) => [newAlert, ...prev]);
    },
    [lastAlertTime]
  );

  return (
    <div className="flex flex-col h-full w-full gap-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="text-red-500 animate-pulse" /> Surveillance
            Grid
          </h1>
          <p className="text-muted-foreground">Live monitoring station</p>
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
                <Camera className="h-4 w-4" /> Sector Map
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
