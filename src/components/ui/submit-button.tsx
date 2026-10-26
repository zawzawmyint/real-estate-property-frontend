"use client";

import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type SubmitButtonProps = Omit<
  ComponentProps<typeof Button>,
  "type" | "children"
> & {
  pending: boolean;
  label: ReactNode;
  pendingLabel: ReactNode;
};

export function SubmitButton({
  pending,
  label,
  pendingLabel,
  disabled,
  ...props
}: SubmitButtonProps) {
  return (
    <Button
      {...props}
      type="submit"
      disabled={disabled || pending}
      aria-busy={pending}
    >
      {pending && <Spinner />}
      {pending ? pendingLabel : label}
    </Button>
  );
}
