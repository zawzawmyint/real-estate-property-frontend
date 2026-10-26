import type { ComponentProps, ReactNode } from "react";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";

type FieldProps = {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: ReactNode;
  fieldClassName?: string;
};
function descriptions(
  id: string,
  external: string | undefined,
  help: ReactNode,
  error: ReactNode,
) {
  return (
    [
      external,
      help ? `${id}-help` : undefined,
      error ? `${id}-error` : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined
  );
}
function FieldShell({
  id,
  label,
  help,
  error,
  fieldClassName,
  children,
}: FieldProps & { children: ReactNode }) {
  return (
    <Field className={fieldClassName} data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-xs text-muted-foreground">
          {help}
        </p>
      )}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </Field>
  );
}
export function TextField({
  id,
  label,
  help,
  error,
  fieldClassName,
  ...props
}: ComponentProps<typeof Input> & FieldProps) {
  return (
    <FieldShell {...{ id, label, help, error, fieldClassName }}>
      <Input
        {...props}
        id={id}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={descriptions(
          id,
          props["aria-describedby"],
          help,
          error,
        )}
      />
    </FieldShell>
  );
}
export function SelectField({
  id,
  label,
  help,
  error,
  fieldClassName,
  className,
  ...props
}: ComponentProps<typeof NativeSelect> & FieldProps) {
  return (
    <FieldShell {...{ id, label, help, error, fieldClassName }}>
      <NativeSelect
        {...props}
        id={id}
        className={className ?? "w-full"}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={descriptions(
          id,
          props["aria-describedby"],
          help,
          error,
        )}
      />
    </FieldShell>
  );
}
export function TextareaField({
  id,
  label,
  help,
  error,
  fieldClassName,
  ...props
}: ComponentProps<typeof Textarea> & FieldProps) {
  return (
    <FieldShell {...{ id, label, help, error, fieldClassName }}>
      <Textarea
        {...props}
        id={id}
        aria-invalid={error ? true : props["aria-invalid"]}
        aria-describedby={descriptions(
          id,
          props["aria-describedby"],
          help,
          error,
        )}
      />
    </FieldShell>
  );
}
