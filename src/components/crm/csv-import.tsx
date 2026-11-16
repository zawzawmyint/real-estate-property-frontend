"use client";
import { useEffect, useRef, useState } from "react";
import type { DataColumn } from "./data-table";
import { DataTable } from "./data-table";
import {
  chooseIdentity,
  recoverPending,
  type PendingImport,
} from "./csv-import-state";
import { CsvImportFileField } from "./csv-import-file-field";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useClientReady } from "@/lib/use-client-ready";
type Issue = { rowNumber: number; column: string; message: string };
type Row = { rowNumber: number; values: string[] };
type Preview = {
  schemaVersion: number;
  digest: string;
  valid: boolean;
  totalRows: number;
  validRows: number;
  issueCount: number;
  issues: Issue[];
  previewRows: Row[];
};
type Outcome<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        message: string;
        uncertain?: boolean;
        fieldErrors?: Record<string, string[]>;
      };
      issues?: Issue[];
      issueCount?: number;
    };
export function CsvImport({
  storageKey,
  columns,
  preview: previewAction,
  commit,
  completionHref,
  completionLabel,
  maxBytes = 1048576,
  itemLabels = { singular: "record", plural: "records" },
}: {
  storageKey: string;
  columns: readonly DataColumn<Row>[];
  preview: (file: File) => Promise<Outcome<Preview>>;
  commit: (
    file: File,
    identity: PendingImport,
  ) => Promise<Outcome<{ createdCount: number }>>;
  completionHref: string;
  completionLabel: string;
  maxBytes?: number;
  itemLabels?: { singular: string; plural: string };
}) {
  const ready = useClientReady();
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<Preview | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [fileError, setFileError] = useState<string | undefined>(undefined),
    [warning, setWarning] = useState(""),
    [issues, setIssues] = useState<Issue[]>([]),
    [issueCount, setIssueCount] = useState(0),
    [complete, setComplete] = useState<number | null>(null),
    [uncertain, setUncertain] = useState(false),
    [confirmRisk, setConfirmRisk] = useState(false);
  const pending = useRef<PendingImport | null>(null),
    risk = useRef(false),
    guard = useRef(false),
    generation = useRef(0),
    input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const recovered = recoverPending(sessionStorage.getItem(storageKey));
        pending.current = recovered.pending;
        risk.current = recovered.risk;
        if (recovered.pending)
          setWarning(
            "An earlier import needs confirmation. Select the same file and preview it to recover safely.",
          );
        if (recovered.risk)
          setWarning(
            "Previous confirmation details could not be recovered. Starting again can create duplicates.",
          );
      } catch {
        risk.current = true;
        setWarning(
          "Reload recovery is unavailable. Keep this page open for safe confirmation retries.",
        );
      }
    });
    return () => {
      active = false;
    };
  }, [storageKey]);
  async function runPreview() {
    if (guard.current || !file) return;
    guard.current = true;
    setBusy(true);
    setMessage("");
    setFileError(undefined);
    const current = ++generation.current;
    try {
      const result = await previewAction(file);
      if (current !== generation.current) return;
      if (result.ok) {
        setPreview(result.data);
        setUncertain(
          pending.current?.digest === result.data.digest &&
            pending.current.schemaVersion === result.data.schemaVersion,
        );
        setIssues(result.data.issues);
        setIssueCount(result.data.issueCount);
      } else {
        setPreview(null);
        setMessage(result.error.message);
        setFileError(result.error.fieldErrors?.file?.[0]);
      }
    } catch {
      setMessage("The preview could not be loaded. Try again.");
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  async function runCommit(acknowledged = false) {
    if (guard.current || !file || !preview?.valid) return;
    let identity: PendingImport;
    try {
      identity = chooseIdentity(
        pending.current,
        preview.digest,
        preview.schemaVersion,
        risk.current,
        acknowledged,
      );
    } catch {
      setConfirmRisk(true);
      return;
    }
    guard.current = true;
    pending.current = identity;
    setConfirmRisk(false);
    setBusy(true);
    setMessage("");
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(identity));
    } catch {
      setWarning(
        "Reload recovery is unavailable. Keep this page open; retries here reuse the same confirmation.",
      );
    }
    try {
      const result = await commit(file, identity);
      if (result.ok) {
        setWarning("");
        try {
          sessionStorage.removeItem(storageKey);
        } catch {
          setWarning(
            "Saved successfully, but recovery details could not be cleared in this browser.",
          );
        }
        pending.current = null;
        risk.current = false;
        setFile(null);
        setPreview(null);
        setIssues([]);
        setIssueCount(0);
        setUncertain(false);
        setComplete(result.data.createdCount);
        if (input.current) input.current.value = "";
      } else {
        setMessage(result.error.message);
        setUncertain(Boolean(result.error.uncertain));
        if (result.issues) {
          setIssues(result.issues);
          setIssueCount(result.issueCount ?? result.issues.length);
          setPreview(null);
        }
      }
    } catch {
      setMessage(
        "The import could not be confirmed. Retry confirmation with the same file.",
      );
      setUncertain(true);
    } finally {
      guard.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="min-w-0 space-y-6">
      {warning && (
        <Alert>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      )}
      {complete !== null ? (
        <section role="status" className="space-y-3">
          <h2 className="text-xl font-semibold">Import complete</h2>
          <p>
            {complete}{" "}
            {complete === 1
              ? `${itemLabels.singular} created`
              : `${itemLabels.plural} created`}
            .
          </p>
          <a href={completionHref} className="underline">
            {completionLabel}
          </a>
        </section>
      ) : (
        <>
          <div className="max-w-xl space-y-4">
            <CsvImportFileField
              ref={input}
              disabled={!ready || busy}
              onChange={(event) => {
                generation.current++;
                setFile(event.target.files?.[0] ?? null);
                setPreview(null);
                setIssues([]);
                setIssueCount(0);
                setMessage("");
                setFileError(undefined);
                setUncertain(false);
              }}
              error={
                file && file.size > maxBytes
                  ? "Choose a CSV up to 1 MiB."
                  : fileError
              }
            />
            <Button
              disabled={!ready || busy || !file || file.size > maxBytes}
              onClick={() => void runPreview()}
            >
              Preview CSV
            </Button>
          </div>
          <div role="status" aria-live="polite">
            {busy
              ? preview
                ? "Confirming import…"
                : "Validating CSV…"
              : preview
                ? `${preview.validRows} of ${preview.totalRows} rows valid.`
                : ""}
          </div>
          {message && (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          {issueCount > 0 && (
            <Alert variant="destructive">
              <AlertDescription>
                <p>
                  {issueCount} {issueCount === 1 ? "issue" : "issues"}. No
                  records will be imported. Fix every invalid row and preview
                  again.
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {issues.map((issue, index) => (
                    <li key={index}>
                      Row {issue.rowNumber}, {issue.column}: {issue.message}
                    </li>
                  ))}
                </ul>
                {issueCount > issues.length && (
                  <p>Showing the first {issues.length} issues.</p>
                )}
              </AlertDescription>
            </Alert>
          )}
          {preview && (
            <section className="min-w-0 space-y-4">
              <h2 className="text-xl font-semibold">CSV preview</h2>
              <p className="text-sm text-muted-foreground">
                Showing {preview.previewRows.length} of {preview.totalRows}{" "}
                rows. All rows are validated.
              </p>
              <DataTable
                rows={preview.previewRows}
                columns={columns}
                getRowKey={(row) => row.rowNumber}
                label="CSV preview"
                empty={<p>No data rows.</p>}
              />
              {preview.valid && (
                <Button
                  disabled={!ready || busy}
                  onClick={() => void runCommit()}
                >
                  {uncertain
                    ? "Retry confirmation"
                    : `Import ${preview.totalRows} ${preview.totalRows === 1 ? itemLabels.singular : itemLabels.plural}`}
                </Button>
              )}
            </section>
          )}
        </>
      )}
      <Dialog open={confirmRisk} onOpenChange={setConfirmRisk}>
        <DialogContent>
          <DialogTitle>Start another import?</DialogTitle>
          <DialogDescription>
            A previous import may have completed. Starting another batch can
            create duplicates. Check existing records first. Continue only if
            you accept that risk.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRisk(false)}>
              Cancel
            </Button>
            <Button onClick={() => void runCommit(true)}>
              I understand, start new batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
