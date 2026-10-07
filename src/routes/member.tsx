import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth-guard";

export const Route = createFileRoute("/member")({
  ssr: false,
  beforeLoad: requireRole("member"),
  component: MemberLayout,
});

function MemberLayout() {
  return (
    <AppShell role="member">
      <Outlet />
    </AppShell>
  );
}
