import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarCheck, Clock, Users, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, SectionHeader, StatCard, StatusPill } from "@/components/ui-bits";
import { dayLabel, nextDays, TIME_SLOTS, todayIso, trainers } from "@/lib/gym-data";
import { useGym, slotsForDate } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trainer/")({
  head: () => ({
    meta: [
      { title: "Trainer Dashboard — Fitness Infinity" },
      {
        name: "description",
        content: "Today's appointments, weekly schedule and assigned members for gym trainers.",
      },
      { property: "og:title", content: "Trainer Dashboard — Fitness Infinity" },
      {
        property: "og:description",
        content: "Manage sessions, accept bookings and track assigned members.",
      },
    ],
  }),
  component: TrainerDashboard,
});

function TrainerDashboard() {
  const { bookings, activeTrainerId, availability, setBookingStatus, notifications } = useGym();
  const trainer = trainers.find((t) => t.id === activeTrainerId)!;
  const today = todayIso();
  const week = nextDays(7);

  const mine = bookings.filter((b) => b.trainerId === activeTrainerId);
  const todays = mine.filter((b) => b.date === today && b.status !== "cancelled");
  const pending = mine.filter((b) => b.status === "pending");
  const assigned = new Set(mine.map((b) => b.memberId)).size;

  const assignedMembers = Array.from(new Set(mine.map((b) => b.memberId))).map((memberId) => {
    const rows = mine.filter((b) => b.memberId === memberId);
    const upcoming = rows
      .filter((b) => b.date >= today && b.status !== "cancelled" && b.status !== "declined")
      .sort((a, b) => (a.date + a.slot).localeCompare(b.date + b.slot))[0];
    return {
      memberId,
      memberName: rows[0]!.memberName,
      goal: rows[0]!.goal,
      sessions: rows.length,
      next: upcoming ? `${dayLabel(upcoming.date)} · ${upcoming.slot}` : "No upcoming session",
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Trainer workspace"
        title={trainer.name}
        subtitle={`${trainer.specialty} · ${trainer.rating} rating · ${trainer.sessions} sessions coached`}
        action={
          <Button asChild>
            <Link to="/trainer/availability">
              <Clock className="size-4" /> Manage availability
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's sessions"
          value={todays.length}
          hint="Confirmed and pending"
          icon={<CalendarCheck className="size-4" />}
          link={{
            to: "/trainer/appointments",
            search: { tab: "all", day: "today" },
            "aria-label": "View today's sessions",
          }}
        />
        <StatCard
          label="Pending requests"
          value={pending.length}
          hint="Waiting for your response"
          icon={<Clock className="size-4" />}
          accent="warning"
          link={{
            to: "/trainer/appointments",
            search: { tab: "pending" },
            "aria-label": "View pending appointment requests",
          }}
        />
        <StatCard
          label="Assigned members"
          value={assigned}
          hint="Across all bookings"
          icon={<Users className="size-4" />}
          accent="accent"
          link={{ to: "/trainer/members", "aria-label": "View my members" }}
        />
        <StatCard
          label="Rating"
          value={trainer.rating}
          hint="Average member feedback"
          icon={<Star className="size-4" />}
          link={{ to: "/trainer", hash: "feedback", "aria-label": "View member feedback" }}
        />
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader
          title="Today's appointments"
          subtitle={dayLabel(today)}
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/trainer/appointments">All appointments</Link>
            </Button>
          }
        />
        {todays.length === 0 ? (
          <EmptyState title="No sessions today" body="Open availability so members can book you." />
        ) : (
          <ul className="space-y-3">
            {todays.map((b) => (
              <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{b.memberName}</p>
                    <StatusPill status={b.status} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {b.slot} · Goal: {b.goal}
                  </p>
                </div>
                <div className="flex gap-2">
                  {b.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => setBookingStatus(b.id, "confirmed")}>
                        Accept
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setBookingStatus(b.id, "declined")}>
                        Decline
                      </Button>
                    </>
                  ) : b.status === "confirmed" ? (
                    <Button size="sm" variant="outline" onClick={() => setBookingStatus(b.id, "completed")}>
                      Mark completed
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Weekly schedule" subtitle="Open slots vs booked sessions" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {week.map((d) => {
            const open = slotsForDate(availability, d);
            const booked = mine.filter((b) => b.date === d && b.status !== "cancelled");
            return (
              <div key={d} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">{dayLabel(d)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {booked.length} booked · {Math.max(0, open.length - booked.length)} open
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {TIME_SLOTS.map((s) => {
                    const isBooked = booked.some((b) => b.slot === s);
                    const isOpen = open.includes(s);
                    return (
                      <span
                        key={s}
                        className={cn(
                          "rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                          isBooked
                            ? "bg-accent/20 text-accent"
                            : isOpen
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground/60",
                        )}
                      >
                        {s.replace(":00", "")}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader
          title="Assigned members"
          subtitle="Members with sessions booked to you"
          action={
            <Button asChild variant="outline" size="sm">
              <Link to="/trainer/members">Full roster</Link>
            </Button>
          }
        />
        {assignedMembers.length === 0 ? (
          <EmptyState title="No members yet" body="Members appear here once they book a session with you." />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {assignedMembers.map((m) => (
              <li key={m.memberId} className="rounded-xl border border-border p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">{m.memberName}</p>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    {m.sessions} {m.sessions === 1 ? "session" : "sessions"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">Goal: {m.goal}</p>
                <p className="text-xs text-muted-foreground">Next: {m.next}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section id="feedback" className="surface-panel space-y-4 scroll-mt-24 p-6">
        <SectionHeader
          title="Member feedback"
          subtitle={`Average ${trainer.rating} from ${trainer.sessions} coached sessions`}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { name: "Jayson Aligway Jr.", stars: 5, note: "Great mobility warm-ups before every lift." },
            { name: "Cathy Bautista", stars: 5, note: "Kept my HIIT sessions tough but doable." },
            { name: "Leo Ramirez", stars: 4, note: "Clear cues on deadlift form." },
          ].map((f) => (
            <div key={f.name} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-1 text-primary">
                {Array.from({ length: f.stars }, (_, i) => (
                  <Star key={i} className="size-3.5 fill-current" />
                ))}
              </div>
              <p className="mt-2 text-sm font-semibold">{f.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{f.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="surface-panel space-y-3 p-6">
        <SectionHeader title="Trainer notifications" />
        <ul className="space-y-3">
          {notifications
            .filter((n) => n.audience === "trainer")
            .map((n) => (
              <li key={n.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{n.title}</p>
                  <span className="text-xs text-muted-foreground">{n.time}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
              </li>
            ))}
        </ul>
      </section>
    </>
  );
}
