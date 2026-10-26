import type { Key, ReactNode } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export type DataColumn<T> = {
  id: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  headerClassName?: string;
};
export function DataTable<T>({
  rows,
  columns,
  getRowKey,
  label,
  empty,
  renderMobile,
}: {
  rows: readonly T[];
  columns: readonly DataColumn<T>[];
  getRowKey: (row: T) => Key;
  label: string;
  empty: ReactNode;
  renderMobile?: (row: T) => ReactNode;
}) {
  if (!rows.length) return empty;
  return (
    <>
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border bg-card",
          renderMobile && "hidden md:block",
        )}
      >
        <Table aria-label={label}>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.id} className={column.headerClassName}>
                  {column.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={getRowKey(row)}>
                {columns.map((column) => (
                  <TableCell key={column.id} className={column.className}>
                    {column.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderMobile && (
        <ul aria-label={label} className="grid min-w-0 gap-4 md:hidden">
          {rows.map((row) => (
            <li key={getRowKey(row)} className="min-w-0">
              {renderMobile(row)}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
