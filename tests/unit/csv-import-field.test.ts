import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { CsvImportFileField } from "@/components/crm/csv-import-file-field";
it("associates the server decoding error with the shared import upload input", () => {
  const html = renderToStaticMarkup(
    createElement(CsvImportFileField, {
      error: "Choose a valid UTF-8 CSV file.",
    }),
  );
  const input = html.match(/<input[^>]*id="csv-file"[^>]*>/)?.[0];
  expect(input).toContain('aria-invalid="true"');
  expect(input).toContain('aria-describedby="csv-file-help csv-file-error"');
  expect(html).toContain('id="csv-file-error"');
  expect(html).toContain("Choose a valid UTF-8 CSV file.");
});
