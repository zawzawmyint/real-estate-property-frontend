"use client";
import { CsvImport } from "@/components/crm/csv-import";
import { pendingStorageKey } from "@/components/crm/csv-import-state";
import {
  previewLeadImport,
  commitLeadImport,
  recoverLeadImport,
} from "../data/import-actions";
import { LeadImportDuplicateWarning } from "./lead-import-duplicate-warning";

const columns = ["name", "phone", "email", "purpose", "budget_aed", "source"];

export function LeadImport({ staffId }: { staffId: string }) {
  return (
    <CsvImport
      key={staffId}
      storageKey={pendingStorageKey("leads", staffId)}
      itemLabels={{ singular: "lead", plural: "leads" }}
      preview={(file) => previewLeadImport(file, staffId)}
      recoverLegacy={(file, identity) =>
        recoverLeadImport(file, identity, staffId)
      }
      requiresAcknowledgement={(preview) =>
        preview.duplicateReview.affectedRows > 0
      }
      renderWarnings={(preview, acknowledged, onChange, disabled) => (
        <LeadImportDuplicateWarning
          review={preview.duplicateReview}
          acknowledged={acknowledged}
          onChange={onChange}
          disabled={disabled}
        />
      )}
      commit={(file, identity, preview, acknowledged) =>
        commitLeadImport(
          file,
          identity,
          staffId,
          acknowledged
            ? { reviewToken: preview.duplicateReview.reviewToken }
            : undefined,
        )
      }
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
