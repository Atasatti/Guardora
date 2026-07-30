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
import { Product, ProductStatus } from "@/models";
import { deleteProduct, updateProductStatus } from "@/lib/actions/social";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { STORAGE_BASE_URL } from "@/lib/api-client";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Props {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (p: Product) => void;
  onDeleted: (id: string) => void;
}

export default function ViewProductModal({
  product,
  isOpen,
  onClose,
  onUpdated,
  onDeleted,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<ProductStatus>("AVAILABLE");

  useEffect(() => {
    if (product) setStatus(product.status);
  }, [product]);

  if (!product) return null;

  const handleStatusUpdate = async () => {
    setLoading(true);
    const res = await updateProductStatus(product._id, status);
    if (res.success) {
      toast.success("Status updated");
      onUpdated(res.product!);
      onClose();
    } else {
      toast.error("Failed to update");
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure?")) return;
    setLoading(true);
    const res = await deleteProduct(product._id);
    if (res.success) {
      toast.success("Product deleted");
      onDeleted(product._id);
      onClose();
    } else {
      toast.error("Failed to delete");
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Product Listing</DialogTitle>
          <DialogDescription>
            Listed by {product.sellerId.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Image */}
          <div className="relative aspect-video w-full rounded-lg overflow-hidden border bg-muted">
            {product.images[0] && (
              <Image
                src={`${STORAGE_BASE_URL}/${product.images[0]}`}
                alt="Product"
                fill
                className="object-cover"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Price</Label>
              <p className="text-xl font-bold text-green-600">
                ${product.price}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Category</Label>
              <p className="text-sm font-medium">{product.category}</p>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Title</Label>
            <p className="font-medium">{product.title}</p>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
              {product.description}
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label>Listing Status</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ProductStatus)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="SOLD">Sold</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="DELETED">Closed/Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex justify-between sm:justify-between w-full gap-2 mt-4">
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleStatusUpdate} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Status
              </Button>
            </div>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
