"use client";

import type { UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
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
      "aria-invalid": Boolean(errors[key]),
      "aria-describedby": errors[key] ? `property-${key}-error` : undefined,
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

    return (
      <Field key={key} data-invalid={Boolean(errors[key])}>
        <FieldLabel htmlFor={properties.id}>
          {propertyFieldLabels[key]}
        </FieldLabel>
        {multiline ? (
          <Textarea {...properties} rows={6} />
        ) : (
          <Input
            {...properties}
            inputMode={
              ["price", "areaSqft"].includes(key)
                ? "decimal"
                : ["bedrooms", "bathrooms"].includes(key)
                  ? "numeric"
                  : undefined
            }
          />
        )}
        {key === "price" && (
          <p className="text-xs text-muted-foreground">
            Sale total or annual rent, in AED.
          </p>
        )}
        {key === "bedrooms" && (
          <p className="text-xs text-muted-foreground">Enter 0 for Studio.</p>
        )}
        {errors[key] && (
          <FieldError id={`property-${key}-error`}>
            {errors[key]?.message}
          </FieldError>
        )}
      </Field>
    );
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-6">
      <PropertyFormSection title="Basics">
        <div className="space-y-5">
          {field("title")}
          <div className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="property-purpose">Purpose</FieldLabel>
              <NativeSelect
                {...register("purpose")}
                id="property-purpose"
                aria-invalid={Boolean(errors.purpose)}
                aria-describedby={
                  errors.purpose ? "property-purpose-error" : undefined
                }
                className="w-full"
              >
                <NativeSelectOption value="sale">Buy / Sale</NativeSelectOption>
                <NativeSelectOption value="rent">Rent</NativeSelectOption>
              </NativeSelect>
              <FieldError id="property-purpose-error">
                {errors.purpose?.message}
              </FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="property-type">Property type</FieldLabel>
              <NativeSelect
                {...register("type")}
                id="property-type"
                className="w-full"
                aria-invalid={Boolean(errors.type)}
                aria-describedby={
                  errors.type ? "property-type-error" : undefined
                }
              >
                <NativeSelectOption value="">Choose a type</NativeSelectOption>
                {propertyTypes.map((type) => (
                  <NativeSelectOption key={type} value={type}>
                    {type[0]?.toUpperCase()}
                    {type.slice(1)}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldError id="property-type-error">
                {errors.type?.message}
              </FieldError>
            </Field>
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
