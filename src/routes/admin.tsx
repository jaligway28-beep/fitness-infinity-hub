import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth-guard";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: requireRole("admin"),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <AppShell role="admin">
      <Outlet />
    </AppShell>
  );
}
