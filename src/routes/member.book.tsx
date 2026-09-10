import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { CalendarClock, CheckCircle2, Clock, Star } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionHeader } from "@/components/ui-bits";
import {
  FITNESS_GOALS,
  TIME_SLOTS,
  dayLabel,
  formatDate,
  nextDays,
  planStatusFor,
  trainers,
} from "@/lib/gym-data";
import { useGym, slotsForDate } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

const SESSION_MINUTES = 60;

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
  const { createBooking, bookings, availability, currentMember } = useGym();
  const navigate = useNavigate();
  const days = nextDays(7);

  const [trainerId, setTrainerId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [goal, setGoal] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const trainer = trainers.find((t) => t.id === trainerId) ?? null;
  const planStatus = planStatusFor(currentMember.expiresOn);

  const takenFor = (tid: string, day: string) =>
    bookings
      .filter((b) => b.trainerId === tid && b.date === day && b.status !== "cancelled" && b.status !== "declined")
      .map((b) => b.slot);

  const openFor = (day: string) => slotsForDate(availability, day);

  const freeSlots = (tid: string, day: string) => {
    const taken = takenFor(tid, day);
    return openFor(day).filter((s) => !taken.includes(s));
  };

  const slotsForSelection = trainerId && date ? freeSlots(trainerId, date) : [];
  const complete = Boolean(trainerId && date && slot && goal);

  const reset = () => {
    setSlot(null);
    setReviewing(false);
  };

  const confirm = () => {
    if (!trainerId || !date || !slot || !goal) return;
    createBooking({ trainerId, date, slot, goal, ...(note.trim() ? { note: note.trim() } : {}) });
    setReviewing(false);
    navigate({ to: "/member/bookings", search: { tab: "upcoming" } });
  };

  return (
    <>
      <PageHeader
        eyebrow="Online booking"
        title="Book a trainer appointment"
        subtitle="Four steps: pick a coach, a day, an open slot and your goal for the session."
      />

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader
          title="1. Select a trainer"
          subtitle={trainer ? trainer.name : "No trainer selected yet"}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {trainers.map((t) => {
            const todayFree = freeSlots(t.id, days[0]!);
            const selected = trainerId === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setTrainerId(t.id);
                  reset();
                }}
                className={cn(
                  "flex flex-col gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  selected ? "border-primary bg-primary/10" : "border-border hover:border-primary/40",
                )}
              >
                <span className="flex items-start gap-3">
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
                  {selected ? <CheckCircle2 className="ml-auto size-5 shrink-0 text-primary" /> : null}
                </span>
                <span className="block text-xs leading-relaxed text-muted-foreground">{t.bio}</span>
                <span className="flex flex-wrap items-center gap-2 border-t border-border pt-3 text-xs">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold",
                      todayFree.length > 0
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Clock className="size-3" />
                    {todayFree.length > 0 ? `${todayFree.length} slots open today` : "Fully booked today"}
                  </span>
                  {todayFree.slice(0, 3).map((s) => (
                    <span key={s} className="text-muted-foreground">
                      {s}
                    </span>
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader
          title="2. Select a date"
          subtitle={date ? dayLabel(date) : "No date selected yet"}
        />
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={date === d}
              onClick={() => {
                setDate(d);
                reset();
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
        <SectionHeader
          title="3. Select an available time slot"
          subtitle={
            !trainerId
              ? "Select a trainer first"
              : !date
                ? "Select a date first"
                : `${slotsForSelection.length} of ${TIME_SLOTS.length} slots available`
          }
        />
        {!trainerId || !date ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {trainerId
              ? "Pick a date above to load this coach's open times."
              : "Pick a trainer above to load their live schedule."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
            {TIME_SLOTS.map((s) => {
              const disabled = !slotsForSelection.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  disabled={disabled}
                  aria-pressed={slot === s}
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
        )}
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader
          title="4. Select your fitness goal"
          subtitle={goal ?? "No goal selected yet"}
        />
        <div className="flex flex-wrap gap-2">
          {FITNESS_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              aria-pressed={goal === g}
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
        {!goal ? (
          <button
            type="button"
            onClick={() => setGoal(currentMember.goal)}
            className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
          >
            Use my saved goal ({currentMember.goal})
          </button>
        ) : null}
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
        <div className="space-y-1 text-sm">
          <p className="font-semibold">{trainer?.name ?? "Select a trainer"}</p>
          <p className="text-muted-foreground">
            {date ? dayLabel(date) : "Select a date"} · {slot ?? "Select an available time slot"}
          </p>
          <p className="text-xs text-muted-foreground">{goal ?? "Select your fitness goal"}</p>
        </div>
        <Button size="lg" disabled={!complete} onClick={() => setReviewing(true)}>
          <CalendarClock className="size-4" /> {complete ? "Confirm Booking" : "Book Session"}
        </Button>
      </div>

      <Dialog open={reviewing} onOpenChange={setReviewing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review your booking</DialogTitle>
          </DialogHeader>
          <dl className="space-y-2 text-sm">
            <Row label="Trainer" value={trainer?.name ?? "—"} />
            <Row label="Fitness goal" value={goal ?? "—"} />
            <Row label="Date" value={date ? `${dayLabel(date)} · ${formatDate(date)}` : "—"} />
            <Row label="Time" value={slot ?? "—"} />
            <Row label="Session duration" value={`${SESSION_MINUTES} minutes`} />
            <Row
              label="Membership"
              value={`${currentMember.plan} · ${planStatus} until ${formatDate(currentMember.expiresOn)}`}
            />
          </dl>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewing(false)}>
              Back to Edit
            </Button>
            <Button onClick={confirm}>
              <CheckCircle2 className="size-4" /> Confirm Booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
