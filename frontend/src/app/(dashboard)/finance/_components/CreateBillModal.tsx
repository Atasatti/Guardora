"use client";

import { useState, useEffect } from "react";
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { createBill, getAllUsers } from "@/lib/actions";
import { Bill, CreateBillData, BILL_TYPES, UserSummary } from "@/models";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Form validation schema
const billFormSchema = z.object({
  userId: z.string().min(1, "Please select a resident"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  dueDate: z.string().min(1, "Due date is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  billType: z.enum(BILL_TYPES),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"),
});

type BillFormData = z.infer<typeof billFormSchema>;

interface CreateBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated: (bill: Bill) => void;
}

export default function CreateBillModal({
  isOpen,
  onClose,
  onBillCreated,
}: CreateBillModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const form = useForm<BillFormData>({
    //eslint-disable-next-line
    resolver: zodResolver(billFormSchema) as any,
    defaultValues: {
      title: "",
      description: "",
      dueDate: "",
      amount: 0,
      billType: "MAINTENANCE",
      month: new Date().toISOString().slice(0, 7), // Current month YYYY-MM
    },
  });

  // Load users when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    setIsUsersLoading(true);
    const result = await getAllUsers();
    if (result!.success) {
      setUsers(result!.users || []);
    } else {
      toast.error("Failed to load users");
    }
    setIsUsersLoading(false);
  };

  const onSubmit = async (data: BillFormData) => {
    setIsLoading(true);

    try {
      const result = await createBill(data as CreateBillData);
      if (result!.success && result!.bill) {
        onBillCreated(result!.bill);
        onClose();
        form.reset();
        toast.success("Bill created successfully!");
      } else {
        throw new Error(result!.message);
      }
    } catch (error) {
      toast.error(
        `Failed to create bill: ${
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

  const selectedUser = users.find((user) => user._id === form.watch("userId"));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Bill</DialogTitle>
          <DialogDescription>
            Add a new bill for a specific resident.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Resident Selection */}
            <FormField
              control={form.control}
              name="userId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Resident *</FormLabel>
                  <Popover open={userOpen} onOpenChange={setUserOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={userOpen}
                        className="w-full justify-between"
                        disabled={isUsersLoading}
                      >
                        {field.value ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>
                              {selectedUser?.name} (Unit{" "}
                              {selectedUser?.unitNumber})
                            </span>
                          </div>
                        ) : (
                          "Select resident..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search residents..." />
                        <CommandList>
                          <CommandEmpty>No resident found.</CommandEmpty>
                          <CommandGroup>
                            {users.map((user) => (
                              <CommandItem
                                key={user._id}
                                value={`${user.name} ${user.unitNumber}`}
                                onSelect={() => {
                                  field.onChange(user._id);
                                  setUserOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value === user._id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{user.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    Unit {user.unitNumber} • {user.email}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bill Details */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Maintenance Fee" {...field} />
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
                      placeholder="Bill description..."
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
                Create Bill
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
