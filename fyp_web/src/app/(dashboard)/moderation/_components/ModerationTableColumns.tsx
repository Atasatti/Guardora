"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ModerationCase } from "@/models";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertTriangle, ArrowRight } from "lucide-react";

const getConfidenceBadge = (conf?: string) => {
  if (!conf) return <Badge variant="outline">Unknown</Badge>;
  if (conf === "High")
    return <Badge variant="destructive">High Confidence</Badge>;
  if (conf === "Medium")
    return <Badge className="bg-orange-500 hover:bg-orange-600">Medium</Badge>;
  return <Badge variant="secondary">Low</Badge>;
};

export const columns = (callbacks: {
  onReview: (c: ModerationCase) => void;
}): ColumnDef<ModerationCase>[] => [
  {
    accessorKey: "targetModel",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className="font-mono">
        {row.original.targetModel.toUpperCase()}
      </Badge>
    ),
  },
  {
    accessorKey: "reason",
    header: "AI Flag",
    cell: ({ row }) => (
      <div className="flex items-center gap-2 font-medium text-destructive">
        <AlertTriangle className="h-4 w-4" />
        {row.original.reason}
      </div>
    ),
  },
  {
    accessorKey: "aiConfidence",
    header: "Confidence",
    cell: ({ row }) => getConfidenceBadge(row.original.aiConfidence),
  },
  {
    accessorKey: "flaggedContentSnippet",
    header: "Snippet",
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-sm text-muted-foreground italic">
        &quot;{row.original.flaggedContentSnippet}&quot;
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Detected At",
    cell: ({ row }) =>
      format(new Date(row.original.createdAt), "MMM dd, HH:mm"),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <Button size="sm" onClick={() => callbacks.onReview(row.original)}>
        Review <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
];
