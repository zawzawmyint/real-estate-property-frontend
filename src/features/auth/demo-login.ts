import { staffRoles, type StaffRole } from "@/lib/auth/roles";

export type DemoLoginConfig = {
  password: string;
  accounts: { role: StaffRole; label: string; email: string }[];
};

export function getDemoLoginConfig(env: {
  NODE_ENV?: string;
  DEMO_STAFF_PASSWORD?: string;
}): DemoLoginConfig | undefined {
  const password = env.DEMO_STAFF_PASSWORD;

  if (
    env.NODE_ENV !== "development" ||
    !password ||
    password.length < 12 ||
    password.length > 128
  )
    return undefined;

  return {
    password,
    accounts: staffRoles.map((role) => ({
      role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
      email: `demo.${role}@example.com`,
    })),
  };
}
