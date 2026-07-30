"use client";

import { useState } from "react";
import { ModerationCase } from "@/models";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import ModerationDataTable from "./ModerationDataTable";
import { columns } from "./ModerationTableColumns";
import ResolveCaseModal from "./ResolveCaseModal";

interface Props {
  initialCases: ModerationCase[];
}

export default function ModerationDashboardClient({ initialCases }: Props) {
  const [cases, setCases] = useState<ModerationCase[]>(initialCases);
  const [selectedCase, setSelectedCase] = useState<ModerationCase | null>(null);

  // Stats
  const totalOpen = cases.length;
  const highConfidence = cases.filter((c) => c.aiConfidence === "High").length;

  // Handlers
  const handleCaseResolved = (id: string) => {
    setCases((prev) => prev.filter((c) => c._id !== id));
  };

  return (
    <div className="page-stack">
      <header>
        <h1 className="page-title flex items-center gap-2">
          <ShieldAlert className="size-6 text-destructive" />
          AI Moderation Queue
        </h1>
        <p className="page-description">
          Review content flagged by AI as potentially unsafe.
        </p>
      </header>

      {/* --- Stats --- */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOpen}</div>
            <p className="text-xs text-muted-foreground">Requires review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              High Confidence
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{highConfidence}</div>
            <p className="text-xs text-muted-foreground">AI is &gt; 90% sure</p>
          </CardContent>
        </Card>

        <Card className="bg-secondary/20 border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Active</div>
            <p className="text-xs text-muted-foreground">AI Moderator Online</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Table --- */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Pending Reviews</CardTitle>
          <CardDescription>
            Select a case to view the flagged content and take action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ModerationDataTable
            columns={columns({
              onReview: setSelectedCase,
            })}
            data={cases}
          />
        </CardContent>
      </Card>

      {/* --- Modal --- */}
      <ResolveCaseModal
        modCase={selectedCase}
        isOpen={!!selectedCase}
        onClose={() => setSelectedCase(null)}
        onResolved={handleCaseResolved}
      />
    </div>
  );
}
