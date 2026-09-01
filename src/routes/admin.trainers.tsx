import { createFileRoute } from "@tanstack/react-router";
import { Dumbbell, Star } from "lucide-react";

import { PageHeader, SectionHeader, StatCard, StatusPill } from "@/components/ui-bits";
import { dayLabel, nextDays, TIME_SLOTS, todayIso, trainers } from "@/lib/gym-data";
import { useGym, slotsForDate } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/trainers")({
  head: () => ({
    meta: [
      { title: "Trainer Management — Admin | Fitness Infinity" },
      {
        name: "description",
        content:
          "Manage gym trainers, review specialties, ratings and their weekly session schedule overview.",
      },
      { property: "og:title", content: "Trainer Management — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Trainer roster, load per coach and a weekly schedule overview for gym staff.",
      },
    ],
  }),
  component: AdminTrainers,
});

function AdminTrainers() {
  const { bookings, availability } = useGym();
  const today = todayIso();
  const week = nextDays(7);

  const activeSessions = bookings.filter((b) => b.status !== "cancelled" && b.status !== "declined");

  return (
    <>
      <PageHeader
        eyebrow="Staff"
        title="Trainer management"
        subtitle="Coach roster, session load and the gym-wide weekly schedule overview."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Trainers on staff" value={trainers.length} icon={<Dumbbell className="size-4" />} />
        <StatCard
          label="Sessions today"
          value={activeSessions.filter((b) => b.date === today).length}
          hint="Across all coaches"
          accent="accent"
        />
        <StatCard
          label="Average rating"
          value={(trainers.reduce((s, t) => s + t.rating, 0) / trainers.length).toFixed(2)}
          hint="Member feedback"
          icon={<Star className="size-4" />}
        />
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Trainer roster" subtitle="Specialty, rating and current booking load" />
        <div className="grid gap-3 sm:grid-cols-2">
          {trainers.map((t) => {
            const load = activeSessions.filter((b) => b.trainerId === t.id);
            return (
              <div key={t.id} className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-energy font-display text-xs font-bold text-primary-foreground">
                    {t.initials}
                  </span>
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.specialty}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{t.bio}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 font-semibold text-primary">
                    {t.rating} rating
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 font-semibold text-muted-foreground">
                    {t.sessions} coached
                  </span>
                  <span className="rounded-full bg-accent/15 px-2.5 py-0.5 font-semibold text-accent">
                    {load.length} booked
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Weekly schedule overview" subtitle="Booked slots per coach for the next 7 days" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-3 py-3">Trainer</th>
                {week.map((d) => (
                  <th key={d} className="px-3 py-3">
                    {dayLabel(d)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trainers.map((t) => (
                <tr key={t.id} className="border-t border-border">
                  <td className="px-3 py-3.5 font-medium">{t.name}</td>
                  {week.map((d) => {
                    const booked = activeSessions.filter((b) => b.trainerId === t.id && b.date === d);
                    const open = t.id === "t1" ? slotsForDate(availability, d) : TIME_SLOTS;
                    return (
                      <td key={d} className="px-3 py-3.5">
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-xs font-semibold",
                            booked.length > 0
                              ? "bg-primary/15 text-primary"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {booked.length}/{open.length}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Latest trainer bookings" />
        <ul className="divide-y divide-border">
          {bookings.slice(0, 8).map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-sm font-semibold">{b.trainerName}</p>
                <p className="text-xs text-muted-foreground">
                  {b.memberName} · {dayLabel(b.date)} · {b.slot}
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
