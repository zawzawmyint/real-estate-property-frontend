import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function FilterChip({
  children,
  onRemove,
  removeLabel,
  disabled,
}: {
  children: ReactNode;
  onRemove: () => void;
  removeLabel: string;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled}
      className="min-h-8 max-w-full gap-2 rounded-full bg-primary/8 py-1 text-start font-normal text-foreground"
      aria-label={removeLabel}
      onClick={onRemove}
    >
      <span className="min-w-0 break-words">{children}</span>
      <Icon name="close" className="size-3 shrink-0 text-primary" />
    </Button>
  );
}
