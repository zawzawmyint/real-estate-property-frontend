import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "button-primary bg-primary text-primary-foreground",
        outline:
          "button-secondary border border-primary bg-transparent text-primary",
        ghost: "text-primary hover:bg-muted",
        destructive: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      tone: {
        default: "",
        inverse: "button-inverse",
      },
      size: {
        default: "",
        sm: "px-3",
        icon: "size-11 px-0",
        "icon-sm": "size-11 px-0",
      },
    },
    defaultVariants: { variant: "default", size: "default", tone: "default" },
  },
);
