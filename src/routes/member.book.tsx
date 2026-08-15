import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionHeader } from "@/components/ui-bits";
import {
  FITNESS_GOALS,
  TIME_SLOTS,
  dayLabel,
  nextDays,
  trainers,
} from "@/lib/gym-data";
import { useGym, slotsForDate } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/member/book")({
  head: () => ({
    meta: [
      { title: "Book a Trainer — Fitness Infinity" },
      {
        name: "description",
        content:
          "Choose a trainer, date, available time slot and fitness goal to book your next session.",
      },
      { property: "og:title", content: "Book a Trainer — Fitness Infinity" },
      {
        property: "og:description",
        content: "Online trainer appointment booking with live availability and instant confirmation.",
      },
    ],
  }),
  component: BookPage,
});

function BookPage() {
  const { createBooking, bookings, availability } = useGym();
  const navigate = useNavigate();
  const days = nextDays(7);

  const [trainerId, setTrainerId] = useState(trainers[0]!.id);
  const [date, setDate] = useState(days[0]!);
  const [slot, setSlot] = useState<string | null>(null);
  const [goal, setGoal] = useState(FITNESS_GOALS[0]!);
  const [note, setNote] = useState("");

  const openSlots = slotsForDate(availability, date);
  const takenSlots = bookings
    .filter((b) => b.trainerId === trainerId && b.date === date && b.status !== "cancelled")
    .map((b) => b.slot);

  const submit = () => {
    if (!slot) return;
    createBooking({ trainerId, date, slot, goal, note: note.trim() || undefined });
    navigate({ to: "/member/bookings" });
  };

  return (
    <>
      <PageHeader
        eyebrow="Online booking"
        title="Book a trainer appointment"
        subtitle="Four steps: pick a coach, a day, an open slot and your goal for the session."
      />

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="1. Choose your trainer" />
        <div className="grid gap-3 sm:grid-cols-2">
          {trainers.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTrainerId(t.id);
                setSlot(null);
              }}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                trainerId === t.id
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/40",
              )}
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-energy font-display text-sm font-bold text-primary-foreground">
                {t.initials}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{t.name}</span>
                <span className="block text-xs text-muted-foreground">{t.specialty}</span>
                <span className="mt-1 flex items-center gap-1 text-xs text-primary">
                  <Star className="size-3 fill-current" /> {t.rating} · {t.sessions} sessions
                </span>
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="2. Pick a date" subtitle="Next 7 days" />
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDate(d);
                setSlot(null);
              }}
              className={cn(
                "rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                date === d ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40",
              )}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="3. Available time slots" subtitle="Booked slots are disabled" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {TIME_SLOTS.map((s) => {
            const disabled = !openSlots.includes(s) || takenSlots.includes(s);
            return (
              <button
                key={s}
                type="button"
                disabled={disabled}
                onClick={() => setSlot(s)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                  disabled && "cursor-not-allowed border-border/60 text-muted-foreground/50 line-through",
                  !disabled && slot === s && "border-primary bg-primary/10 text-primary",
                  !disabled && slot !== s && "border-border hover:border-primary/40",
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="4. Your goal for this session" />
        <div className="flex flex-wrap gap-2">
          {FITNESS_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGoal(g)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                goal === g ? "border-accent bg-accent/15 text-accent" : "border-border hover:border-accent/40",
              )}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note for your trainer (optional)</Label>
          <Textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything your coach should know — injuries, focus areas, equipment…"
          />
        </div>
      </section>

      <div className="surface-panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-sm font-semibold">
            {trainers.find((t) => t.id === trainerId)?.name} · {dayLabel(date)} ·{" "}
            {slot ?? "select a slot"}
          </p>
          <p className="text-xs text-muted-foreground">Goal: {goal}</p>
        </div>
        <Button size="lg" disabled={!slot} onClick={submit}>
          <CalendarClock className="size-4" /> Confirm booking
        </Button>
      </div>
    </>
  );
}
