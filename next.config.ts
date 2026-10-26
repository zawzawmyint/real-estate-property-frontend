import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseApiOrigin } from "./src/lib/env";

const apiOrigin = parseApiOrigin(process.env.API_URL);
const nextConfig: NextConfig = {
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
  poweredByHeader: false,
  ...(process.env.E2E_TEST_RUN === "1"
    ? { devIndicators: false as const }
    : {}),
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiOrigin}/api/v1/:path*` },
    ];
  },
};
export default nextConfig;
