"use client";

import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { staffRoles } from "@/lib/auth/roles";

export const authClient = createAuthClient({
  basePath: "/api/v1/auth",
  fetchOptions: { credentials: "same-origin" },
  sessionOptions: {
    refetchInterval: 0,
    refetchOnWindowFocus: true,
    refetchWhenOffline: false,
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: {
          type: [...staffRoles],
          required: true,
          input: false,
        },
      },
    }),
  ],
});
