"use client";
import { TextField, SelectField } from "@/components/forms/fields";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { FieldError } from "@/components/ui/field";
import type { LeadFormValues } from "../data/input";
import type { LeadDetail } from "../data/types";
import { SearchPicker } from "./search-picker";
export function LeadSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}
export function LeadFormFields({
  form,
  disabled,
  lead,
  manager,
}: {
  form: UseFormReturn<LeadFormValues>;
  disabled: boolean;
  lead?: LeadDetail;
  manager: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = form;
  const propertyId = useWatch({ control: form.control, name: "propertyId" });
  const assignedAgentId = useWatch({
    control: form.control,
    name: "assignedAgentId",
  });
  const purpose = useWatch({ control: form.control, name: "purpose" });
  function input(
    name: "name" | "phone" | "email" | "budget",
    label: string,
    props: Omit<React.ComponentProps<typeof TextField>, "id" | "label"> = {},
  ) {
    return (
      <TextField
        label={label}
        id={`lead-${name}`}
        {...register(name)}
        disabled={disabled}
        {...props}
        error={errors[name]?.message}
      />
    );
  }
  return (
    <>
      <LeadSection
        title="Contact details"
        description="A name and at least one contact method are required."
      >
        {input("name", "Name", { autoComplete: "name", maxLength: 120 })}
        <div className="grid gap-5 sm:grid-cols-2">
          {input("phone", "Phone", {
            type: "tel",
            autoComplete: "tel",
          })}
          {input("email", "Email", {
            type: "email",
            autoComplete: "email",
            maxLength: 254,
          })}
        </div>
      </LeadSection>
      <LeadSection title="Requirements">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Purpose"
            id="lead-purpose"
            {...register("purpose")}
            disabled={disabled}
            error={errors.purpose?.message}
          >
            <option value="sale">Buy</option>
            <option value="rent">Rent</option>
          </SelectField>
          {input(
            "budget",
            `Budget in AED${purpose === "rent" ? " (annual)" : ""} (optional)`,
            { inputMode: "decimal", placeholder: "e.g. 1,500,000" },
          )}
        </div>
      </LeadSection>
      <LeadSection
        title="Property"
        description="Optionally link an available property. Selecting a property sets the matching purpose."
      >
        <SearchPicker
          kind="property"
          value={propertyId}
          currentLabel={lead?.property?.title}
          disabled={disabled}
          onChange={(value, option) => {
            form.setValue("propertyId", value, {
              shouldDirty: true,
              shouldValidate: true,
            });
            if (option?.purpose)
              form.setValue("purpose", option.purpose, { shouldDirty: true });
          }}
        />
        {lead?.property && !lead.property.available && (
          <p className="text-sm text-muted-foreground">
            Previously linked: {lead.property.title} (unavailable). You may
            retain this context.
          </p>
        )}
        <FieldError>{errors.propertyId?.message}</FieldError>
      </LeadSection>
      {!lead && (
        <LeadSection title="Source">
          <SelectField
            label="Source"
            id="lead-source"
            {...register("source")}
            disabled={disabled}
            error={errors.source?.message}
          >
            <option value="call">Call</option>
            <option value="walk_in">Walk-in</option>
          </SelectField>
        </LeadSection>
      )}
      {!lead && manager && (
        <LeadSection
          title="Assignment"
          description="Leave unassigned for the inbox, or choose an active agent."
        >
          <SearchPicker
            kind="agent"
            value={assignedAgentId}
            disabled={disabled}
            onChange={(value) =>
              form.setValue("assignedAgentId", value, { shouldDirty: true })
            }
          />
        </LeadSection>
      )}
    </>
  );
}
