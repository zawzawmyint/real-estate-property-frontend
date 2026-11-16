import { describe, expect, it, vi } from "vitest";
import {
  leadExportQuery,
  parseLeadFilters,
} from "@/features/leads/data/filters";
import {
  propertyExportQuery,
  parsePropertyFilters,
} from "@/features/properties/data/filters";
import {
  createCsvExportSession,
  dispatchCsvDownload,
  readCsvResponse,
  CSV_MAX_BYTES,
  csvNavigationChangesScope,
} from "@/components/crm/csv-export";

const leadHeader =
  "lead_id,name,phone,email,purpose,budget_aed,source,stage,assigned_agent_id,assigned_agent_name,property_id,property_title,property_location,created_at_utc,updated_at_utc";
function csv(
  body = `\uFEFF${leadHeader}\r\n`,
  headers: Record<string, string> = {},
) {
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="leads-2026-11-11.csv"',
      ...headers,
    },
  });
}

describe("CSV filter mapping", () => {
  it.each([
    "view=mine&view=all",
    "unknown=value",
    "stage=",
    "view=all&agentId=".concat("x".repeat(201)),
  ])(
    "rejects invalid lead filters before an export can be enabled: %s",
    (query) => {
      expect(() =>
        parseLeadFilters(new URLSearchParams(query), "manager"),
      ).toThrow();
    },
  );
  it("retains role defaults and every applied lead filter, excluding pagination", () => {
    expect(
      new URLSearchParams(
        leadExportQuery(parseLeadFilters(new URLSearchParams(), "agent")),
      ).get("view"),
    ).toBe("mine");
    expect(
      new URLSearchParams(
        leadExportQuery(parseLeadFilters(new URLSearchParams(), "manager")),
      ).get("view"),
    ).toBe("unassigned");
    const result = new URLSearchParams(
      leadExportQuery(
        parseLeadFilters(
          new URLSearchParams(
            "view=all&q=A%26B&stage=new&source=call&agentId=123&sort=oldest&page=4",
          ),
          "manager",
        ),
      ),
    );
    expect(Object.fromEntries(result)).toEqual({
      view: "all",
      q: "A&B",
      stage: "new",
      source: "call",
      agentId: "123",
      sort: "oldest",
    });
  });
  it("retains property false/zero and staff filters while excluding both pagination keys", () => {
    const filters = parsePropertyFilters(
      new URLSearchParams(
        "q=Test&purpose=rent&type=villa&location=Marina&minPriceFils=0&maxPriceFils=10000&minBedrooms=0&featured=false&publishingState=draft&availability=available&sort=price_asc&page=3&pageSize=24",
      ),
      true,
    );
    const query = new URLSearchParams(propertyExportQuery(filters));
    expect(query.has("page")).toBe(false);
    expect(query.has("pageSize")).toBe(false);
    expect(Object.fromEntries(query)).toEqual({
      q: "Test",
      purpose: "rent",
      type: "villa",
      location: "Marina",
      minPriceFils: "0",
      maxPriceFils: "10000",
      minBedrooms: "0",
      featured: "false",
      publishingState: "draft",
      availability: "available",
      sort: "price_asc",
    });
  });
});

