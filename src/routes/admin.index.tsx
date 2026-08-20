import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck, QrCode, TrendingUp, Users } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from "recharts";

import { Logo } from "@/components/Logo";
import { PageHeader, SectionHeader, StatCard, StatusPill } from "@/components/ui-bits";
import { attendanceTrend, dayLabel, formatDate } from "@/lib/gym-data";
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
  const { members, bookings, attendance, notifications } = useGym();
  const today = new Date().toISOString().slice(0, 10);
  const activeMembers = members.filter((m) => m.planStatus === "active").length;
  const expiring = members.filter((m) => m.planStatus !== "active").length;
  const checkinsToday = attendance.filter((a) => a.date === today && a.kind === "check-in").length;
  const upcoming = bookings
    .filter((b) => b.date >= today && b.status !== "cancelled" && b.status !== "declined")
    .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot));
  const expiringMembers = members
    .filter((m) => m.planStatus !== "active")
    .sort((a, b) => a.expiresOn.localeCompare(b.expiresOn));
  const activity = [
    ...attendance.slice(0, 5).map((a) => ({
      id: `a-${a.id}`,
      title: `${a.memberName} ${a.kind === "check-out" ? "checked out" : "checked in"}`,
      detail: `${dayLabel(a.date)} · ${a.time} · ${a.method}`,
    })),
    ...bookings.slice(0, 5).map((b) => ({
      id: `b-${b.id}`,
      title: `${b.memberName} booked ${b.trainerName}`,
      detail: `${dayLabel(b.date)} · ${b.slot} · ${b.status}`,
    })),
    ...notifications.slice(0, 4).map((n) => ({
      id: `n-${n.id}`,
      title: n.title,
      detail: `${n.time} · ${n.audience}`,
    })),
  ].slice(0, 10);


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
        <StatCard label="QR check-ins today" value={checkinsToday} hint="Logged via QR scanner" icon={<QrCode className="size-4" />} accent="accent" />
        <StatCard label="Upcoming bookings" value={upcoming.length} hint="Today and beyond" icon={<CalendarCheck className="size-4" />} />
        <StatCard label="Expiring memberships" value={expiring} hint="Expiring or expired plans" icon={<TrendingUp className="size-4" />} accent="warning" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Upcoming bookings" subtitle="Next trainer appointments" />
          <ul className="divide-y divide-border">
            {upcoming.slice(0, 5).map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="text-sm font-semibold">
                    {b.memberName} → {b.trainerName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {dayLabel(b.date)} · {b.slot}
                  </p>
                </div>
                <StatusPill status={b.status} />
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Expiring memberships" subtitle="Renewal reminders queued" />
          <ul className="divide-y divide-border">
            {expiringMembers.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.plan} · expires {formatDate(m.expiresOn)}
                  </p>
                </div>
                <span className="rounded-full bg-warning/15 px-2.5 py-0.5 text-xs font-semibold capitalize text-warning">
                  {m.planStatus}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Recent activity" subtitle="Scans, bookings and automated notifications" />
        <ul className="divide-y divide-border">
          {activity.map((a) => (
            <li key={a.id} className="py-3">
              <p className="text-sm font-semibold">{a.title}</p>
              <p className="text-xs text-muted-foreground">{a.detail}</p>
            </li>
          ))}
        </ul>
      </section>

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
