"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModerationCase, Post, Product } from "@/models";
import { resolveModerationCase } from "@/lib/actions/moderation";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, ShieldBan, CheckCircle } from "lucide-react";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface Props {
  modCase: ModerationCase | null;
  isOpen: boolean;
  onClose: () => void;
  onResolved: (id: string) => void;
}

export default function ResolveCaseModal({
  modCase,
  isOpen,
  onClose,
  onResolved,
}: Props) {
  const [loading, setLoading] = useState(false);

  if (!modCase) return null;

  // Type Guards to safely access properties
  const isPost = modCase.targetModel === "Post";
  const content = modCase.targetId as Post | Product;

  // Safe accessors
  const title = isPost ? "Social Post" : (content as Product).title;
  const description = isPost
    ? (content as Post).description
    : (content as Product).description;
  const image = content.images?.[0];

  const handleAction = async (action: "BAN" | "DISMISS") => {
    setLoading(true);
    const res = await resolveModerationCase(modCase._id, action);

    if (res.success) {
      toast.success(
        action === "BAN" ? "Content removed and user flagged" : "Case dismissed"
      );
      onResolved(modCase._id);
      onClose();
    } else {
      toast.error(res.message || "Action failed");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <ShieldBan className="h-5 w-5" /> Moderation Review
          </DialogTitle>
          <DialogDescription>
            AI has flagged this content as <strong>{modCase.reason}</strong> (
            {modCase.aiConfidence} Confidence).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Preview */}
          <div className="bg-muted/30 border rounded-lg overflow-hidden">
            {image && (
              <div className="relative w-full h-48 bg-black/5">
                <Image
                  src={`${STORAGE_BASE_URL}/${image}`}
                  alt="Flagged Content"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{modCase.targetModel}</Badge>
                <span className="text-xs text-muted-foreground">
                  User ID:{" "}
                  {/* @ts-expect-error - Assuming author/sellerId is populated */}
                  {content.author?._id || content.sellerId?._id || "Unknown"}
                </span>
              </div>
              {title && !isPost && <h4 className="font-semibold">{title}</h4>}
              <p className="text-sm leading-relaxed">{description}</p>
            </div>
          </div>

          {/* AI Analysis Box */}
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-md">
            <h5 className="font-semibold text-destructive text-sm mb-1">
              AI Detection Reason:
            </h5>
            <p className="text-sm">{modCase.reason}</p>
            <div className="mt-2 text-xs text-muted-foreground">
              Snippet Trigger: &quot;{modCase.flaggedContentSnippet}&quot;
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:justify-between mt-4">
          <Button
            variant="outline"
            onClick={() => handleAction("DISMISS")}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            Dismiss (Safe)
          </Button>

          <Button
            variant="destructive"
            onClick={() => handleAction("BAN")}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldBan className="h-4 w-4 mr-2" />
            )}
            Ban Content
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
