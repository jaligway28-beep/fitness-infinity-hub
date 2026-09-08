import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogIn, LogOut, QrCode, ScanLine, ShieldAlert } from "lucide-react";
import { useState } from "react";

import { QrPass } from "@/components/QrPass";
import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader, StatCard } from "@/components/ui-bits";
import { dayLabel, formatDate, planStatusFor, todayIso } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/attendance")({
  validateSearch: (search: Record<string, unknown>) => ({
    scope: search.scope === "today" ? ("today" as const) : ("all" as const),
  }),
  head: () => ({
    meta: [
      { title: "QR Attendance Log — Admin | Fitness Infinity" },
      {
        name: "description",
        content:
          "Simulate scanning a Fitness Infinity member QR pass and audit every check-in and check-out time.",
      },
      { property: "og:title", content: "QR Attendance Log — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Front-desk QR scanner simulation with a full check-in / check-out attendance log.",
      },
    ],
  }),
  component: AdminAttendance,
});

function AdminAttendance() {
  const { attendance, members, staffScan, lastScanResult } = useGym();
  const today = todayIso();
  const { scope } = Route.useSearch();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(members[0]!.id);

  const member = members.find((m) => m.id === selected)!;
  const todaysRows = attendance.filter((a) => a.date === today);
  const checkedIn = todaysRows.some((a) => a.memberId === member.id && a.kind === "check-in");
  const checkedOut = todaysRows.some((a) => a.memberId === member.id && a.kind === "check-out");
  const status = planStatusFor(member.expiresOn);
  const expired = status === "expired";
  const blocked = expired || (checkedIn && checkedOut);
  const blockedReason = expired
    ? `Membership expired on ${formatDate(member.expiresOn)} — renewal required before entry.`
    : "Visit already completed today — one check-in and check-out per day.";
  const nextAction = checkedIn && !checkedOut ? "check-out" : "check-in";


  return (
    <>
      <PageHeader
        eyebrow="Attendance"
        title={scope === "today" ? `QR check-ins — ${dayLabel(today)}` : "QR attendance scanner"}
        subtitle={
          scope === "today"
            ? "Entry log filtered to today's check-ins and check-outs."
            : "Simulate a front-desk scan of a member's Fitness Infinity QR pass to record entry and exit."
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total entries" value={attendance.length} icon={<QrCode className="size-4" />} />
        <StatCard
          label="Check-ins today"
          value={todaysRows.filter((a) => a.kind === "check-in").length}
          hint="Members currently logged"
          accent="accent"
        />
        <StatCard
          label="Check-outs today"
          value={todaysRows.filter((a) => a.kind === "check-out").length}
          hint="Completed visits"
          accent="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Scanner" subtitle="Point the reader at the member pass" />
          <div className="flex justify-center">
            <QrPass value={`FI-${member.id}-${today}`} size={220} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Member pass
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    m.id === selected
                      ? "border-primary bg-primary/15 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-border p-4 text-sm">
            <p className="font-semibold">{member.name}</p>
            <p className="text-xs text-muted-foreground">
              {member.plan} · {status} · expires {formatDate(member.expiresOn)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {checkedOut
                ? "Visit completed today"
                : checkedIn
                  ? "Currently inside the gym"
                  : "Not checked in today"}
            </p>
          </div>

          {blocked ? (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <span>
                <span className="font-semibold">Scan will be rejected · </span>
                {blockedReason}
              </span>
            </div>
          ) : null}

          <Button className="w-full" onClick={() => staffScan(member.id)}>
            <ScanLine className="size-4" /> Simulate scan · record {nextAction}
          </Button>

          {lastScanResult ? (
            <div
              className={cn(
                "rounded-xl border p-3 text-xs",
                lastScanResult.ok
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-destructive/40 bg-destructive/10 text-destructive",
              )}
            >
              <p className="font-semibold">
                {lastScanResult.ok
                  ? `Accepted · ${lastScanResult.kind} for ${lastScanResult.memberName} at ${lastScanResult.time}`
                  : `Rejected · ${lastScanResult.reason}`}
              </p>
              {!lastScanResult.ok ? <p className="mt-1 opacity-90">{lastScanResult.detail}</p> : null}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Validation rules: expired memberships are refused, repeat scans within 60 seconds are
              blocked as duplicates, and only one check-in / check-out pair is allowed per day.
            </p>
          )}
        </section>


        <section className="surface-panel space-y-4 p-6">
          <SectionHeader
            title={scope === "today" ? `Entry log — ${dayLabel(today)}` : "Entry log"}
            subtitle={
              scope === "today"
                ? "Showing today only"
                : "Every check-in and check-out recorded"
            }
            action={
              <Button
                variant={scope === "today" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  navigate({
                    to: "/admin/attendance",
                    search: { scope: scope === "today" ? "all" : "today" },
                    replace: true,
                  })
                }
              >
                {scope === "today" ? "Show all entries" : "Show today only"}
              </Button>
            }
          />
          <ul className="divide-y divide-border">
            {(scope === "today" ? todaysRows : attendance).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "grid size-9 place-items-center rounded-xl border border-border",
                      a.kind === "check-in" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent",
                    )}
                  >
                    {a.kind === "check-in" ? <LogIn className="size-4" /> : <LogOut className="size-4" />}
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{a.memberName}</p>
                    <p className="text-xs text-muted-foreground">
                      {dayLabel(a.date)} · {a.method} · {a.kind}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{a.time}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
