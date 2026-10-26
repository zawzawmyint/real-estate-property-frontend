import { expect, it, vi } from "vitest";
import { isValidElement, Children, type ReactElement } from "react";

const backend = vi.hoisted(() => ({ getPublicProperty: vi.fn() }));
vi.mock("@/lib/api/server", () => backend);
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));

import PropertiesError from "@/app/(staff)/crm/properties/error";
import PropertyPage from "@/app/(public)/properties/[id]/page";

it("uses the framework retry callback to recover a failed server read", () => {
  const retry = vi.fn();
  // The framework supplies both callbacks, but reset cannot re-fetch server data.
  const reset = vi.fn();
  const props = { retry, reset };
  const page = PropertiesError(props);
  const button = Children.toArray(page.props.children).find(
    (child) =>
      isValidElement(child) &&
      child.props &&
      (child.props as { children?: unknown }).children === "Try again",
  ) as ReactElement<{ onClick: () => void }>;

  button.props.onClick();

  expect(retry).toHaveBeenCalledOnce();
  expect(reset).not.toHaveBeenCalled();
});

it("treats UUID-shaped invalid public IDs as not found without contacting the backend", async () => {
  backend.getPublicProperty.mockRejectedValue(
    new Error("Unexpected backend call"),
  );

  await expect(
    PropertyPage({
      params: Promise.resolve({ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" }),
      searchParams: Promise.resolve({}),
    }),
  ).rejects.toThrow("NEXT_HTTP_ERROR_FALLBACK;404");
  expect(backend.getPublicProperty).not.toHaveBeenCalled();
});
