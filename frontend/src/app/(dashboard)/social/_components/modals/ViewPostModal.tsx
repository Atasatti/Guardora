"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Post } from "@/models";
import { deletePost } from "@/lib/actions/social";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Trash2, Heart, MessageCircle } from "lucide-react";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

interface Props {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (id: string) => void;
}

export default function ViewPostModal({
  post,
  isOpen,
  onClose,
  onDeleted,
}: Props) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!post) return null;

  const handleDelete = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    setIsDeleting(true);
    const res = await deletePost(post._id);
    if (res.success) {
      toast.success("Post deleted");
      onDeleted(post._id);
      onClose();
    } else {
      toast.error(res.message || "Failed to delete");
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Post Details</DialogTitle>
          <DialogDescription>
            Posted on {new Date(post.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Author */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={`${STORAGE_BASE_URL}/${post.author.profilePicture}`}
              />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div>
              <h4 className="font-medium">{post.author.name}</h4>
              <p className="text-xs text-muted-foreground">
                {post.author.email}
              </p>
            </div>
          </div>

          {/* Content */}
          <div className="text-sm leading-relaxed">{post.description}</div>

          {/* Images Grid */}
          {post.images && post.images.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {post.images.map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-square rounded-md overflow-hidden border"
                >
                  <Image
                    src={`${STORAGE_BASE_URL}/${img}`}
                    alt={`Content ${i}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex gap-6 py-2 border-t border-b">
            <div className="flex items-center gap-2 text-sm">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="font-bold">{post.totalLikes}</span> Likes
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MessageCircle className="h-4 w-4 text-blue-500" />
              <span className="font-bold">{post.totalComments}</span> Comments
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Post
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
