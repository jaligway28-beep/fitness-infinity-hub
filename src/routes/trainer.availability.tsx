import { createFileRoute } from "@tanstack/react-router";
import { Check, X } from "lucide-react";

import { PageHeader, SectionHeader } from "@/components/ui-bits";
import { TIME_SLOTS, dayLabel, nextDays } from "@/lib/gym-data";
import { useGym, slotsForDate } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trainer/availability")({
  head: () => ({
    meta: [
      { title: "Manage Availability — Trainer | Fitness Infinity" },
      {
        name: "description",
        content: "Open or close your coaching time slots for the next seven days.",
      },
      { property: "og:title", content: "Manage Availability — Trainer | Fitness Infinity" },
      {
        property: "og:description",
        content: "Control which time slots members can book across the week.",
      },
    ],
  }),
  component: AvailabilityPage,
});

function AvailabilityPage() {
  const { availability, toggleSlot, bookings, activeTrainerId } = useGym();
  const days = nextDays(7);

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Manage availability & time slots"
        subtitle="Tap a slot to open or close it. Booked slots stay locked."
      />

      <div className="space-y-4">
        {days.map((d) => {
          const open = slotsForDate(availability, d);
          const booked = bookings
            .filter((b) => b.trainerId === activeTrainerId && b.date === d && b.status !== "cancelled")
            .map((b) => b.slot);
          return (
            <section key={d} className="surface-panel space-y-4 p-5">
              <SectionHeader
                title={dayLabel(d)}
                subtitle={`${open.length} slots open · ${booked.length} booked`}
              />
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {TIME_SLOTS.map((s) => {
                  const isBooked = booked.includes(s);
                  const isOpen = open.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      disabled={isBooked}
                      onClick={() => toggleSlot(d, s)}
                      className={cn(
                        "flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                        isBooked
                          ? "cursor-not-allowed border-accent/40 bg-accent/15 text-accent"
                          : isOpen
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40",
                      )}
                    >
                      {s}
                      {isBooked ? (
                        <span className="text-[10px] font-bold uppercase">Booked</span>
                      ) : isOpen ? (
                        <Check className="size-4" />
                      ) : (
                        <X className="size-4" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
