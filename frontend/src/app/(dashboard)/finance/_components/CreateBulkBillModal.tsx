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
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createBulkBills } from "@/lib/actions";
import { Bill, CreateBulkBillData, BILL_TYPES } from "@/models";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";

// Form validation schema
const bulkBillFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  billType: z.enum(BILL_TYPES),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

type BulkBillFormData = z.infer<typeof bulkBillFormSchema>;

interface CreateBulkBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillsCreated: (bills: Bill[]) => void;
}

export default function CreateBulkBillModal({
  isOpen,
  onClose,
  onBillsCreated,
}: CreateBulkBillModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<BulkBillFormData>({
    //eslint-disable-next-line
    resolver: zodResolver(bulkBillFormSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      amount: 0,
      billType: "MAINTENANCE",
      month: new Date().toISOString().slice(0, 7),
    },
  });

  const onSubmit = async (data: BulkBillFormData) => {
    setIsLoading(true);

    try {
      const result = await createBulkBills(data as CreateBulkBillData);
      if (result!.success) {
        onBillsCreated(result!.bills || []);
        onClose();
        form.reset();
        toast.success(
          result!.message || "Bills created successfully for all residents!"
        );
      } else {
        throw new Error(result!.message);
      }
    } catch (error) {
      toast.error(
        `Failed to create bills: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Bulk Bills
          </DialogTitle>
          <DialogDescription>
            Create the same bill for all residents in the society.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Bill Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Monthly Maintenance" {...field} />
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
                    <FormLabel>Type *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
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
                    <Textarea
                      placeholder="Bill description for all residents..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Amount & Dates */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ($) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="month"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Month *</FormLabel>
                    <FormControl>
                      <Input type="month" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
              <div className="flex items-center gap-2 text-blue-800">
                <Users className="h-4 w-4" />
                <span className="font-medium">Bulk Operation</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                This will create the same bill for all residents in the society.
                Each resident will receive an individual bill with the same
                details.
              </p>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create for All Residents
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
