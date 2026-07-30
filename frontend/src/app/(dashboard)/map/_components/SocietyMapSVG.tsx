"use client";

import { SocietyArea } from "@/models";
import { cn } from "@/lib/utils";
import { AlertTriangle, ShieldCheck, Trees } from "lucide-react";

interface Props {
  areas: SocietyArea[];
  onAreaClick: (area: SocietyArea) => void;
  // New optional prop for hover effects
  onAreaHover?: (area: SocietyArea | null) => void;
}

export default function SocietyMapSVG({
  areas,
  onAreaClick,
  onAreaHover,
}: Props) {
  const getAreaData = (mapId: string) => {
    return areas.find((a) => a.mapId === mapId);
  };

  // Dynamic styling based on status and theme
  const getAreaStyles = (mapId: string) => {
    const area = getAreaData(mapId);
    if (!area) return { fill: "fill-muted", stroke: "stroke-border" };

    if (area.isSafe) {
      return {
        className:
          "fill-card stroke-border hover:stroke-primary hover:shadow-lg cursor-pointer transition-all duration-300",
        indicatorColor: "text-green-500",
      };
    } else {
      return {
        className:
          "fill-destructive/20 stroke-destructive animate-pulse cursor-pointer",
        indicatorColor: "text-destructive",
      };
    }
  };

  const handleMouseEnter = (mapId: string) => {
    if (onAreaHover) {
      const area = getAreaData(mapId);
      if (area) onAreaHover(area);
    }
  };

  const handleMouseLeave = () => {
    if (onAreaHover) {
      onAreaHover(null);
    }
  };

  const AreaLabel = ({
    x,
    y,
    mapId,
    label,
  }: {
    x: number;
    y: number;
    mapId: string;
    label: string;
  }) => {
    const area = getAreaData(mapId);
    const isSafe = area?.isSafe ?? true;
    const styles = getAreaStyles(mapId);

    return (
      <g className="pointer-events-none">
        <rect
          x={x - 40}
          y={y - 15}
          width="80"
          height="24"
          rx="4"
          className="fill-background/90 stroke-border"
        />
        <text
          x={x}
          y={y + 2}
          textAnchor="middle"
          className="text-[10px] font-bold fill-foreground select-none uppercase tracking-wider"
        >
          {label}
        </text>
        <foreignObject x={x + 45} y={y - 12} width={24} height={24}>
          <div
            className={cn(
              "flex items-center justify-center w-6 h-6 rounded-full bg-background border shadow-sm",
              styles.indicatorColor
            )}
          >
            {isSafe ? (
              <ShieldCheck className="w-3.5 h-3.5" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5" />
            )}
          </div>
        </foreignObject>
      </g>
    );
  };

  const Tree = ({ cx, cy }: { cx: number; cy: number }) => (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r="6"
        className="fill-green-600/20 dark:fill-green-500/20"
      />
      <circle
        cx={cx}
        cy={cy}
        r="2"
        className="fill-green-700/40 dark:fill-green-400/40"
      />
    </g>
  );

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/30 dark:bg-background/50 rounded-xl border overflow-hidden p-4 relative">
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>

      <svg
        viewBox="0 0 800 600"
        className="w-full h-full max-w-5xl drop-shadow-2xl"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* --- LANDSCAPING --- */}
        <rect
          x="20"
          y="20"
          width="760"
          height="560"
          rx="30"
          className="fill-background stroke-border stroke-2"
        />
        <path
          d="M 400 20 L 400 580"
          className="stroke-muted dark:stroke-muted/50 stroke-[60]"
        />
        <path
          d="M 400 20 L 400 580"
          className="stroke-dashed-line stroke-background/30 stroke-[2] stroke-dasharray-10"
        />
        <path
          d="M 20 300 L 780 300"
          className="stroke-muted dark:stroke-muted/50 stroke-[50]"
        />
        <path
          d="M 20 300 L 780 300"
          className="stroke-dashed-line stroke-background/30 stroke-[2] stroke-dasharray-10"
        />
        <circle
          cx="400"
          cy="300"
          r="80"
          className="fill-background stroke-muted dark:stroke-muted/50 stroke-[20]"
        />
        {/* Trees */}
        <Tree cx={340} cy={250} /> <Tree cx={320} cy={230} />{" "}
        <Tree cx={360} cy={230} />
        <Tree cx={460} cy={250} /> <Tree cx={480} cy={230} />{" "}
        <Tree cx={440} cy={230} />
        <Tree cx={340} cy={350} /> <Tree cx={320} cy={370} />{" "}
        <Tree cx={360} cy={370} />
        <Tree cx={460} cy={350} /> <Tree cx={480} cy={370} />{" "}
        <Tree cx={440} cy={370} />
        {/* --- INTERACTIVE AREAS --- */}
        {/* 1. Block A */}
        <g
          onClick={() => {
            const area = getAreaData("block_a");
            if (area) onAreaClick(area);
          }}
          onMouseEnter={() => handleMouseEnter("block_a")}
          onMouseLeave={handleMouseLeave}
          className="group"
        >
          <rect
            x="150"
            y="60"
            width="500"
            height="120"
            rx="4"
            className="fill-black/10 dark:fill-black/40"
          />
          <rect
            x="150"
            y="50"
            width="500"
            height="120"
            rx="4"
            className={cn(
              "stroke-[3] transition-all",
              getAreaStyles("block_a").className
            )}
          />
          <path
            d="M 200 60 L 200 160 M 300 60 L 300 160 M 500 60 L 500 160 M 600 60 L 600 160"
            className="stroke-border stroke-1 opacity-50"
          />
          <AreaLabel x={400} y={110} mapId="block_a" label="Block A (North)" />
        </g>
        {/* 2. Block B */}
        <g
          onClick={() => {
            const area = getAreaData("block_b");
            if (area) onAreaClick(area);
          }}
          onMouseEnter={() => handleMouseEnter("block_b")}
          onMouseLeave={handleMouseLeave}
          className="group"
        >
          <path
            d="M 480 400 H 730 V 530 H 630 V 450 H 480 Z"
            className="fill-black/10 dark:fill-black/40 translate-x-2 translate-y-2"
          />
          <path
            d="M 480 400 H 730 V 530 H 630 V 450 H 480 Z"
            className={cn(
              "stroke-[3] transition-all",
              getAreaStyles("block_b").className
            )}
          />
          <AreaLabel x={605} y={425} mapId="block_b" label="Block B (East)" />
        </g>
        {/* 3. Block C */}
        <g
          onClick={() => {
            const area = getAreaData("block_c");
            if (area) onAreaClick(area);
          }}
          onMouseEnter={() => handleMouseEnter("block_c")}
          onMouseLeave={handleMouseLeave}
          className="group"
        >
          <path
            d="M 320 400 H 70 V 530 H 170 V 450 H 320 Z"
            className="fill-black/10 dark:fill-black/40 translate-x-2 translate-y-2"
          />
          <path
            d="M 320 400 H 70 V 530 H 170 V 450 H 320 Z"
            className={cn(
              "stroke-[3] transition-all",
              getAreaStyles("block_c").className
            )}
          />
          <AreaLabel x={195} y={425} mapId="block_c" label="Block C (West)" />
        </g>
        {/* 4. Central Park */}
        <g
          onClick={() => {
            const area = getAreaData("central_park");
            if (area) onAreaClick(area);
          }}
          onMouseEnter={() => handleMouseEnter("central_park")}
          onMouseLeave={handleMouseLeave}
          className="group"
        >
          <circle
            cx="400"
            cy="300"
            r="55"
            className={cn(
              "stroke-[3] transition-all",
              getAreaData("central_park")?.isSafe
                ? "fill-green-500/20 stroke-green-600/50 hover:fill-green-500/30 cursor-pointer"
                : "fill-destructive/20 stroke-destructive animate-pulse cursor-pointer"
            )}
          />
          <Trees
            x="388"
            y="288"
            className="w-6 h-6 text-green-700 dark:text-green-400 opacity-70 pointer-events-none"
          />
        </g>
      </svg>
    </div>
  );
}
