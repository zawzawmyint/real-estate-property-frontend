import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";

vi.mock("@/features/properties/data/actions", () => ({}));

import { PropertyFormFields } from "@/features/properties/crm/property-form-fields";
import { PropertyPhotos } from "@/features/properties/crm/property-photos";

it("associates purpose and property type validation errors with their selects", () => {
  const form = {
    register: (name: string) => ({ name }),
    formState: {
      errors: {
        purpose: { message: "Choose a purpose" },
        type: { message: "Required before publishing" },
      },
    },
  } as unknown as ComponentProps<typeof PropertyFormFields>["form"];
  const html = renderToStaticMarkup(
    createElement(PropertyFormFields, {
      form,
      pending: false,
      disabled: false,
    }),
  );

  for (const name of ["purpose", "type"]) {
    const select = html.match(
      new RegExp(`<select[^>]*id="property-${name}"[^>]*>`),
    )?.[0];

    expect(select).toContain('aria-invalid="true"');
    expect(select).toContain(`aria-describedby="property-${name}-error"`);
    expect(html).toContain(`id="property-${name}-error"`);
  }
});

it("associates the publishing photo error with the upload input", () => {
  const html = renderToStaticMarkup(
    createElement(PropertyPhotos, {
      property: {
        id: "draft",
        title: "Draft",
        photos: [],
        publishingState: "draft",
      } as unknown as ComponentProps<typeof PropertyPhotos>["property"],
      disabled: false,
      onChange: () => {},
      onBusyChange: () => {},
      validationError: "Add a saved photo before publishing.",
    }),
  );
  const input = html.match(/<input[^>]*id="property-photos"[^>]*>/)?.[0];

  expect(input).toContain('aria-invalid="true"');
  expect(input).toContain('aria-describedby="property-photos-error"');
  expect(html).toContain('id="property-photos-error"');
});
