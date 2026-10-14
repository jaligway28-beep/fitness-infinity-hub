import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Role } from "@/lib/gym-data";

const ROLES: Role[] = ["member", "trainer", "admin"];

const normalizeRole = (value: unknown): Role =>
  ROLES.includes(value as Role) ? (value as Role) : "member";

export type AccountInfo = { userId: string; role: Role; fullName: string; email: string };

/**
 * Makes sure the signed-in user has a profile row and a role row, then returns
 * the account context. New accounts always start as members — sign-up can never
 * grant coach or admin. Coach applicants get a pending application for admin review.
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
    const metaName = typeof meta["full_name"] === "string" ? (meta["full_name"] as string) : "";

    const { data: existingRoles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    let role: Role = "member";
    if (existingRoles && existingRoles.length > 0) {
      const held = existingRoles.map((r) => normalizeRole(r.role));
      role = held.includes("admin") ? "admin" : held.includes("trainer") ? "trainer" : "member";
    } else {
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "member" });
      if (meta["coach_application"] === true || meta["role"] === "trainer") {
        const { data: existingApp } = await supabaseAdmin
          .from("coach_applications")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();
        if (!existingApp) {
          const years = Number(meta["experience_years"] ?? 0);
          await supabaseAdmin.from("coach_applications").insert({
            user_id: userId,
            full_name: metaName || email,
            email,
            specialization: String(meta["specialization"] ?? "").slice(0, 200),
            experience_years: Number.isFinite(years) ? Math.max(0, Math.min(60, Math.round(years))) : 0,
            bio: String(meta["bio"] ?? "").slice(0, 2000),
          });
        }
      }
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
