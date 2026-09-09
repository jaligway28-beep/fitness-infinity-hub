import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CalendarClock, X } from "lucide-react";
import { useState } from "react";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui-bits";
import { dayLabel, nextDays, TIME_SLOTS, todayIso, type Booking } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

type BookingTab = "upcoming" | "past" | "cancelled";

export const Route = createFileRoute("/member/bookings")({
  validateSearch: zodValidator(
    z.object({ tab: fallback(z.string(), "upcoming").default("upcoming") }),
  ),
  head: () => ({
    meta: [
      { title: "My Bookings — Fitness Infinity" },
      {
        name: "description",
        content: "View, reschedule or cancel your trainer appointments in one place.",
      },
      { property: "og:title", content: "My Bookings — Fitness Infinity" },
      {
        property: "og:description",
        content: "Manage upcoming and past trainer sessions, reschedule or cancel anytime.",
      },
    ],
  }),
  component: BookingsPage,
});

function RescheduleDialog({ booking }: { booking: Booking }) {
  const { rescheduleBooking } = useGym();
  const days = nextDays(7);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(booking.date);
  const [slot, setSlot] = useState(booking.slot);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="size-4" /> Reschedule
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reschedule with {booking.trainerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">New date</p>
            <div className="flex flex-wrap gap-2">
              {days.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-medium",
                    date === d ? "border-primary bg-primary/10 text-primary" : "border-border",
                  )}
                >
                  {dayLabel(d)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">New time</p>
            <div className="grid grid-cols-3 gap-2">
              {TIME_SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={cn(
                    "rounded-lg border px-2 py-2 text-xs font-medium",
                    slot === s ? "border-primary bg-primary/10 text-primary" : "border-border",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => {
              rescheduleBooking(booking.id, date, slot);
              setOpen(false);
            }}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BookingsPage() {
  const { bookings, currentMember, cancelBooking } = useGym();
  const search = Route.useSearch();
  const tab: BookingTab = (["upcoming", "past", "cancelled"] as string[]).includes(search.tab)
    ? (search.tab as BookingTab)
    : "upcoming";
  const navigate = useNavigate();
  const setTab = (next: string) =>
    navigate({ to: "/member/bookings", search: { tab: next }, replace: true });
  const today = todayIso();

  const mine = bookings.filter((b) => b.memberId === currentMember.id);
  const list =
    tab === "upcoming"
      ? mine.filter((b) => b.date >= today && b.status !== "cancelled" && b.status !== "completed")
      : tab === "past"
        ? mine.filter((b) => b.date < today || b.status === "completed")
        : mine.filter((b) => b.status === "cancelled" || b.status === "declined");

  return (
    <>
      <PageHeader
        eyebrow="Appointments"
        title={
          tab === "past"
            ? "Past sessions"
            : tab === "cancelled"
              ? "Cancelled & declined sessions"
              : "Upcoming appointments"
        }
        subtitle="Reschedule or cancel a session — your trainer is notified automatically."
        action={
          <Button asChild>
            <Link to="/member/book">New booking</Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus className="size-5" />}
          title={
            tab === "past" ? "No past sessions" : tab === "cancelled" ? "No cancelled sessions" : "No upcoming sessions"
          }
          body={
            tab === "past"
              ? "Completed sessions will be listed here after you train."
              : tab === "cancelled"
                ? "Sessions you cancel or that a trainer declines will appear here."
                : "Book a session with a trainer and start working toward your fitness goals."
          }
          action={{ label: "Browse Trainers", link: { to: "/member/book", "aria-label": "Browse trainers and book a session" } }}
        />
      ) : (
        <ul className="space-y-3">
          {list
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((b) => (
              <li key={b.id} className="surface-panel p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-base font-semibold">{b.trainerName}</p>
                      <StatusPill status={b.status} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {dayLabel(b.date)} · {b.slot} · Goal: {b.goal}
                    </p>
                    {b.note ? (
                      <p className="mt-2 rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                        “{b.note}”
                      </p>
                    ) : null}
                  </div>
                  {b.status === "pending" || b.status === "confirmed" ? (
                    <div className="flex flex-wrap gap-2">
                      <RescheduleDialog booking={b} />
                      <Button variant="ghost" size="sm" onClick={() => cancelBooking(b.id)}>
                        <X className="size-4" /> Cancel
                      </Button>
                    </div>
                  ) : null}
                </div>
              </li>
            ))}
        </ul>
      )}
    </>
  );
}
