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
