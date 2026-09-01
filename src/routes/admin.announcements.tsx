import { createFileRoute } from "@tanstack/react-router";
import { BellRing, Megaphone } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionHeader } from "@/components/ui-bits";
import { dayLabel, formatDate, todayIso } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/admin/announcements")({
  head: () => ({
    meta: [
      { title: "Notification Center — Admin | Fitness Infinity" },
      {
        name: "description",
        content: "Broadcast gym announcements and automated notification templates to members.",
      },
      { property: "og:title", content: "Announcements — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Send gym-wide announcements and review automated notification rules.",
      },
    ],
  }),
  component: AdminAnnouncements,
});

const automations = [
  { title: "Booking confirmation", when: "Sent the moment a trainer accepts a request" },
  { title: "Appointment reminder", when: "24 hours and 1 hour before each session" },
  { title: "Membership expiry", when: "7 days and 1 day before the plan expires" },
  { title: "Missed check-in nudge", when: "After 7 days with no QR entry" },
];

function AdminAnnouncements() {
  const { notifications, bookings, members, broadcast } = useGym();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const today = todayIso();
  const upcoming = bookings.filter(
    (b) => b.date >= today && b.status !== "cancelled" && b.status !== "declined",
  );
  const expiring = members.filter((m) => m.planStatus !== "active");

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Notification center"
        subtitle="Send announcements, booking reminders and membership-expiry reminders, and review automated rules."
      />

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="New announcement" />
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Holiday gym hours" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="body">Message</Label>
          <Textarea
            id="body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="The gym will open 8 AM – 6 PM this weekend."
          />
        </div>
        <Button
          disabled={!title.trim() || !body.trim()}
          onClick={() => {
            broadcast({
              audience: "member",
              title: title.trim(),
              body: body.trim(),
              kind: "announcement",
            });
            setTitle("");
            setBody("");
          }}
        >
          <Megaphone className="size-4" /> Broadcast to members
        </Button>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel space-y-4 p-6">
          <SectionHeader
            title="Booking reminders"
            subtitle={`${upcoming.length} upcoming sessions can be reminded`}
          />
          <ul className="space-y-3">
            {upcoming.slice(0, 4).map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{b.memberName}</p>
                  <p className="text-xs text-muted-foreground">
                    {b.trainerName} · {dayLabel(b.date)} · {b.slot}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    broadcast({
                      audience: "member",
                      title: "Appointment reminder",
                      body: `${b.memberName}, your session with ${b.trainerName} is on ${dayLabel(b.date)} at ${b.slot}.`,
                      kind: "reminder",
                    })
                  }
                >
                  <BellRing className="size-4" /> Remind
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-panel space-y-4 p-6">
          <SectionHeader
            title="Membership expiry reminders"
            subtitle={`${expiring.length} memberships need renewal`}
          />
          <ul className="space-y-3">
            {expiring.map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {m.plan} · expires {formatDate(m.expiresOn)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    broadcast({
                      audience: "member",
                      title: "Membership expiring",
                      body: `${m.name}, your ${m.plan} plan expires on ${formatDate(m.expiresOn)}. Renew to keep your QR pass active.`,
                      kind: "membership",
                    })
                  }
                >
                  <BellRing className="size-4" /> Send reminder
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Automated notifications" subtitle="Triggers currently enabled" />
          <ul className="space-y-3">
            {automations.map((a) => (
              <li key={a.title} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">{a.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{a.when}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Admin alerts" />
          <ul className="space-y-3">
            {notifications
              .filter((n) => n.audience === "admin")
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
      </div>
    </>
  );
}
