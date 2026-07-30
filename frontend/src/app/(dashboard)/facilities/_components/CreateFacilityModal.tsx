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
import { Switch } from "@/components/ui/switch";
import { createFacility } from "@/lib/actions";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import { Facility } from "@/models";

// Form validation schema
const facilityFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  imageUrl: z
    .string()
    .url("Valid URL required")
    .min(1, "Image URL is required"),
  description: z.string().min(1, "Description is required"),
  totalCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  availableCapacity: z.coerce
    .number()
    .min(0, "Available capacity cannot be negative"),
  isPaidService: z.boolean().default(false),
  pricePerHour: z.coerce.number().optional(),
  rules: z
    .array(z.string().min(1, "Rule cannot be empty"))
    .min(1, "At least one rule is required"),
  openTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
  closeTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)"),
});

type FacilityFormData = z.infer<typeof facilityFormSchema>;

export default function CreateFacilityModal({
  isOpen,
  onClose,
  onFacilityCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onFacilityCreated: (facility: Facility) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<string[]>([""]);

  // Fix: Use a more compatible approach
  const formMethods = useForm<FacilityFormData>({
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(facilityFormSchema) as any,
    defaultValues: {
      name: "",
      imageUrl: "",
      description: "",
      totalCapacity: 10,
      availableCapacity: 10,
      isPaidService: false,
      pricePerHour: undefined,
      rules: [""],
      openTime: "08:00",
      closeTime: "22:00",
    },
  });

  const isPaidService = formMethods.watch("isPaidService");

  const addRule = () => {
    setRules([...rules, ""]);
  };

  const removeRule = (index: number) => {
    if (rules.length > 1) {
      const newRules = rules.filter((_, i) => i !== index);
      setRules(newRules);
      formMethods.setValue("rules", newRules);
    }
  };

  const updateRule = (index: number, value: string) => {
    const newRules = [...rules];
    newRules[index] = value;
    setRules(newRules);
    formMethods.setValue("rules", newRules);
  };

  const onSubmit = async (data: FacilityFormData) => {
    setIsLoading(true);

    // Filter out empty rules
    const filteredRules = data.rules.filter((rule) => rule.trim() !== "");

    const submitData = {
      ...data,
      rules: filteredRules,
      // If not paid service, don't send pricePerHour
      ...(data.isPaidService ? {} : { pricePerHour: undefined }),
    };

    try {
      const result = await createFacility(submitData);

      if (result!.success && result!.facility) {
        onFacilityCreated(result!.facility);
        onClose();
        formMethods.reset();
        setRules([""]);
        toast.success("Facility created successfully!");
      } else {
        throw new Error(result!.message);
      }
    } catch (error) {
      toast.error(
        `Failed to create facility: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      formMethods.reset();
      setRules([""]);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Facility</DialogTitle>
          <DialogDescription>
            Create a new facility for the residential society.
          </DialogDescription>
        </DialogHeader>

        <Form {...formMethods}>
          <form
            onSubmit={formMethods.handleSubmit(onSubmit)}
            className="space-y-4"
          >
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formMethods.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facility Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Swimming Pool" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formMethods.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Paste an image URL"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={formMethods.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the facility, its features, and amenities..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formMethods.control}
                name="totalCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Capacity *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formMethods.control}
                name="availableCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Available Capacity *</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Operating Hours */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={formMethods.control}
                name="openTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={formMethods.control}
                name="closeTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Close Time *</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Payment Settings */}
            <div className="space-y-4">
              <FormField
                control={formMethods.control}
                name="isPaidService"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Paid Service</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Enable if this facility requires payment
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {isPaidService && (
                <FormField
                  control={formMethods.control}
                  name="pricePerHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price per Hour ($) *</FormLabel>
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
              )}
            </div>

            {/* Rules */}
            <div className="space-y-3">
              <FormLabel>Rules *</FormLabel>
              {rules.map((rule, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    placeholder={`Rule ${index + 1}`}
                    value={rule}
                    onChange={(e) => updateRule(index, e.target.value)}
                  />
                  {rules.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeRule(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addRule}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
              {formMethods.formState.errors.rules && (
                <p className="text-sm font-medium text-destructive">
                  {formMethods.formState.errors.rules.message}
                </p>
              )}
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
                Create Facility
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
