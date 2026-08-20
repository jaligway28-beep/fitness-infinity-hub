import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, TrendingUp, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, SectionHeader, StatCard } from "@/components/ui-bits";
import { attendanceTrend, trainers } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Admin | Fitness Infinity" },
      {
        name: "description",
        content:
          "Attendance trends, active membership mix and trainer booking reports for Fitness Infinity staff.",
      },
      { property: "og:title", content: "Reports — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Simple charts summarising attendance, memberships and trainer bookings.",
      },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const { members, bookings, attendance, plans } = useGym();

  const planMix = plans.map((p, i) => ({
    name: p.name,
    value: members.filter((m) => m.plan === p.name).length,
    fill: `var(--chart-${i + 1})`,
  }));

  const trainerLoad = trainers.map((t) => ({
    name: t.name.replace("Coach ", ""),
    bookings: bookings.filter((b) => b.trainerId === t.id && b.status !== "cancelled").length,
  }));

  const attendanceRate = Math.round(
    (attendance.filter((a) => a.method === "QR Scan").length / Math.max(1, attendance.length)) * 100,
  );

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    color: "var(--popover-foreground)",
  };

  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Reports"
        subtitle="Attendance trends, membership mix and trainer booking volume."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Weekly check-ins"
          value={attendanceTrend.reduce((s, d) => s + d.checkins, 0)}
          hint="Gym entries this week"
          icon={<BarChart3 className="size-4" />}
        />
        <StatCard
          label="Active memberships"
          value={members.filter((m) => m.planStatus === "active").length}
          hint={`${members.length} total records`}
          icon={<Users className="size-4" />}
          accent="accent"
        />
        <StatCard
          label="QR entry rate"
          value={`${attendanceRate}%`}
          hint="Contactless vs front desk"
          icon={<TrendingUp className="size-4" />}
          accent="warning"
        />
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Attendance trend" subtitle="Daily QR gym entries" />
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceTrend}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="checkins"
                stroke="var(--chart-1)"
                strokeWidth={3}
                dot={{ r: 4, fill: "var(--chart-1)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Active membership mix" subtitle="Members per plan tier" />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planMix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90}>
                  {planMix.map((slice) => (
                    <Cell key={slice.name} fill={slice.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="grid gap-2 text-sm">
            {planMix.map((slice) => (
              <li key={slice.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2.5 rounded-full" style={{ background: slice.fill }} />
                  {slice.name}
                </span>
                <span className="font-semibold">{slice.value}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Trainer bookings" subtitle="Sessions booked per coach" />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trainerLoad}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="bookings" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </>
  );
}
