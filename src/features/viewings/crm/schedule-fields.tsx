"use client";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/forms/fields";
import type { ScheduleFields } from "../data/input";
export function ViewingScheduleFields({
  form,
  disabled,
}: {
  form: UseFormReturn<ScheduleFields>;
  disabled: boolean;
}) {
  return (
    <fieldset disabled={disabled} className="grid min-w-0 gap-4 sm:grid-cols-3">
      <legend className="mb-4 text-sm font-semibold">
        When · Dubai time (UTC+4)
      </legend>
      <TextField
        id="viewing-form-date"
        label="Date"
        type="date"
        {...form.register("date")}
        error={form.formState.errors.date?.message}
      />
      <TextField
        id="viewing-start"
        label="Start time"
        type="time"
        {...form.register("start")}
        error={form.formState.errors.start?.message}
      />
      <TextField
        id="viewing-end"
        label="End time"
        type="time"
        {...form.register("end")}
        error={form.formState.errors.end?.message}
        help="An earlier end time means the next day."
      />
    </fieldset>
  );
}
