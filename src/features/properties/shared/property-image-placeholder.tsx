import { cn } from "@/lib/utils";
import { Icon } from "@/components/ui/icon";

export function PropertyImagePlaceholder({
  className,
  unavailable = false,
  showLabel = true,
}: {
  className?: string;
  unavailable?: boolean;
  showLabel?: boolean;
}) {
  return (
    <div
      aria-hidden="true"
      data-slot="property-image-placeholder"
      data-state={unavailable ? "unavailable" : "loading"}
      className={cn(
        "pointer-events-none flex h-full w-full flex-col items-center justify-center gap-3 bg-muted text-primary",
        className,
      )}
    >
      {unavailable && <Icon name="image" className="size-8 max-w-[40%]" />}
      {unavailable && showLabel && (
        <span className="text-sm text-muted-foreground">Photo unavailable</span>
      )}
    </div>
  );
}
