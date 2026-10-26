import { cn } from "@/lib/utils";
import styles from "./building-loader.module.css";

// Original Dubai skyline with a Burj Khalifa-inspired centerpiece. The status or control
// owns the announcement; this artwork is decorative.
export function BuildingLoader({
  className,
  animated = true,
}: {
  className?: string;
  animated?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      data-slot="building-loader"
      data-animated={animated}
      viewBox="0 0 96 96"
      fill="none"
      className={cn("size-24 shrink-0", styles.building, className)}
    >
      <path
        d="M8 90V63h13v27ZM24 90V51h11v39ZM60 90V58h12v32ZM80 90V61h9v29Z"
        fill="currentColor"
        opacity=".18"
      />
      <path
        d="M17 90V69h5V57h8v33ZM31 90V70l6-3 4 3v20ZM65 90V50h10v40ZM87 90V74h5v16Z"
        fill="currentColor"
        opacity=".45"
      />
      <path
        d="M13 90V78h13v12ZM29 90V83h13v7ZM42 90V76h1.5V62h1V49h1V38h1V29h1V21h1V13l.6-9 .6 9v13h1v7h1v9h1.2v11h1.2v12h1.7v12h2V90ZM55 90V76h12v14ZM73 90V81h15v9Z"
        fill="currentColor"
        opacity=".18"
      />
      <path
        className={styles.fill}
        d="M13 90V78h13v12ZM29 90V83h13v7ZM42 90V76h1.5V62h1V49h1V38h1V29h1V21h1V13l.6-9 .6 9v13h1v7h1v9h1.2v11h1.2v12h1.7v12h2V90ZM55 90V76h12v14ZM73 90V81h15v9Z"
        fill="currentColor"
      />
      <g className={styles.windows} fill="var(--background)">
        <path d="M48 32h.65v55H48zM46 53h.55v34H46zM50.5 48h.55v39h-.55zM17 81h.65v7H17zM21 81h.65v7H21zM58 80h.65v8H58zM62 80h.65v8H62zM78 84h.65v4H78zM83 84h.65v4H83z" />
      </g>
    </svg>
  );
}

export function LoadingState({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-8 text-sm text-primary",
        className,
      )}
    >
      <BuildingLoader className="size-24" />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
