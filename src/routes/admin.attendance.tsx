import { createFileRoute } from "@tanstack/react-router";
import { QrCode } from "lucide-react";

import { PageHeader, SectionHeader, StatCard } from "@/components/ui-bits";
import { dayLabel } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/admin/attendance")({
  head: () => ({
    meta: [
      { title: "QR Attendance Log — Admin | Fitness Infinity" },
      {
        name: "description",
        content: "Complete QR code attendance log of gym entries with time stamps and entry method.",
      },
      { property: "og:title", content: "QR Attendance Log — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Audit every gym entry recorded by the QR scanner or front desk.",
      },
    ],
  }),
  component: AdminAttendance,
});

function AdminAttendance() {
  const { attendance } = useGym();
  const today = new Date().toISOString().slice(0, 10);
  const scans = attendance.filter((a) => a.method === "QR Scan").length;

  return (
    <>
      <PageHeader
        eyebrow="Attendance"
        title="QR attendance log"
        subtitle="Every entry recorded by the turnstile scanner or front desk."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total entries" value={attendance.length} icon={<QrCode className="size-4" />} />
        <StatCard label="QR scans" value={scans} hint="Contactless entries" accent="accent" />
        <StatCard label="Today" value={attendance.filter((a) => a.date === today).length} hint="Check-ins so far" />
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Entry log" />
        <ul className="divide-y divide-border">
          {attendance.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-sm font-semibold">{a.memberName}</p>
                <p className="text-xs text-muted-foreground">
                  {dayLabel(a.date)} · {a.method}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{a.time}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
