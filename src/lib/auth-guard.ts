import { redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { ensureAccount } from "@/lib/auth.functions";
import type { Role } from "@/lib/gym-data";

export const homeFor = (role: Role) =>
  role === "member" ? "/member" : role === "trainer" ? "/trainer" : "/admin";

export async function currentRole(): Promise<{ userId: string; role: Role } | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  let { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
  if (!roles || roles.length === 0) {
    // First sign-in: create the profile/role (and any coach application) server-side.
    await ensureAccount().catch(() => null);
    ({ data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id));
  }
  const held = (roles ?? []).map((r) => r.role as Role);
  const role: Role = held.includes("admin") ? "admin" : held.includes("trainer") ? "trainer" : "member";
  return { userId: data.user.id, role };
}

/** Pending or rejected coach applicants go to their status page first. */
export async function landingFor(account: { userId: string; role: Role }) {
  if (account.role !== "member") return homeFor(account.role);
  const { data } = await supabase
    .from("coach_applications")
    .select("status")
    .eq("user_id", account.userId)
    .maybeSingle();
  return data && data.status !== "approved" ? "/coach-status" : "/member";
}

/** Client-side gate for a role workspace: signed in AND holding that role. */
export function requireRole(expected: Role) {
  return async () => {
    const account = await currentRole();
    if (!account) throw redirect({ to: "/login" });
    if (account.role !== expected) {
      if (expected === "trainer" && account.role === "member") throw redirect({ to: "/coach-status" });
      throw redirect({ to: homeFor(account.role) });
    }
    return { userId: account.userId, role: account.role };
  };
}

/** Any signed-in account. */
export async function requireSignedIn() {
  const account = await currentRole();
  if (!account) throw redirect({ to: "/login" });
  return { userId: account.userId, role: account.role };
}
