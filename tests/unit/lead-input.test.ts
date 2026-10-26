import { expect, it } from "vitest";
import {
  leadFormSchema,
  budgetToFils,
  inquirySchema,
} from "@/features/leads/data/input";
import { parseLeadFilters, leadQuery } from "@/features/leads/data/filters";

it("requires one usable contact method and trims optional controls", () => {
  const values = {
    name: " Ada ",
    phone: "",
    email: "",
    purpose: "sale",
    budget: "",
    propertyId: "",
    source: "call",
    assignedAgentId: "",
  };
  expect(leadFormSchema.safeParse(values).success).toBe(false);
  expect(
    leadFormSchema.parse({ ...values, email: "ada@example.com" }).name,
  ).toBe("Ada");
  expect(leadFormSchema.safeParse({ ...values, phone: "---" }).success).toBe(
    false,
  );
});
it("converts decimal AED exactly and rejects rounding or unsafe values", () => {
  expect(budgetToFils("123.45")).toBe(12345);
  expect(budgetToFils("")).toBeNull();
  expect(() => budgetToFils("1.001")).toThrow();
  expect(() => budgetToFils("10000000001")).toThrow();
  expect(() => budgetToFils("0")).toThrow();
});
it("validates public submission keys and excludes staff fields", () => {
  const input = {
    submissionId: "12b7aaf0-bd6b-4d07-a2e3-a657148c13e7",
    name: "Ada",
    email: "ada@example.com",
  };
  expect(inquirySchema.safeParse(input).success).toBe(true);
  expect(
    inquirySchema.safeParse({ ...input, assignedAgentId: "staff" }).success,
  ).toBe(false);
});
it("enforces role-scoped filters and serializes stable navigation", () => {
  expect(parseLeadFilters(new URLSearchParams(), "agent").view).toBe("mine");
  expect(parseLeadFilters(new URLSearchParams(), "manager").view).toBe(
    "unassigned",
  );
  expect(() =>
    parseLeadFilters(new URLSearchParams("view=all"), "agent"),
  ).toThrow();
  expect(() =>
    parseLeadFilters(new URLSearchParams("page=-1"), "manager"),
  ).toThrow();
  expect(leadQuery({ view: "all", q: "Ada", sort: "newest", page: 2 })).toBe(
    "view=all&q=Ada&sort=newest&page=2",
  );
});
