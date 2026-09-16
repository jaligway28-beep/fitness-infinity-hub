import { redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/gym-data";

export const homeFor = (role: Role) =>
  role === "member" ? "/member" : role === "trainer" ? "/trainer" : "/admin";

export async function currentRole(): Promise<{ userId: string; role: Role } | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .limit(1);
  const role = (roles?.[0]?.role as Role | undefined) ?? "member";
  return { userId: data.user.id, role };
}

/** Client-side gate for a role workspace: signed in AND holding that role. */
export function requireRole(expected: Role) {
  return async () => {
    const account = await currentRole();
    if (!account) throw redirect({ to: "/login" });
    if (account.role !== expected) throw redirect({ to: homeFor(account.role) });
    return { userId: account.userId, role: account.role };
  };
}
