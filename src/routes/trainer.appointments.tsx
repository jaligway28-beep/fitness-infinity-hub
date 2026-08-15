import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, StatusPill } from "@/components/ui-bits";
import { dayLabel } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/trainer/appointments")({
  head: () => ({
    meta: [
      { title: "Appointments — Trainer | Fitness Infinity" },
      {
        name: "description",
        content:
          "Review booking details and member fitness goals, then accept, decline or complete sessions.",
      },
      { property: "og:title", content: "Appointments — Trainer | Fitness Infinity" },
      {
        property: "og:description",
        content: "Accept, decline or mark trainer appointments completed with member goal context.",
      },
    ],
  }),
  component: TrainerAppointments,
});

function TrainerAppointments() {
  const { bookings, activeTrainerId, setBookingStatus, members } = useGym();
  const [tab, setTab] = useState("pending");

  const mine = bookings.filter((b) => b.trainerId === activeTrainerId);
  const list =
    tab === "pending"
      ? mine.filter((b) => b.status === "pending")
      : tab === "confirmed"
        ? mine.filter((b) => b.status === "confirmed")
        : tab === "completed"
          ? mine.filter((b) => b.status === "completed")
          : mine;

  return (
    <>
      <PageHeader
        eyebrow="Bookings"
        title="Appointment requests"
        subtitle="Members are notified automatically whenever you update a session."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState title="Nothing in this tab" body="New requests will appear here." />
      ) : (
        <ul className="space-y-3">
          {list
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((b) => {
              const member = members.find((m) => m.id === b.memberId);
              return (
                <li key={b.id} className="surface-panel p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-energy font-display text-sm font-bold text-primary-foreground">
                        {member?.initials ?? "FI"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{b.memberName}</p>
                          <StatusPill status={b.status} />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {dayLabel(b.date)} · {b.slot}
                        </p>
                        <p className="mt-1 text-sm">
                          <span className="text-muted-foreground">Goal: </span>
                          <span className="font-medium text-primary">{b.goal}</span>
                          {member ? (
                            <span className="text-muted-foreground"> · {member.plan}</span>
                          ) : null}
                        </p>
                        {b.note ? (
                          <p className="mt-2 rounded-lg border border-border bg-background/40 p-3 text-sm text-muted-foreground">
                            “{b.note}”
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
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
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </>
  );
}