describe("CSV response and download lifecycle", () => {
  it("does not invalidate a download control for no-op or hash-only navigation", () => {
    const current = "https://agency.test/crm/properties?sort=updated_desc";
    expect(csvNavigationChangesScope(current, current)).toBe(false);
    expect(csvNavigationChangesScope(current, `${current}#filters`)).toBe(
      false,
    );
    expect(
      csvNavigationChangesScope(
        current,
        "https://agency.test/crm/properties?q=changed",
      ),
    ).toBe(true);
    expect(
      csvNavigationChangesScope(current, "https://agency.test/crm/leads"),
    ).toBe(true);
  });
  it("accepts the contract CSV including BOM and header-only results", async () => {
    const result = await readCsvResponse(csv(), "leads");
    expect(result.filename).toBe("leads-2026-11-11.csv");
    expect(new Uint8Array(await result.blob.arrayBuffer()).slice(0, 3)).toEqual(
      new Uint8Array([239, 187, 191]),
    );
  });
  it.each([
    ["<html>Error</html>", {}],
    ['{"error":"oops"}', {}],
    [`\uFEFF${leadHeader}\r\n`, { "Content-Type": "application/json" }],
    [
      `\uFEFF${leadHeader}\r\n`,
      { "Content-Disposition": 'attachment; filename="../../evil.csv"' },
    ],
    [
      `\uFEFF${leadHeader}\r\n`,
      {
        "Content-Disposition":
          'attachment; filename="properties-2026-11-11.csv"',
      },
    ],
    [`\uFEFF${leadHeader}\r\n`, { "Content-Length": String(10_485_761) }],
  ])(
    "rejects invalid content or unsafe metadata without downloading",
    async (body, headers) => {
      await expect(
        readCsvResponse(csv(body, headers), "leads"),
      ).rejects.toThrow();
    },
  );
  it("bounds actual streamed bytes even without content-length", async () => {
    const response = csv("x".repeat(CSV_MAX_BYTES + 1));
    await expect(readCsvResponse(response, "leads")).rejects.toThrow();
  });
  it.each([401, 403, 422, 500])(
    "returns safe actionable feedback for HTTP %s",
    async (status) => {
      const download = vi.fn();
      const state = vi.fn();
      const session = createCsvExportSession({
        fetch: vi.fn(async () => new Response("private detail", { status })),
        download,
        onState: state,
      });
      await session.start("leads", "view=mine");
      expect(download).not.toHaveBeenCalled();
      const final = state.mock.calls.at(-1)?.[0];
      expect(final.pending).toBe(false);
      expect(final.error).not.toContain("private detail");
      expect(final.error).toContain(
        status === 401
          ? "sign in"
          : status === 403
            ? "permission"
            : status === 422
              ? "Too many results to export. Narrow your filters and try again."
              : "try again",
      );
    },
  );
  it("guards same-tick duplicate activation and discards cancelled late responses", async () => {
    let resolve!: (value: Response) => void;
    const fetch = vi.fn<typeof globalThis.fetch>(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    const download = vi.fn();
    const state = vi.fn();
    const session = createCsvExportSession({ fetch, download, onState: state });
    const first = session.start("leads", "view=mine");
    await session.start("leads", "view=mine");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(false);
    session.cancel();
    expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
    resolve(csv());
    await first;
    expect(download).not.toHaveBeenCalled();
    expect(state.mock.calls.at(-1)?.[0].pending).toBe(false);
  });
  it("allows explicit retry after network errors and uses fixed same-origin endpoints", async () => {
    const fetch = vi
      .fn()
      .mockRejectedValueOnce(new Error("secret"))
      .mockResolvedValue(csv());
    const download = vi.fn();
    const state = vi.fn();
    const session = createCsvExportSession({ fetch, download, onState: state });
    await session.start("leads", "view=mine");
    expect(fetch).toHaveBeenCalledTimes(1);
    await session.start("leads", "view=mine");
    expect(fetch.mock.calls[1]?.[0]).toBe(
      "/api/v1/staff/leads/export?view=mine",
    );
    expect(fetch.mock.calls[1]?.[1]).toMatchObject({
      credentials: "same-origin",
      cache: "no-store",
    });
    expect(download).toHaveBeenCalledTimes(1);
    expect(state.mock.calls.at(-1)?.[0].message).toBe("Download started.");
  });
  it("never downloads an invalid success response", async () => {
    const download = vi.fn();
    const session = createCsvExportSession({
      fetch: vi.fn(async () => csv("<html>Login</html>")),
      download,
      onState: vi.fn(),
    });
    await session.start("leads", "view=mine");
    expect(download).not.toHaveBeenCalled();
  });
  it("discards data cancelled during body reading, without disrupting a replacement request", async () => {
    let controller!: ReadableStreamDefaultController<Uint8Array>;
    const body = new ReadableStream<Uint8Array>({
      start(value) {
        controller = value;
      },
    });
    const firstResponse = new Response(body, { headers: csv().headers });
    const fetch = vi
      .fn<typeof globalThis.fetch>()
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(csv());
    const download = vi.fn();
    const session = createCsvExportSession({
      fetch,
      download,
      onState: vi.fn(),
    });
    const first = session.start("leads", "view=mine");
    await vi.waitFor(() => expect(body.locked).toBe(true));
    session.cancel();
    await session.start("leads", "view=all");
    controller.enqueue(new TextEncoder().encode(`\uFEFF${leadHeader}\r\n`));
    controller.close();
    await first;
    expect(download).toHaveBeenCalledTimes(1);
  });
  it.each([false, true])(
    "removes the anchor and revokes the object URL even if click throws: %s",
    (throws) => {
      const anchor = {
        href: "",
        download: "",
        click: vi.fn(() => {
          if (throws) throw new Error("blocked");
        }),
        remove: vi.fn(),
      };
      const environment = {
        createObjectURL: vi.fn(() => "blob:test"),
        revokeObjectURL: vi.fn(),
        createAnchor: vi.fn(() => anchor),
        appendAnchor: vi.fn(),
      };
      const run = () =>
        dispatchCsvDownload(
          new Blob(["csv"]),
          "leads-2026-11-11.csv",
          environment,
        );
      if (throws) expect(run).toThrow();
      else run();
      expect(anchor.download).toBe("leads-2026-11-11.csv");
      expect(anchor.remove).toHaveBeenCalledOnce();
      expect(environment.revokeObjectURL).toHaveBeenCalledWith("blob:test");
    },
  );
});
