"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
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
        code?: string;
        message: string;
        uncertain?: boolean;
        fieldErrors?: Record<string, string[]>;
      };
      issues?: Issue[];
      issueCount?: number;
    };
export function CsvImport<P extends Preview>({
  storageKey,
  columns,
  preview: previewAction,
  commit,
  completionHref,
  completionLabel,
  maxBytes = 1048576,
  itemLabels = { singular: "record", plural: "records" },
  renderWarnings,
  requiresAcknowledgement,
  recoverLegacy,
}: {
  storageKey: string;
  columns: readonly DataColumn<Row>[];
  preview: (file: File) => Promise<Outcome<P>>;
  commit: (
    file: File,
    identity: PendingImport,
    preview: P,
    acknowledged: boolean,
  ) => Promise<Outcome<{ createdCount: number }>>;
  completionHref: string;
  completionLabel: string;
  maxBytes?: number;
  itemLabels?: { singular: string; plural: string };
  renderWarnings?: (
    preview: P,
    acknowledged: boolean,
    change: (value: boolean) => void,
    disabled: boolean,
  ) => ReactNode;
  requiresAcknowledgement?: (preview: P) => boolean;
  recoverLegacy?: (
    file: File,
    identity: PendingImport,
  ) => Promise<Outcome<{ createdCount: number }>>;
}) {
  const ready = useClientReady();
  const [file, setFile] = useState<File | null>(null),
    [preview, setPreview] = useState<P | null>(null),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [fileError, setFileError] = useState<string | undefined>(undefined),
    [warning, setWarning] = useState(""),
    [issues, setIssues] = useState<Issue[]>([]),
    [issueCount, setIssueCount] = useState(0),
    [complete, setComplete] = useState<number | null>(null),
    [uncertain, setUncertain] = useState(false),
    [confirmRisk, setConfirmRisk] = useState(false);
  const [acknowledgedWarnings, setAcknowledgedWarnings] = useState(false);
  const riskAction = useRef<"preview" | "commit">("commit");
  const definiteNoWrite = useRef(false);
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
  function finish(createdCount: number) {
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
    setComplete(createdCount);
    if (input.current) input.current.value = "";
  }
  async function runPreview(acceptRecoveryRisk = false) {
    if (guard.current || !file) return;
    guard.current = true;
    setBusy(true);
    setMessage("");
    setFileError(undefined);
    setAcknowledgedWarnings(false);
    const current = ++generation.current;
    try {
      if (
        recoverLegacy &&
        pending.current?.schemaVersion === 1 &&
        !acceptRecoveryRisk
      ) {
        const recovered = await recoverLegacy(file, pending.current);
        if (current !== generation.current) return;
        if (recovered.ok) {
          finish(recovered.data.createdCount);
          return;
        }
        setMessage(recovered.error.message);
        setUncertain(Boolean(recovered.error.uncertain));
        if (
          [
            "IMPORT_PREVIEW_STALE",
            "IMPORT_CONFLICT",
            "IMPORT_RECOVERY_FILE_MISMATCH",
          ].includes(recovered.error.code || "")
        ) {
          riskAction.current = "preview";
          setConfirmRisk(true);
        }
        return;
      }
      const result = await previewAction(file);
      if (current !== generation.current) return;
      if (result.ok) {
        setPreview(result.data);
        setUncertain(
          pending.current?.digest === result.data.digest &&
            pending.current.schemaVersion === result.data.schemaVersion &&
            !definiteNoWrite.current,
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
    if (
      !uncertain &&
      requiresAcknowledgement?.(preview) &&
      !acknowledgedWarnings
    )
      return;
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
      riskAction.current = "commit";
      setConfirmRisk(true);
      return;
    }
    guard.current = true;
    pending.current = identity;
    definiteNoWrite.current = false;
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
      const result = await commit(
        file,
        identity,
        preview,
        acknowledgedWarnings,
      );
      if (result.ok) {
        finish(result.data.createdCount);
      } else {
        setMessage(result.error.message);
        setUncertain(uncertain || Boolean(result.error.uncertain));
        if (result.error.code === "IMPORT_DUPLICATE_REVIEW_REQUIRED") {
          definiteNoWrite.current = !uncertain;
          setPreview(null);
          setAcknowledgedWarnings(false);
          setMessage(
            "Matching phone numbers changed. Preview the same file and acknowledge the current warnings before confirming again. No leads were imported.",
          );
        }
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
                setAcknowledgedWarnings(false);
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
              {renderWarnings?.(
                preview,
                acknowledgedWarnings,
                setAcknowledgedWarnings,
                !ready || busy,
              )}
              {preview.valid && (
                <div className="space-y-4">
                  <Button
                    disabled={
                      !ready ||
                      busy ||
                      (!uncertain &&
                        Boolean(requiresAcknowledgement?.(preview)) &&
                        !acknowledgedWarnings)
                    }
                    onClick={() => void runCommit()}
                  >
                    {uncertain
                      ? "Retry confirmation"
                      : `Import ${preview.totalRows} ${preview.totalRows === 1 ? itemLabels.singular : itemLabels.plural}`}
                  </Button>
                </div>
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
            <Button
              onClick={() => {
                if (riskAction.current === "preview") {
                  pending.current = null;
                  risk.current = false;
                  definiteNoWrite.current = false;
                  try {
                    sessionStorage.removeItem(storageKey);
                  } catch {
                    /* In-memory identity is explicitly reset by the user. */
                  }
                  setConfirmRisk(false);
                  void runPreview(true);
                } else void runCommit(true);
              }}
            >
              I understand, start new batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
