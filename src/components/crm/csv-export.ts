export type CsvEntity = "leads" | "properties";
export const CSV_MAX_BYTES = 10_485_760;
const limitMessage =
  "Too many results to export. Narrow your filters and try again.";
const genericMessage = "Could not export CSV. Please try again.";
const headers = {
  leads:
    "lead_id,name,phone,email,purpose,budget_aed,source,stage,assigned_agent_id,assigned_agent_name,property_id,property_title,property_location,created_at_utc,updated_at_utc",
  properties:
    "property_id,title,purpose,type,price_aed,city,community,bedrooms,bathrooms,area_sqft,publishing_state,availability,featured,is_demo,created_at_utc,updated_at_utc",
};

export async function readCsvResponse(response: Response, entity: CsvEntity) {
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? "Your session has expired. Please sign in and try again."
        : response.status === 403
          ? "You do not have permission to export these results."
          : response.status === 422
            ? limitMessage
            : genericMessage,
    );
  }
  const disposition = response.headers.get("content-disposition") || "";
  const filename = disposition.match(
    /^attachment;\s*filename="([^"]+)"$/i,
  )?.[1];
  if (
    !/^text\/csv;\s*charset=utf-8$/i.test(
      response.headers.get("content-type") || "",
    ) ||
    !filename ||
    !new RegExp(`^${entity}-\\d{4}-\\d{2}-\\d{2}\\.csv$`).test(filename) ||
    Number(response.headers.get("content-length")) > CSV_MAX_BYTES ||
    !response.body
  )
    throw new Error(genericMessage);

  const reader = response.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > CSV_MAX_BYTES) throw new Error(limitMessage);
      chunks.push(new Uint8Array(value));
    }
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
  const blob = new Blob(chunks, { type: "text/csv;charset=utf-8" });
  const prefix = new Uint8Array(await blob.slice(0, 3).arrayBuffer());
  const firstLine = (await blob.slice(3, 1024).text()).split("\r\n")[0];
  const expected = headers[entity];
  if (
    prefix[0] !== 239 ||
    prefix[1] !== 187 ||
    prefix[2] !== 191 ||
    (firstLine !== expected &&
      !(
        entity === "properties" &&
        firstLine === `${expected},owner_name,owner_phone`
      ))
  )
    throw new Error(genericMessage);
  return { blob, filename };
}

type DownloadAnchor = Pick<
  HTMLAnchorElement,
  "href" | "download" | "click" | "remove"
>;
type DownloadEnvironment = {
  createObjectURL: (blob: Blob) => string;
  revokeObjectURL: (url: string) => void;
  createAnchor: () => DownloadAnchor;
  appendAnchor: (anchor: DownloadAnchor) => void;
};

export function dispatchCsvDownload(
  blob: Blob,
  filename: string,
  environment: DownloadEnvironment = {
    createObjectURL: (value) => URL.createObjectURL(value),
    revokeObjectURL: (value) => URL.revokeObjectURL(value),
    createAnchor: () => document.createElement("a"),
    appendAnchor: (anchor) =>
      document.body.appendChild(anchor as HTMLAnchorElement),
  },
) {
  const url = environment.createObjectURL(blob);
  let anchor: DownloadAnchor | undefined;
  try {
    anchor = environment.createAnchor();
    anchor.href = url;
    anchor.download = filename;
    environment.appendAnchor(anchor);
    anchor.click();
  } finally {
    anchor?.remove();
    environment.revokeObjectURL(url);
  }
}

export type CsvExportState = {
  pending: boolean;
  error: string;
  message: string;
};
const idle: CsvExportState = { pending: false, error: "", message: "" };

/** Own the duplicate guard and generation so even a transport ignoring abort cannot download stale data. */
export function createCsvExportSession(options: {
  fetch: typeof fetch;
  download: typeof dispatchCsvDownload;
  onState: (state: CsvExportState) => void;
}) {
  let active: AbortController | undefined;
  return {
    cancel() {
      active?.abort();
      active = undefined;
      options.onState(idle);
    },
    async start(entity: CsvEntity, query: string) {
      if (active) return;
      const request = new AbortController();
      active = request;
      options.onState({ ...idle, pending: true });
      try {
        const response = await options.fetch(
          `/api/v1/staff/${entity}/export${query ? `?${query}` : ""}`,
          {
            credentials: "same-origin",
            cache: "no-store",
            signal: request.signal,
            headers: { Accept: "text/csv" },
          },
        );
        if (active !== request) return;
        const { blob, filename } = await readCsvResponse(response, entity);
        if (active !== request) return;
        options.download(blob, filename);
        options.onState({ ...idle, message: "Download started." });
      } catch (failure) {
        if (active !== request) return;
        options.onState({
          ...idle,
          error:
            failure instanceof Error &&
            [
              limitMessage,
              genericMessage,
              "Your session has expired. Please sign in and try again.",
              "You do not have permission to export these results.",
            ].includes(failure.message)
              ? failure.message
              : genericMessage,
        });
      } finally {
        if (active === request) active = undefined;
      }
    },
  };
}

/** Call before router navigation: a suspended replacement may retain the old export control. */
export function cancelCsvExports() {
  window.dispatchEvent(new Event("crm:export-navigation"));
}

export function csvNavigationChangesScope(
  currentHref: string,
  nextHref: string,
) {
  const current = new URL(currentHref);
  const next = new URL(nextHref, current);
  return (
    next.origin === current.origin &&
    (next.pathname !== current.pathname ||
      next.searchParams.toString() !== current.searchParams.toString())
  );
}
