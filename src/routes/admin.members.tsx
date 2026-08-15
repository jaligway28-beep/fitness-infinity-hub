import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui-bits";
import { formatDate } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/members")({
  head: () => ({
    meta: [
      { title: "Members Directory — Admin | Fitness Infinity" },
      {
        name: "description",
        content: "Search the member directory with plan status, expiry dates and fitness goals.",
      },
      { property: "og:title", content: "Members Directory — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Membership records, plan status and renewal dates for gym staff.",
      },
    ],
  }),
  component: AdminMembers,
});

const statusClass = {
  active: "bg-primary/15 text-primary border-primary/30",
  expiring: "bg-warning/15 text-warning border-warning/30",
  expired: "bg-destructive/15 text-destructive border-destructive/30",
} as const;

function AdminMembers() {
  const { members } = useGym();
  const [q, setQ] = useState("");
  const list = members.filter((m) =>
    `${m.name} ${m.email} ${m.plan} ${m.goal}`.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Members"
        subtitle="All membership records with plan status and renewal dates."
      />

      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, email, plan or goal…"
        className="sm:max-w-sm"
      />

      <div className="surface-panel overflow-x-auto p-2">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => (
              <tr key={m.id} className="border-t border-border">
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 place-items-center rounded-xl bg-energy font-display text-xs font-bold text-primary-foreground">
                      {m.initials}
                    </span>
                    <div>
                      <p className="font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{m.plan}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{m.goal}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{formatDate(m.expiresOn)}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
                      statusClass[m.planStatus],
                    )}
                  >
                    {m.planStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
