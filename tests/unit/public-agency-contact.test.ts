import { expect, it } from "vitest";
import { emailHref, mapHref, phoneHref } from "@/features/agency/data/contact";

it("keeps absent channels absent and formats usable public contact values", () => {
  expect(phoneHref(null)).toBeNull();
  expect(emailHref(" ")).toBeNull();
  expect(mapHref(null)).toBeNull();
  expect(phoneHref("+971 (4) 123 4567")).toBe("tel:+97141234567");
  expect(emailHref("hello@example.com")).toBe("mailto:hello@example.com");
  expect(mapHref("https://maps.example.com/office")).toBe(
    "https://maps.example.com/office",
  );
});

it("does not turn unsafe or unusable catalog channels into links", () => {
  expect(phoneHref("Call us soon")).toBeNull();
  expect(emailHref("hello@example.com?bcc=private@example.com")).toBeNull();
  expect(emailHref("hello@example.com\nBcc:other@example.com")).toBeNull();
  expect(mapHref("javascript:alert(1)")).toBeNull();
  expect(mapHref("http://maps.example.com")).toBeNull();
  expect(mapHref("https://user:password@maps.example.com")).toBeNull();
});
