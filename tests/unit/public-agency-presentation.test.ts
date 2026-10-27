import { createElement as h } from "react";
import { renderToStaticMarkup as render } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type {
  PublicAgency,
  PublicAgentDetail,
} from "@/features/agency/data/types";

const state = vi.hoisted(() => ({ pathname: "/agents", purpose: "sale" }));

vi.mock("next/navigation", () => ({
  usePathname: () => state.pathname,
  useSearchParams: () => new URLSearchParams({ purpose: state.purpose }),
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/features/agency/data/queries", () => ({
  getPublicAgency: vi.fn(),
  getPublicAgents: vi.fn(),
}));
vi.mock("@/features/leads/public/agency-inquiry-card", () => ({
  AgencyInquiryCard: ({ isDemo }: { isDemo?: boolean | null }) =>
    h("form", {
      "aria-label": "Property enquiry",
      "data-demo-mode": isDemo === null ? "unknown" : String(isDemo),
    }),
}));

import { PublicHeader } from "@/components/layout/public-header";
import { ContactContent } from "@/features/agency/public/contact-content";
import { AgentDirectory } from "@/features/agency/public/agent-directory";
import { AgentProfile } from "@/features/agency/public/agent-profile";
import {
  getPublicAgency,
  getPublicAgents,
} from "@/features/agency/data/queries";

const agency: PublicAgency = {
  name: "Avenor Properties",
  isDemo: true,
  phone: null,
  email: null,
  address: null,
  officeHours: [],
  timeZone: "Asia/Dubai",
  mapUrl: null,
};
const agent: PublicAgentDetail = {
  slug: "sample-person",
  name: "Sample Person",
  title: "Property advisor",
  specialties: ["Buying", "Renting"],
  portrait: null,
  isDemo: true,
  introduction: "An introduction.",
  biography: ["A biography."],
  languages: ["English"],
  publicPhone: null,
  publicEmail: null,
};

beforeEach(() => vi.clearAllMocks());

it("preserves a neutral enquiry mode when public contact content is unavailable", async () => {
  vi.mocked(getPublicAgency).mockRejectedValue(new Error("outage"));
  const html = render(await ContactContent());
  expect(html).toContain('data-demo-mode="unknown"');
});

it.each(["/agents", "/agents/sample-person", "/contact"])(
  "selects the correct public destination at %s",
  (pathname) => {
    state.pathname = pathname;
    const html = render(h(PublicHeader));
    const activeLinks = html.match(/<a\b[^>]*aria-current="page"[^>]*>/g);
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks?.[0]).toContain(
      `href="${pathname === "/contact" ? "/contact" : "/agents"}"`,
    );
    expect(html).toContain('href="/properties?purpose=sale"');
    expect(html).toContain('href="/properties?purpose=rent"');
  },
);

it("lets the enquiry occupy the content width when direct channels and office are absent", async () => {
  vi.mocked(getPublicAgency).mockResolvedValue(agency);
  const html = render(await ContactContent());

  expect(html).toContain('aria-label="Property enquiry"');
  expect(html).not.toContain("lg:grid-cols-[5fr_7fr]");
  expect(html).not.toContain('href="tel:');
  expect(html).not.toContain('href="mailto:');
  expect(html).not.toContain("Visit our office");
  expect(html).toContain("Demo agency");
});

it("renders configured contacts and puts office details after the enquiry", async () => {
  vi.mocked(getPublicAgency).mockResolvedValue({
    ...agency,
    phone: "+971 4 123 4567",
    email: "hello@example.com",
    address: "Sample office",
    officeHours: [{ days: "Monday", hours: "09:00–17:00" }],
    mapUrl: "https://maps.example.com/office",
  });
  const html = render(await ContactContent());

  expect(html).toContain('href="tel:+97141234567"');
  expect(html).toContain('href="mailto:hello@example.com"');
  expect(html).toContain('rel="noopener noreferrer"');
  expect(html.indexOf('aria-label="Property enquiry"')).toBeLessThan(
    html.indexOf("Visit our office"),
  );
  expect(html).toContain("Dubai time");
});

it("retains the enquiry when contact information is unavailable", async () => {
  vi.mocked(getPublicAgency).mockRejectedValue(
    new Error("private service details"),
  );
  const html = render(await ContactContent());
  expect(html).toContain('aria-label="Property enquiry"');
  expect(html).toContain("temporarily unavailable");
  expect(html).not.toContain("private service details");
});

it("distinguishes an empty team from a failed directory", async () => {
  vi.mocked(getPublicAgents).mockResolvedValue({ items: [], total: 0 });
  const empty = render(await AgentDirectory());
  expect(empty).toContain("no public profiles available");
  expect(empty).not.toContain("Try again");

  vi.mocked(getPublicAgents).mockRejectedValue(new Error("private error"));
  const unavailable = render(await AgentDirectory());
  expect(unavailable).toContain("temporarily unavailable");
  expect(unavailable).toContain("Try again");
  expect(unavailable).not.toContain("no public profiles available");
});

it("renders a named portrait fallback and an explicit agency contact path without claiming agent listings", () => {
  const html = render(h(AgentProfile, { agent }));
  expect(html).toContain('aria-label="Sample Person. Portrait unavailable"');
  expect(html).toContain("Agency contact:");
  expect(html).toContain('href="/contact"');
  expect(html).toContain('href="/properties"');
  expect(html).not.toContain("properties by");
  expect(html).not.toContain('href="tel:');
  expect(html).not.toContain('href="mailto:');
  expect(html.indexOf("Sample Person</h1>")).toBeLessThan(
    html.indexOf("Portrait unavailable"),
  );
});
