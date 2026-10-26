import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-border bg-background text-foreground hover:bg-muted",
        ghost: "text-primary hover:bg-muted",
        destructive: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        default: "",
        sm: "px-3",
        icon: "size-11 px-0",
        "icon-sm": "size-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);
