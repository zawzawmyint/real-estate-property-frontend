import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

export function CollectionPagination({
  page,
  pageSize,
  total,
  href,
  showTotal = false,
}: {
  page: number;
  pageSize: number;
  total: number;
  href: (page: number) => string;
  showTotal?: boolean;
}) {
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
