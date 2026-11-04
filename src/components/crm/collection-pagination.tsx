import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { getCollectionPageRange } from "./collection-page-range";

export function CollectionPagination({
  page,
  pageSize,
  total,
  href,
  showTotal = false,
  variant = "default",
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
  showTotal?: boolean;
  variant?: "default" | "workspace";
}) {
  if (variant === "workspace") {
    const range = getCollectionPageRange(page, pageSize, total);
    return (
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {`Showing ${range.start}–${range.end} of ${total}`}
        </p>
        <Pagination className="mx-0 w-auto max-w-full">
          <PaginationContent className="flex-wrap gap-1">
            {range.page > 1 && (
              <PaginationItem>
                <PaginationPrevious href={href(range.page - 1)} />
              </PaginationItem>
            )}
            {range.items.map((item, index) => (
              <PaginationItem
                key={item === "ellipsis" ? `ellipsis-${index}` : item}
              >
                {item === "ellipsis" ? (
                  <PaginationEllipsis />
                ) : (
                  <PaginationLink
                    href={href(item)}
                    isActive={item === range.page}
                    aria-label={`Page ${item}`}
                    className={
                      item === range.page
                        ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                        : "border border-border"
                    }
                  >
                    {item}
                  </PaginationLink>
                )}
              </PaginationItem>
            ))}
            {range.page > range.totalPages && (
              <PaginationItem>
                <span aria-current="page" className="px-3 text-sm">
                  {`Page ${range.page}`}
                </span>
              </PaginationItem>
            )}
            {range.page < range.totalPages && (
              <PaginationItem>
                <PaginationNext href={href(range.page + 1)} />
              </PaginationItem>
            )}
          </PaginationContent>
        </Pagination>
      </div>
    );
  }
  const previous = page > 1;
  const next = page * pageSize < total;
  if (!showTotal && !previous && !next) return null;
  const navigation = (
    <Pagination className={showTotal ? "mx-0 w-auto" : undefined}>
      <PaginationContent>
        {previous && (
          <PaginationItem>
            <PaginationPrevious href={href(page - 1)} />
          </PaginationItem>
        )}
        {!showTotal && (
          <PaginationItem>
            <span aria-current="page" className="px-4 text-sm">
              Page {page}
            </span>
          </PaginationItem>
        )}
        {next && (
          <PaginationItem>
            <PaginationNext href={href(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
  return showTotal ? (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        Page {page} of {Math.max(1, Math.ceil(total / pageSize))}
      </p>
      {navigation}
    </div>
  ) : (
    navigation
  );
}
