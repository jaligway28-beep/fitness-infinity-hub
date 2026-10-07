import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth-guard";

export const Route = createFileRoute("/trainer")({
  ssr: false,
  beforeLoad: requireRole("trainer"),
  component: TrainerLayout,
});

function TrainerLayout() {
  return (
    <AppShell role="trainer">
      <Outlet />
    </AppShell>
  );
}
