import { randomUUID } from "node:crypto";
import { request } from "@playwright/test";

/** Compile all route shapes before parallel browsers can race Webpack HMR. */
export default async function warmup() {
  const client = await request.newContext({
    baseURL: "http://localhost:3100",
    extraHTTPHeaders: { Origin: "http://localhost:3100" },
  });
  let propertyId: string | undefined;

  try {
    for (const path of [
      "/",
      "/login",
      "/missing-page",
      "/properties",
      "/contact",
      "/agents",
      "/agents/amira-hassan",
      "/agents/unknown-person",
      `/properties/${randomUUID()}`,
    ]) {
      const response = await client.get(path);

      if (![200, 404].includes(response.status()))
        throw new Error(`Warmup ${path}: ${response.status()}`);
    }

    const signIn = await client.post("/api/v1/auth/sign-in/email", {
      data: {
        email: "e2e-property-desktop-admin@example.com",
        password: process.env.STAFF_E2E_PASSWORD,
        rememberMe: true,
      },
    });

    if (!signIn.ok()) throw new Error(`Warmup sign-in: ${signIn.status()}`);

    const created = await client.post("/api/v1/staff/properties", {
      data: { title: `Route warmup ${randomUUID()}`, purpose: "sale" },
    });

    if (created.status() !== 201)
      throw new Error(`Warmup create: ${created.status()}`);

    propertyId = (await created.json()).id as string;

    for (const path of [
      "/crm",
      "/crm/properties",
      "/crm/properties/new",
      `/crm/properties/${propertyId}`,
      `/crm/properties/${propertyId}/edit`,
    ]) {
      const response = await client.get(path, { maxRedirects: 0 });

      if (response.status() !== 200)
        throw new Error(`Warmup ${path}: ${response.status()}`);
    }

    const leadResponse = await client.post("/api/v1/staff/leads", {
      data: {
        submissionId: randomUUID(),
        name: `Lead route warmup ${randomUUID()}`,
        email: "fictional-warmup@example.com",
        purpose: "sale",
        source: "call",
      },
    });

    if (leadResponse.status() !== 201)
      throw new Error(`Warmup lead create: ${leadResponse.status()}`);

    const leadId = (await leadResponse.json()).id as string;

    for (const path of [
      "/crm/leads",
      "/crm/leads/pipeline",
      "/crm/leads/new",
      `/crm/leads/${leadId}`,
      `/crm/leads/${leadId}/edit`,
      "/crm/viewings",
      `/crm/viewings/new?leadId=${leadId}`,
      "/crm/tasks",
      `/crm/tasks/new?leadId=${leadId}`,
    ]) {
      const response = await client.get(path, { maxRedirects: 0 });

      if (response.status() !== 200)
        throw new Error(`Warmup ${path}: ${response.status()}`);
    }
    const viewingDetail = await client.get(`/crm/viewings/${randomUUID()}`);
    // A streamed App Router not-found response can retain HTTP 200.
    if (![200, 404].includes(viewingDetail.status()))
      throw new Error(`Warmup viewing detail: ${viewingDetail.status()}`);
    const taskDetail = await client.get(`/crm/tasks/${randomUUID()}`);
    if (![200, 404].includes(taskDetail.status()))
      throw new Error(`Warmup task detail: ${taskDetail.status()}`);
  } finally {
    if (propertyId) {
      await client.patch(`/api/v1/staff/properties/${propertyId}`, {
        data: { publishingState: "archived" },
      });
      await client.delete(`/api/v1/staff/properties/${propertyId}`);
    }

    await client.dispose();
  }
}
