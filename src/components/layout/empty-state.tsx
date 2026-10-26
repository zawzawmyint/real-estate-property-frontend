import type { ReactNode } from "react";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Empty className="rounded-2xl border border-border bg-card px-6 py-14 sm:px-12">
      <EmptyHeader className="max-w-md gap-0">
        <EmptyMedia
          variant="icon"
          aria-hidden="true"
          className="mb-5 size-12 rounded-xl text-xl text-primary"
        >
          ⌂
        </EmptyMedia>
        <EmptyTitle className="text-lg font-semibold tracking-normal">
          <h2>{title}</h2>
        </EmptyTitle>
        <EmptyDescription className="mt-3 leading-7">
          {children}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
