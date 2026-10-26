import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getStaffSessionFromBackend } from "@/lib/api/server";

// React cache deduplicates within a render request; it does not share identities.
export const getStaffSession = cache(async () => {
  const cookieStore = await cookies();

  return getStaffSessionFromBackend(cookieStore.getAll());
});

export async function requireStaffSession() {
  const staff = await getStaffSession();

  if (!staff) redirect("/login");

  return staff;
}
