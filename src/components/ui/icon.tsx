import { cn } from "@/lib/utils";

const paths = {
  "chevron-down": "m6 9 6 6 6-6",
  image: "M3 3h18v18H3zM3 17l6-6 4 4 3-3 5 5M16 7h.01",
  overview: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  leads: "M4 4h16v16H4zM4 13h4l2 3h4l2-3h4M8 8h8",
  properties:
    "M4 21V7h10v14M14 11h6v10M7 10h4M7 14h4M7 18h4M17 14v1M17 18v1M2 21h20",
  menu: "M4 6h16M4 12h16M4 18h16",
  external:
    "M14 3h7v7M21 3 10 14M10 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1v-6",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  logout: "M9 3H4a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h5M9 12h12m-5-5 5 5-5 5",
  retry: "M20 7v5h-5M4 17v-5h5M6 6a8 8 0 0 1 13 2M18 18A8 8 0 0 1 5 16",
  plus: "M12 5v14M5 12h14",
  search: "M16 10a6 6 0 1 1-12 0 6 6 0 0 1 12 0Zm-2 4 7 7",
  close: "m6 6 12 12M6 18 18 6",
  view: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Zm13 0a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
  edit: "m15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15l-1 6Z",
  expand: "m9 6 6 6-6 6",
  collapse: "m15 6-6 6 6 6",
};

export function Icon({
  name,
  className,
}: {
  name: keyof typeof paths;
  className?: string;
}) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      data-slot="icon"
      data-icon={name}
      className={cn("shrink-0", className)}
    >
      <path d={paths[name]} />
    </svg>
  );
}
