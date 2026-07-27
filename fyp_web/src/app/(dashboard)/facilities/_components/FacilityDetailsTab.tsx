"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Badge } from "@/components/ui/badge";
import { updateFacility } from "@/lib/actions";
import { Facility } from "@/models";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import Image from "next/image";
import { STORAGE_BASE_URL } from "@/lib/api-client";

const facilityFormSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  imageUrl: z
    .string()
    .url("Valid URL required")
    .min(1, "Image URL is required")
    .optional(),
  description: z.string().min(1, "Description is required").optional(),
  totalCapacity: z.number().min(1, "Capacity must be at least 1").optional(),
  availableCapacity: z
    .number()
    .min(0, "Available capacity cannot be negative")
    .optional(),
  isPaidService: z.boolean().default(false).optional(),
  pricePerHour: z.number().optional(),
  rules: z
    .array(z.string().min(1, "Rule cannot be empty"))
    .min(1, "At least one rule is required")
    .optional(),
  openTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
    .optional(),
  closeTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:mm)")
    .optional(),
});

type FacilityFormData = z.infer<typeof facilityFormSchema>;

interface FacilityDetailsTabProps {
  facility: Facility;
  onFacilityUpdated: (updatedFacility: Facility) => void;
}

export default function FacilityDetailsTab({
  facility,
  onFacilityUpdated,
}: FacilityDetailsTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [rules, setRules] = useState<string[]>(facility.rules);

  const formMethods = useForm<FacilityFormData>({
    //eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(facilityFormSchema) as any,
    defaultValues: {
      name: facility.name,
      imageUrl: facility.imageUrl,
      description: facility.description,
      totalCapacity: facility.totalCapacity,
      availableCapacity: facility.availableCapacity,
      isPaidService: facility.isPaidService,
      pricePerHour: facility.pricePerHour,
      rules: facility.rules,
      openTime: facility.openTime,
      closeTime: facility.closeTime,
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

    const submitData = { ...data };
    if (data.rules) {
      submitData.rules = data.rules.filter((rule) => rule.trim() !== "");
    }

    if (data.isPaidService === false) {
      submitData.pricePerHour = undefined;
    }

    try {
      const result = await updateFacility(facility._id, submitData);
      if (result!.success) {
        onFacilityUpdated(result!.facility!);
        toast.success("Facility updated successfully!");
      } else {
        throw new Error(result!.message);
      }
    } catch (error) {
      toast.error(
        `Failed to update facility: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Facility Preview */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Image
            src={`${STORAGE_BASE_URL}/${facility.imageUrl}`}
            alt={facility.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-md object-cover"
          />
          <div className="flex-1">
            <h3 className="font-semibold">{facility.name}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {facility.description}
            </p>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline">
                {facility.availableCapacity}/{facility.totalCapacity} available
              </Badge>
              <Badge variant="outline">
                {facility.openTime} - {facility.closeTime}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
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
                  <FormLabel>Facility Name</FormLabel>
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
                  <FormLabel>Image URL</FormLabel>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe the facility..."
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
                  <FormLabel>Total Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
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
                  <FormLabel>Available Capacity</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                    />
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
                  <FormLabel>Open Time</FormLabel>
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
                  <FormLabel>Close Time</FormLabel>
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
                      checked={field.value || false}
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
                    <FormLabel>Price per Hour ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
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
            )}
          </div>

          {/* Rules */}
          <div className="space-y-3">
            <FormLabel>Rules</FormLabel>
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
            <Button type="button" variant="outline" size="sm" onClick={addRule}>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
            {formMethods.formState.errors.rules && (
              <p className="text-sm font-medium text-destructive">
                {formMethods.formState.errors.rules.message}
              </p>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
