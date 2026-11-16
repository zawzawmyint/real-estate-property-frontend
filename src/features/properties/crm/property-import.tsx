"use client";
import { CsvImport } from "@/components/crm/csv-import";
import { pendingStorageKey } from "@/components/crm/csv-import-state";
import {
  previewPropertyImport,
  commitPropertyImport,
} from "../data/import-actions";
const columns = [
  "title",
  "purpose",
  "type",
  "description",
  "price_aed",
  "city",
  "community",
  "bedrooms",
  "bathrooms",
  "area_sqft",
  "owner_name",
  "owner_phone",
];
export function PropertyImport({ staffId }: { staffId: string }) {
  return (
    <CsvImport
      key={staffId}
      storageKey={pendingStorageKey("properties", staffId)}
      itemLabels={{ singular: "draft", plural: "drafts" }}
      preview={(file) => previewPropertyImport(file, staffId)}
      commit={(file, identity) => commitPropertyImport(file, identity, staffId)}
      columns={[
        { id: "row", header: "Row", cell: (row) => row.rowNumber },
        ...columns.map((column, index) => ({
          id: column,
          header: column.replaceAll("_", " "),
          cell: (row: { values: string[] }) => row.values[index],
        })),
      ]}
      completionHref="/crm/properties?publishingState=draft"
      completionLabel="View draft inventory"
    />
  );
}
