"use client";
import type { UseFormReturn } from "react-hook-form";
import { TextField, TextareaField } from "@/components/forms/fields";
import type { TaskFields as Fields } from "../data/input";

export function TaskFields({
  form,
  disabled,
}: {
  form: UseFormReturn<Fields>;
  disabled: boolean;
}) {
  const errors = form.formState.errors;
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-6">
      <TextField
        id="task-title"
        label="Title"
        {...form.register("title")}
        maxLength={160}
        error={errors.title?.message}
        placeholder="e.g. Discuss the offer and next steps"
      />
      <TextareaField
        id="task-notes"
        label="Notes"
        {...form.register("notes")}
        rows={5}
        maxLength={2000}
        error={errors.notes?.message}
        help="Optional · useful context for the next conversation."
      />
      <div className="border-t border-border pt-6">
        <h2 className="font-semibold">When is it due?</h2>
        <p className="mt-2 mb-5 text-sm text-muted-foreground">
          All task times use Dubai time (Asia/Dubai, UTC+04:00).
        </p>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            id="task-date"
            label="Due date"
            type="date"
            {...form.register("date")}
            error={errors.date?.message}
          />
          <TextField
            id="task-time"
            label="Due time"
            type="time"
            {...form.register("time")}
            error={errors.time?.message}
          />
        </div>
      </div>
    </fieldset>
  );
}
