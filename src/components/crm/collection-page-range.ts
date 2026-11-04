export function getCollectionPageRange(
  page: number,
  pageSize: number,
  total: number,
) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.max(1, Math.min(page, totalPages));
  const pages = [...new Set([1, current - 1, current, current + 1, totalPages])]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const items: (number | "ellipsis")[] = [];
  for (const value of pages) {
    const previous = items.at(-1);
    if (typeof previous === "number" && value - previous > 1)
      items.push("ellipsis");
    items.push(value);
  }
  const hasRows = total > 0 && page >= 1 && page <= totalPages;
  return {
    page,
    totalPages,
    start: hasRows ? (current - 1) * pageSize + 1 : 0,
    end: hasRows ? Math.min(current * pageSize, total) : 0,
    items,
  };
}
