import { afterEach, beforeEach, expect, it, vi } from "vitest";

const boundary = vi.hoisted(() => ({
  session: vi.fn(),
  cookies: vi.fn(),
  headers: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth/server", () => ({ getStaffSession: boundary.session }));
vi.mock("next/headers", () => ({
  cookies: boundary.cookies,
  headers: boundary.headers,
}));

import {
  createProperty,
  updateProperty,
  deleteProperty,
  uploadPropertyPhoto,
  reorderPropertyPhotos,
  removePropertyPhoto,
} from "@/features/properties/data/actions";

const id = "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7";
const photoId = "55b7aaf0-bd6b-4d07-a2e3-a657148c13e7";
const draft = { id, title: "Draft", photos: [], publishingState: "draft" };
const input = { title: "Draft", purpose: "sale" as const };

beforeEach(() => {
  vi.clearAllMocks();
  boundary.session.mockResolvedValue({ id: "staff", role: "admin" });
  boundary.cookies.mockResolvedValue({
    get: (name: string) =>
      name === "agency.session" ? { value: "signed-session" } : undefined,
  });
  boundary.headers.mockResolvedValue(
    new Headers({
      Origin: "http://localhost:3100",
      "X-Untrusted": "do-not-forward",
    }),
  );
  vi.stubEnv("API_URL", "http://localhost:4311");
  vi.stubGlobal(
    "fetch",
    vi.fn().mockImplementation(async () => Response.json(draft)),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it("creates through the private backend origin with only the staff cookie and origin", async () => {
  expect(await createProperty(input)).toEqual({ ok: true, data: draft });
  expect(fetch).toHaveBeenCalledWith(
    "http://localhost:4311/api/v1/staff/properties",
    expect.objectContaining({
      method: "POST",
      cache: "no-store",
      body: JSON.stringify(input),
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: "agency.session=signed-session",
        Origin: "http://localhost:3100",
      },
    }),
  );
});
it.each([null, { role: "agent" }])(
  "rejects unauthenticated and read-only action callers before writing: %s",
  async (session) => {
    boundary.session.mockResolvedValue(session);

    const result = await createProperty(input);

    expect(result).toMatchObject({
      ok: false,
      error: { status: session ? 403 : 401 },
    });
    expect(fetch).not.toHaveBeenCalled();
  },
);
it.each([
  () => createProperty({ ...input, title: "" }),
  () => createProperty({ ...input, ownerPhone: "x" }),
  () => updateProperty("invalid", { title: "Changed" }),
  () => updateProperty(id, {}),
  () => updateProperty(id, { title: undefined }),
  () => reorderPropertyPhotos(id, ["foreign-format"]),
  () => removePropertyPhoto(id, "invalid"),
])("rejects invalid inputs before backend dispatch", async (operation) => {
  expect(await operation()).toMatchObject({
    ok: false,
    error: { code: "VALIDATION_ERROR", status: 400 },
  });
  expect(fetch).not.toHaveBeenCalled();
});

it("returns field errors without accepting extra private payload fields", async () => {
  const result = await createProperty({
    ...input,
    title: "",
    internal: true,
  } as typeof input);

  expect(result).toMatchObject({
    ok: false,
    error: { fieldErrors: { title: expect.any(Array) } },
  });
  expect(fetch).not.toHaveBeenCalled();
});

it("returns a safe expected backend permission error", async () => {
  vi.mocked(fetch).mockResolvedValue(
    Response.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "private internals",
          requestId: "r-1",
        },
      },
      { status: 403 },
    ),
  );
  expect(await updateProperty(id, { title: "Changed" })).toMatchObject({
    ok: false,
    error: {
      status: 403,
      code: "FORBIDDEN",
      requestId: "r-1",
      message: "You do not have permission to perform this action.",
    },
  });
});
it.each(["network", "malformed"])(
  "marks an uncertain create after %s failure without retrying",
  async (failure) => {
    if (failure === "network")
      vi.mocked(fetch).mockRejectedValue(new Error("private endpoint secret"));
    else vi.mocked(fetch).mockResolvedValue(Response.json({}));

    const result = await createProperty(input);

    expect(result).toMatchObject({ ok: false, error: { uncertain: true } });
    expect(JSON.stringify(result)).not.toContain("private endpoint secret");
    expect(fetch).toHaveBeenCalledTimes(1);
  },
);

it("does not label session service failures as an uncertain write", async () => {
  boundary.session.mockRejectedValue(new Error("private session internals"));

  const result = await createProperty(input);

  expect(result).toMatchObject({
    ok: false,
    error: { code: "SERVICE_UNAVAILABLE" },
  });
  expect(JSON.stringify(result)).not.toContain("private session internals");
  expect(result.ok || result.error.uncertain).toBeFalsy();
  expect(fetch).not.toHaveBeenCalled();
});

it("rejects requests without an Origin before forwarding a write", async () => {
  boundary.headers.mockResolvedValue(new Headers());
  expect(await createProperty(input)).toMatchObject({
    ok: false,
    error: { code: "INVALID_ORIGIN", status: 403 },
  });
  expect(fetch).not.toHaveBeenCalled();
});

it("accepts a 5 MiB photo but rejects larger or unsupported files", async () => {
  const file = new File([new Uint8Array(5_242_880)], "photo.png", {
    type: "image/png",
  });

  expect(await uploadPropertyPhoto(id, file)).toMatchObject({ ok: true });
  expect(fetch).toHaveBeenCalledWith(
    expect.stringContaining(`/properties/${id}/photos`),
    expect.objectContaining({
      body: file,
      headers: expect.objectContaining({ "Content-Type": "image/png" }),
    }),
  );
  vi.mocked(fetch).mockClear();
  expect(
    await uploadPropertyPhoto(
      id,
      new File([new Uint8Array(5_242_881)], "large.png", { type: "image/png" }),
    ),
  ).toMatchObject({ ok: false });
  expect(
    await uploadPropertyPhoto(
      id,
      new File(["text"], "text.txt", { type: "text/plain" }),
    ),
  ).toMatchObject({ ok: false });
  expect(fetch).not.toHaveBeenCalled();
});

it("serializes successful deletion without expecting a JSON response", async () => {
  vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 204 }));
  expect(await deleteProperty(id)).toEqual({ ok: true, data: undefined });
});

