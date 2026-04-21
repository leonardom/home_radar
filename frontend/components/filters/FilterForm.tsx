import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createFilterFormSchema } from "@/features/filters/filter-form.schemas";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const schema = createFilterFormSchema;
type FormValues = z.infer<typeof schema>;

export function FilterForm({
  onSubmit,
  defaultValues,
}: {
  onSubmit: (values: FormValues) => void;
  defaultValues?: Partial<FormValues>;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Price Min</label>
        <Input type="number" {...register("priceMin")} min={0} />
        {errors.priceMin && (
          <span className="text-destructive text-xs">
            {errors.priceMin.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Price Max</label>
        <Input type="number" {...register("priceMax")} min={0} />
        {errors.priceMax && (
          <span className="text-destructive text-xs">
            {errors.priceMax.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Bedrooms Min</label>
        <Input type="number" {...register("bedroomsMin")} min={0} />
        {errors.bedroomsMin && (
          <span className="text-destructive text-xs">
            {errors.bedroomsMin.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Bedrooms Max</label>
        <Input type="number" {...register("bedroomsMax")} min={0} />
        {errors.bedroomsMax && (
          <span className="text-destructive text-xs">
            {errors.bedroomsMax.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Bathrooms Min</label>
        <Input type="number" {...register("bathroomsMin")} min={0} />
        {errors.bathroomsMin && (
          <span className="text-destructive text-xs">
            {errors.bathroomsMin.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Bathrooms Max</label>
        <Input type="number" {...register("bathroomsMax")} min={0} />
        {errors.bathroomsMax && (
          <span className="text-destructive text-xs">
            {errors.bathroomsMax.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Location</label>
        <Input type="text" {...register("location")} />
        {errors.location && (
          <span className="text-destructive text-xs">
            {errors.location.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">Property Type</label>
        <Input type="text" {...register("propertyType")} />
        {errors.propertyType && (
          <span className="text-destructive text-xs">
            {errors.propertyType.message}
          </span>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium">
          Keywords (comma separated)
        </label>
        <Input type="text" {...register("keywords")} />
        {errors.keywords && (
          <span className="text-destructive text-xs">
            {errors.keywords.message}
          </span>
        )}
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Save Filter"}
      </Button>
    </form>
  );
}
