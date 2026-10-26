"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Used subset of https://ui.shadcn.com/r/styles/base-nova/field.json.
// Keep native labels; the unused orientation/selection/separator helpers are omitted.
function Field({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="group"
      data-slot="field"
      data-orientation="vertical"
      className={cn(
        "group/field flex w-full flex-col gap-2 *:w-full [&>.sr-only]:w-auto",
        className,
      )}
      {...props}
    />
  );
}

function FieldLabel({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="field-label"
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 text-sm font-semibold leading-snug group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

function FieldError({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  if (!children) return null;

  return (
    <div
      role="alert"
      data-slot="field-error"
      className={cn("text-sm font-normal text-primary", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export { Field, FieldLabel, FieldError };
