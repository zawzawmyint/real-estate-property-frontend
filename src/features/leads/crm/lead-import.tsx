"use client";
import { CsvImport } from "@/components/crm/csv-import";
import { pendingStorageKey } from "@/components/crm/csv-import-state";
import { previewLeadImport, commitLeadImport } from "../data/import-actions";

const columns = ["name", "phone", "email", "purpose", "budget_aed", "source"];

export function LeadImport({ staffId }: { staffId: string }) {
  return (
    <CsvImport
      key={staffId}
      storageKey={pendingStorageKey("leads", staffId)}
      itemLabels={{ singular: "lead", plural: "leads" }}
      preview={(file) => previewLeadImport(file, staffId)}
      commit={(file, identity) => commitLeadImport(file, identity, staffId)}
      columns={[
        { id: "row", header: "Row", cell: (row) => row.rowNumber },
        ...columns.map((column, index) => ({
          id: column,
          header: column.replaceAll("_", " "),
          cell: (row: { values: string[] }) => row.values[index],
        })),
      ]}
      completionHref="/crm/leads?view=unassigned&stage=new"
      completionLabel="View new unassigned leads"
    />
  );
}
