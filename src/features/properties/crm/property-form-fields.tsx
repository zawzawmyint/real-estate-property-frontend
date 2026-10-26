"use client";
import {
  TextField,
  SelectField,
  TextareaField,
} from "@/components/forms/fields";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { NativeSelectOption } from "@/components/ui/native-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { PropertyFormSection } from "./property-form-section";
import {
  propertyTypes,
  type propertyFormSchema,
  type PropertyFormValues,
} from "../data/input";

export const propertyFieldLabels: Record<keyof PropertyFormValues, string> = {
  title: "Title",
  purpose: "Purpose",
  type: "Property type",
  description: "Description",
  price: "Price (AED)",
  city: "City",
  community: "Community",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  areaSqft: "Area (sqft)",
  ownerName: "Owner name",
  ownerPhone: "Owner phone",
  featured: "Featured",
};

export function PropertyFormFields({
  form,
  pending,
  disabled,
}: {
  form: UseFormReturn<
    z.input<typeof propertyFormSchema>,
    unknown,
    PropertyFormValues
  >;
  pending: boolean;
  disabled: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = form;

  function field(
    key: Exclude<keyof PropertyFormValues, "featured">,
    multiline = false,
  ) {
    const properties = {
      ...register(key),
      id: `property-${key}`,
      readOnly: pending,
      maxLength:
        key === "description"
          ? 10000
          : key === "title"
            ? 160
            : key === "ownerPhone"
              ? 40
              : 120,
    };

    const common = {
      ...properties,
      label: propertyFieldLabels[key],
      error: errors[key]?.message,
      help:
        key === "price"
          ? "Sale total or annual rent, in AED."
          : key === "bedrooms"
            ? "Enter 0 for Studio."
            : undefined,
    };
    return multiline ? (
      <TextareaField key={key} {...common} rows={6} />
    ) : (
      <TextField
        key={key}
        {...common}
        inputMode={
          ["price", "areaSqft"].includes(key)
            ? "decimal"
            : ["bedrooms", "bathrooms"].includes(key)
              ? "numeric"
              : undefined
        }
      />
    );
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-6">
      <PropertyFormSection title="Basics">
        <div className="space-y-5">
          {field("title")}
          <div className="grid gap-5 sm:grid-cols-2">
            <SelectField
              label="Purpose"
              {...register("purpose")}
              id="property-purpose"
              error={errors.purpose?.message}
            >
              <NativeSelectOption value="sale">Buy / Sale</NativeSelectOption>
              <NativeSelectOption value="rent">Rent</NativeSelectOption>
            </SelectField>
            <SelectField
              label="Property type"
              {...register("type")}
              id="property-type"
              className="w-full"
              error={errors.type?.message}
            >
              <NativeSelectOption value="">Choose a type</NativeSelectOption>
              {propertyTypes.map((type) => (
                <NativeSelectOption key={type} value={type}>
                  {type[0]?.toUpperCase()}
                  {type.slice(1)}
                </NativeSelectOption>
              ))}
            </SelectField>
          </div>
          {field("description", true)}
          <Field>
            <FieldLabel htmlFor="property-featured">
              <input
                {...register("featured")}
                id="property-featured"
                type="checkbox"
                className="size-5 accent-primary"
              />{" "}
              Featured
            </FieldLabel>
            <p className="text-xs text-muted-foreground">
              Eligible featured listings may appear on the homepage.
            </p>
          </Field>
        </div>
      </PropertyFormSection>
      <PropertyFormSection title="Price and property facts">
        <div className="grid gap-5 sm:grid-cols-2">
          {field("price")}
          {field("areaSqft")}
          {field("bedrooms")}
          {field("bathrooms")}
        </div>
      </PropertyFormSection>
      <PropertyFormSection title="Location">
        <div className="grid gap-5 sm:grid-cols-2">
          {field("city")}
          {field("community")}
        </div>
      </PropertyFormSection>
      <PropertyFormSection title="Private owner details">
        <p className="mb-5 text-sm text-muted-foreground">
          Visible only to Admin and Manager staff.
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          {field("ownerName")}
          {field("ownerPhone")}
        </div>
      </PropertyFormSection>
    </fieldset>
  );
}