it("rejects Manager deletion before calling Express", async () => {
  boundary.session.mockResolvedValue({ role: "manager" });
  expect(await deleteProperty(id)).toMatchObject({
    ok: false,
    error: { status: 403 },
  });
  expect(fetch).not.toHaveBeenCalled();
});

it("forwards lifecycle and photo changes to their exact endpoints", async () => {
  expect(
    await updateProperty(id, { publishingState: "archived" }),
  ).toMatchObject({ ok: true });
  expect(fetch).toHaveBeenLastCalledWith(
    expect.stringContaining(`/properties/${id}`),
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ publishingState: "archived" }),
    }),
  );
  expect(await reorderPropertyPhotos(id, [photoId])).toMatchObject({
    ok: true,
  });
  expect(fetch).toHaveBeenLastCalledWith(
    expect.stringContaining(`/properties/${id}/photos/order`),
    expect.objectContaining({
      method: "PATCH",
      body: JSON.stringify({ photoIds: [photoId] }),
    }),
  );
  expect(await removePropertyPhoto(id, photoId)).toMatchObject({ ok: true });
  expect(fetch).toHaveBeenLastCalledWith(
    expect.stringContaining(`/properties/${id}/photos/${photoId}`),
    expect.objectContaining({ method: "DELETE" }),
  );
});

it("uses the production cookie name without forwarding other cookies", async () => {
  vi.stubEnv("NODE_ENV", "production");
  boundary.cookies.mockResolvedValue({
    get: (name: string) =>
      name === "__Host-agency.session"
        ? { value: "production-session" }
        : undefined,
  });
  expect(await createProperty(input)).toMatchObject({ ok: true });
  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: expect.objectContaining({
        Cookie: "__Host-agency.session=production-session",
      }),
    }),
  );
});
