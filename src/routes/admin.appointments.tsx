import { createFileRoute } from "@tanstack/react-router";
import { CalendarCheck } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionHeader, StatCard, StatusPill } from "@/components/ui-bits";
import { dayLabel, formatDate, nextDays, todayIso } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/appointments")({
  head: () => ({
    meta: [
      { title: "Appointment Calendar — Admin | Fitness Infinity" },
      {
        name: "description",
        content:
          "Gym-wide trainer appointment calendar with confirm, decline and completion controls for staff.",
      },
      { property: "og:title", content: "Appointment Calendar — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Review and manage every trainer appointment booked at Fitness Infinity.",
      },
    ],
  }),
  component: AdminAppointments,
});

function AdminAppointments() {
  const { bookings, setBookingStatus, cancelBooking } = useGym();
  const days = nextDays(14);
  const today = todayIso();
  const [selected, setSelected] = useState(today);

  const forDay = bookings
    .filter((b) => b.date === selected)
    .sort((a, b) => a.slot.localeCompare(b.slot));
  const pending = bookings.filter((b) => b.status === "pending");

  return (
    <>
      <PageHeader
        eyebrow="Scheduling"
        title="Appointment management"
        subtitle="Two-week calendar of every trainer appointment across the gym."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Upcoming bookings"
          value={bookings.filter((b) => b.date >= today && b.status !== "cancelled").length}
          icon={<CalendarCheck className="size-4" />}
        />
        <StatCard label="Awaiting trainer" value={pending.length} hint="Pending requests" accent="warning" />
        <StatCard
          label="Completed"
          value={bookings.filter((b) => b.status === "completed").length}
          hint="Sessions delivered"
          accent="accent"
        />
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Calendar" subtitle="Pick a day to review its appointments" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((d) => {
            const count = bookings.filter((b) => b.date === d && b.status !== "cancelled").length;
            const active = d === selected;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelected(d)}
                className={cn(
                  "rounded-xl border p-3 text-left transition-colors",
                  active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border hover:bg-muted/60",
                )}
              >
                <span className="block text-xs font-semibold">{dayLabel(d)}</span>
                <span className="mt-1 block text-[11px] text-muted-foreground">
                  {count} {count === 1 ? "session" : "sessions"}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title={`Appointments · ${formatDate(selected)}`} />
        {forDay.length === 0 ? (
          <EmptyState
            icon={<CalendarCheck className="size-5" />}
            title="No appointments this day"
            body="Nothing is booked for this date yet. Check pending requests or another day on the calendar."
            action={{ label: "Review Pending Requests", link: { to: "/trainer/appointments", search: { tab: "pending", day: "" } } }}
            secondaryAction={{ label: "View Members", link: { to: "/admin/members", search: { status: "all" } } }}
          />
        ) : (
          <ul className="space-y-3">
            {forDay.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">
                      {b.memberName} → {b.trainerName}
                    </p>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {b.slot} · Goal: {b.goal}
                    {b.note ? ` · ${b.note}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {b.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => setBookingStatus(b.id, "confirmed")}>
                        Confirm
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setBookingStatus(b.id, "declined")}>
                        Decline
                      </Button>
                    </>
                  ) : null}
                  {b.status === "confirmed" ? (
                    <Button size="sm" variant="outline" onClick={() => setBookingStatus(b.id, "completed")}>
                      Mark completed
                    </Button>
                  ) : null}
                  {b.status !== "cancelled" && b.status !== "completed" ? (
                    <Button size="sm" variant="ghost" onClick={() => cancelBooking(b.id)}>
                      Cancel
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
