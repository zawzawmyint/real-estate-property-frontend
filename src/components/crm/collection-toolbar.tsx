import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CollectionToolbar({
  children,
  navigation,
  filters,
  chips,
  className,
}: {
  children: ReactNode;
  navigation?: ReactNode;
  filters?: ReactNode;
  chips?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-4 border-b border-border pb-4",
        className,
      )}
    >
      {navigation}
      {children}
      {filters}
      {chips}
    </div>
  );
}
