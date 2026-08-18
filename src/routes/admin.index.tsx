import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, QrCode, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { PageHeader, SectionHeader, StatCard, StatusPill } from "@/components/ui-bits";
import { attendanceTrend, dayLabel } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Overview — Fitness Infinity" },
      {
        name: "description",
        content:
          "Gym-wide overview of memberships, QR attendance trends and trainer appointment activity.",
      },
      { property: "og:title", content: "Admin Overview — Fitness Infinity" },
      {
        property: "og:description",
        content: "Monitor attendance, memberships and bookings across the whole gym.",
      },
    ],
  }),
  component: AdminOverview,
});

function AdminOverview() {
  const { members, bookings, attendance } = useGym();
  const today = new Date().toISOString().slice(0, 10);
  const activeMembers = members.filter((m) => m.planStatus === "active").length;
  const expiring = members.filter((m) => m.planStatus !== "active").length;

  return (
    <>
      <div className="surface-panel flex items-center gap-4 p-5">
        <Logo size={56} />
        <div>
          <p className="font-display text-base font-semibold">Fitness Infinity</p>
          <p className="text-xs text-muted-foreground">Gym staff & administration console</p>
        </div>
      </div>

      <PageHeader
        eyebrow="Administration"
        title="Gym overview"
        subtitle="Attendance, membership health and booking activity across Fitness Infinity."
      />


      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active members" value={activeMembers} hint={`${members.length} total accounts`} icon={<Users className="size-4" />} />
        <StatCard label="Needs renewal" value={expiring} hint="Expiring or expired plans" icon={<TrendingUp className="size-4" />} accent="warning" />
        <StatCard label="Check-ins today" value={attendance.filter((a) => a.date === today).length} hint="Logged via QR scanner" icon={<QrCode className="size-4" />} accent="accent" />
        <StatCard label="Sessions today" value={bookings.filter((b) => b.date === today && b.status !== "cancelled").length} hint="Across all trainers" icon={<CalendarCheck className="size-4" />} />
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Weekly QR attendance" subtitle="Gym entries per day" />
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={attendanceTrend}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--popover-foreground)",
                }}
              />
              <Bar dataKey="checkins" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Latest bookings" subtitle="Most recent trainer appointments" />
        <ul className="divide-y divide-border">
          {bookings.slice(0, 6).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-sm font-semibold">
                  {b.memberName} → {b.trainerName}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dayLabel(b.date)} · {b.slot} · {b.goal}
                </p>
              </div>
              <StatusPill status={b.status} />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
