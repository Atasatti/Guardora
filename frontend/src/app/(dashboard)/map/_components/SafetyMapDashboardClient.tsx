"use client";

import { useState } from "react";
import { SocietyArea } from "@/models";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, ShieldCheck, Map, Info, Trees } from "lucide-react";
import SocietyMapSVG from "./SocietyMapSVG";
import AreaDetailsModal from "./AreaDetailsModal";

interface Props {
  initialAreas: SocietyArea[];
}

export default function SafetyMapDashboardClient({ initialAreas }: Props) {
  const [areas, setAreas] = useState<SocietyArea[]>(initialAreas);
  const [selectedArea, setSelectedArea] = useState<SocietyArea | null>(null);

  const safeCount = areas.filter((a) => a.isSafe).length;
  const unsafeCount = areas.length - safeCount;

  const handleAreaUpdated = (updated: SocietyArea) => {
    setAreas((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Map className="size-6 text-primary" /> Society Safety Map
          </h1>
          <p className="page-description">
            Interactive sector monitoring. Click any block to manage status.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg border border-green-500/20">
            <ShieldCheck className="h-5 w-5" />
            <span className="font-bold">{safeCount}</span> Safe
          </div>
          {unsafeCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 animate-pulse">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-bold">{unsafeCount}</span> Hazards
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 grid lg:grid-cols-4 gap-6 min-h-[600px]">
        {/* --- Map Container --- */}
        <div className="lg:col-span-3 h-full min-h-[500px]">
          <SocietyMapSVG areas={areas} onAreaClick={setSelectedArea} />
        </div>

        {/* --- Side Panel --- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Map Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-card border border-border shadow-sm flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">Secure Block</p>
                  <p className="text-xs text-muted-foreground">
                    Normal operations
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-destructive/10 border border-destructive flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                </div>
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Hazard Zone
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Emergency reported
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                  <Trees className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Central Park</p>
                  <p className="text-xs text-muted-foreground">
                    Recreation zone
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm text-primary flex items-center gap-2">
                <Info className="w-4 h-4" /> Instructions
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>• The map layout represents the master plan of the society.</p>
              <p>
                • Click on a building to view its CCTV link and toggle safety
                status.
              </p>
              <p>• Changes are broadcasted to all resident apps instantly.</p>
            </CardContent>
          </Card>
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
