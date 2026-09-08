import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui-bits";
import { formatDate } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/members")({
  validateSearch: zodValidator(
    z.object({ status: fallback(z.string(), "all").default("all") }),
  ),
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

const filters = ["all", "active", "expiring", "expired"] as const;
type MemberFilter = (typeof filters)[number];

const headings: Record<MemberFilter, { title: string; subtitle: string }> = {
  all: { title: "Members", subtitle: "All membership records with plan status and renewal dates." },
  active: { title: "Active members", subtitle: "Memberships currently valid for gym entry." },
  expiring: {
    title: "Memberships expiring soon",
    subtitle: "Renewal reminders are queued for these members.",
  },
  expired: {
    title: "Expired memberships",
    subtitle: "Entry is blocked at the scanner until these plans are renewed.",
  },
};

function AdminMembers() {
  const { members } = useGym();
  const search = Route.useSearch();
  const status: MemberFilter = (filters as readonly string[]).includes(search.status)
    ? (search.status as MemberFilter)
    : "all";
  const navigate = useNavigate();
  const setStatus = (next: MemberFilter) =>
    navigate({ to: "/admin/members", search: { status: next }, replace: true });
  const [q, setQ] = useState("");
  const list = members
    .filter((m) => status === "all" || m.planStatus === status)
    .filter((m) =>
      `${m.name} ${m.email} ${m.plan} ${m.goal}`.toLowerCase().includes(q.toLowerCase()),
    );

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title={headings[status].title}
        subtitle={headings[status].subtitle}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, email, plan or goal…"
          className="sm:max-w-sm"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setStatus(f)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold capitalize transition-colors",
                status === f
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {f}
              <span className="ml-1.5 text-muted-foreground">
                {f === "all" ? members.length : members.filter((m) => m.planStatus === f).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {list.length} of {members.length} members
      </p>

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
