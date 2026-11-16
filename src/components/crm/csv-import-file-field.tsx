import type { ComponentProps } from "react";
import { TextField } from "@/components/forms/fields";
/** Shared upload presentation, including associated server-side file diagnostics. */
export function CsvImportFileField(
  props: Omit<
    ComponentProps<typeof TextField>,
    "id" | "type" | "accept" | "label" | "help"
  >,
) {
  return (
    <TextField
      {...props}
      id="csv-file"
      type="file"
      accept=".csv,text/csv"
      label="CSV file"
      help="UTF-8 CSV, up to 1 MiB and 500 data rows."
    />
  );
}
