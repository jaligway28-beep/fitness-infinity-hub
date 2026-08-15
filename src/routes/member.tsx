import { createFileRoute, Outlet } from "@tanstack/react-router";

import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/member")({
  component: MemberLayout,
});

function MemberLayout() {
  return (
    <AppShell role="member">
      <Outlet />
    </AppShell>
  );
}
