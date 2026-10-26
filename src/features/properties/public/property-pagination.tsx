import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { parsePublicFilters, serializePropertyFilters } from "../data/filters";

export function PropertyPagination({
  query,
  page,
  pageSize,
  total,
}: {
  query: string;
  page: number;
  pageSize: number;
  total: number;
}) {
  const pages = Math.min(10000, Math.ceil(total / pageSize));

  if (pages < 2) return null;

  const filters = parsePublicFilters(new URLSearchParams(query));
  const href = (target: number) =>
    `/properties?${serializePropertyFilters({ ...filters, page: target })}`;
  const numbers = [
    ...new Set(
      [1, page - 1, page, page + 1, pages].filter(
        (item) => item >= 1 && item <= pages,
      ),
    ),
  ].sort((a, b) => a - b);

  return (
    <Pagination aria-label="Property result pages" className="mt-12">
      <PaginationContent className="flex-wrap justify-center gap-1">
        {page > 1 && page <= pages + 1 && (
          <PaginationItem>
            <PaginationPrevious href={href(page - 1)} />
          </PaginationItem>
        )}
        {numbers.map((number, index) => (
          <PaginationItem key={number} className="flex items-center">
            {index > 0 && number - (numbers[index - 1] ?? number) > 1 && (
              <PaginationEllipsis />
            )}
            <PaginationLink
              href={href(number)}
              isActive={number === page}
              aria-label={`Page ${number}`}
            >
              {number}
            </PaginationLink>
          </PaginationItem>
        ))}
        {page < pages && (
          <PaginationItem>
            <PaginationNext href={href(page + 1)} />
          </PaginationItem>
        )}
      </PaginationContent>
    </Pagination>
  );
}
