"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateBill, deleteBill } from "@/lib/actions";
import { Bill, UpdateBillData, BILL_TYPES } from "@/models";
import { toast } from "sonner";
import { Loader2, Trash2, User, Calendar, DollarSign } from "lucide-react";
import { format } from "date-fns";

// Form validation schema
const billFormSchema = z.object({
  title: z.string().min(1, "Title is required").optional(),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required").optional(),
  amount: z.number().min(0.01, "Amount must be greater than 0").optional(),
  billType: z.enum(BILL_TYPES).optional(),
  isCleared: z.boolean().optional(),
});

type BillFormData = z.infer<typeof billFormSchema>;

interface ViewBillModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
  onBillUpdated: (updatedBill: Bill) => void;
  onBillDeleted: (
    deletedBillId: string,
    deletedBillAmount: number,
    wasCleared: boolean
  ) => void;
}

export default function ViewBillModal({
  bill,
  isOpen,
  onClose,
  onBillUpdated,
  onBillDeleted,
}: ViewBillModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BillFormData>({
    //eslint-disable-next-line
    resolver: zodResolver(billFormSchema) as any,
    defaultValues: {
      title: bill?.title || "",
      description: bill?.description || "",
      dueDate: bill?.dueDate
        ? format(new Date(bill.dueDate), "yyyy-MM-dd")
        : "",
      amount: bill?.amount || 0,
      billType: bill?.billType || "OTHER",
      isCleared: bill?.isCleared || false,
    },
  });

  // Update form when bill changes
  useState(() => {
    if (bill) {
      form.reset({
        title: bill.title,
        description: bill.description || "",
        dueDate: bill.dueDate
          ? format(new Date(bill.dueDate), "yyyy-MM-dd")
          : "",
        amount: bill.amount,
        billType: bill.billType,
        isCleared: bill.isCleared,
      });
    }
  });

  const onSubmit = async (data: BillFormData) => {
    if (!bill) return;

    setIsLoading(true);

    try {
      const result = await updateBill(bill._id, data as UpdateBillData);
      if (result!.success && result!.bill) {
        onBillUpdated(result!.bill);
        onClose();
        toast.success("Bill updated successfully!");
      } else {
        throw new Error(result!.message);
      }
    } catch (error) {
      toast.error(
        `Failed to update bill: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!bill) return;

    setIsLoading(true);

    try {
      const result = await deleteBill(bill._id);
      if (result!.success) {
        onBillDeleted(bill._id, bill.amount, bill.isCleared);
        onClose();
        toast.success("Bill deleted successfully!");
      } else {
        throw new Error(result!.message);
      }
    } catch (error) {
      toast.error(
        `Failed to delete bill: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!bill) {
    return null;
  }

  const isOverdue = !bill.isCleared && new Date(bill.dueDate) < new Date();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[500px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bill Details</span>
            <Badge
              variant={
                bill.isCleared
                  ? "default"
                  : isOverdue
                  ? "destructive"
                  : "outline"
              }
            >
              {bill.isCleared ? "Paid" : isOverdue ? "Overdue" : "Pending"}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            View and manage bill information.
          </DialogDescription>
        </DialogHeader>

        {/* Bill Overview */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Resident Info */}
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={bill.user.profilePicture}
                  alt={bill.user.name}
                />
                <AvatarFallback>
                  <User className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{bill.user.name}</div>
                <div className="text-sm text-muted-foreground">
                  Unit {bill.user.unitNumber} • {bill.user.email}
                </div>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Amount</span>
                </div>
                <div className="font-semibold">${bill.amount.toFixed(2)}</div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Due Date</span>
                </div>
                <div className="font-semibold">
                  {format(new Date(bill.dueDate), "MMM dd, yyyy")}
                </div>
              </div>
            </div>

            {/* Bill Type */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">Type</div>
              <Badge variant="outline">
                {bill.billType.charAt(0) + bill.billType.slice(1).toLowerCase()}
              </Badge>
            </div>

            {/* Month */}
            <div>
              <div className="text-sm text-muted-foreground mb-1">
                Billing Month
              </div>
              <div className="font-medium">
                {format(new Date(bill.month + "-01"), "MMMM yyyy")}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="billType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {BILL_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isCleared"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Mark as Paid</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Check if this bill has been paid
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-between pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isLoading}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Bill
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete
                      the bill.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteBill}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Delete Bill
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
