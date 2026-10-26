import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import {
  PropertyInventoryLoading,
  PropertyCardsLoading,
} from "@/features/properties/shared/property-loading";
import { PropertyImagePlaceholder } from "@/features/properties/shared/property-image-placeholder";
import { NativeSelect } from "@/components/ui/native-select";
import { SubmitButton } from "@/components/ui/submit-button";

it("gives public and CRM results one accessible loading status with shared building artwork", () => {
  for (const Component of [PropertyCardsLoading, PropertyInventoryLoading]) {
    const html = renderToStaticMarkup(createElement(Component));
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(html).toContain('data-slot="building-loader"');
    expect(html.match(/data-slot="building-loader"/g)).toHaveLength(1);
    expect(html).toContain('aria-hidden="true"');
  }
});

it("keeps unavailable photo artwork static and distinct from active loading", () => {
  const html = renderToStaticMarkup(
    createElement(PropertyImagePlaceholder, { unavailable: true }),
  );
  expect(html).not.toContain('data-slot="building-loader"');
  expect(html).toContain('data-icon="image"');
  expect(html).toContain("Photo unavailable");
  expect(html).not.toContain('role="status"');
});

it("keeps pending submit feedback explicit and separate from branded page artwork", () => {
  const html = renderToStaticMarkup(
    createElement(SubmitButton, {
      pending: true,
      label: "Save changes",
      pendingLabel: "Saving…",
    }),
  );
  expect(html).toContain('data-slot="spinner"');
  expect(html).toContain("Saving…");
  expect(html).toContain('aria-busy="true"');
  expect(html).toContain("disabled");
  expect(html).not.toContain('data-slot="building-loader"');
});

it("uses a decorative SVG select chevron and retains native select semantics", () => {
  const html = renderToStaticMarkup(
    createElement(NativeSelect, {
      id: "property-type",
      "aria-label": "Property type",
    }),
  );
  expect(html).toContain("<select");
  expect(html).toContain('aria-label="Property type"');
  expect(html).toContain('data-slot="select-chevron"');
  expect(html).toContain('data-icon="chevron-down"');
  expect(html).not.toContain("⌄");
});
