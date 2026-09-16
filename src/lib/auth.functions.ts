import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Role } from "@/lib/gym-data";

const ROLES: Role[] = ["member", "trainer", "admin"];

const normalizeRole = (value: unknown): Role =>
  ROLES.includes(value as Role) ? (value as Role) : "member";

export type AccountInfo = { userId: string; role: Role; fullName: string; email: string };

/**
 * Makes sure the signed-in user has a profile row and exactly one role row,
 * then returns the account context the dashboards need.
 */
export const ensureAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AccountInfo> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userId = context.userId;

    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData.user) throw new Error("Account not found");

    const meta = (userData.user.user_metadata ?? {}) as Record<string, unknown>;
    const email = userData.user.email ?? "";
    const requestedRole = normalizeRole(meta["role"]);
    const metaName = typeof meta["full_name"] === "string" ? (meta["full_name"] as string) : "";

    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    let role: Role = requestedRole;
    if (existingRoles && existingRoles.length > 0) {
      role = normalizeRole(existingRoles[0]!.role);
    } else {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: requestedRole });
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .maybeSingle();

    let fullName = profile?.full_name ?? "";
    if (!profile) {
      fullName = metaName || email.split("@")[0] || "Member";
      await supabaseAdmin.from("profiles").insert({ id: userId, full_name: fullName, email });
    } else if (!fullName && metaName) {
      fullName = metaName;
      await supabaseAdmin.from("profiles").update({ full_name: metaName }).eq("id", userId);
    }

    return { userId, role, fullName: fullName || email, email };
  });
