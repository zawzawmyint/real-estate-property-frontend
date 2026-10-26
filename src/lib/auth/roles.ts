export const staffRoles = ["admin", "manager", "agent"] as const;

export type StaffRole = (typeof staffRoles)[number];

export function isStaffRole(value: unknown): value is StaffRole {
  return staffRoles.some((role) => role === value);
}
