import { createFileRoute } from "@tanstack/react-router";
import { Megaphone } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader, SectionHeader } from "@/components/ui-bits";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/admin/announcements")({
  head: () => ({
    meta: [
      { title: "Announcements — Admin | Fitness Infinity" },
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
  const { notifications } = useGym();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <>
      <PageHeader
        eyebrow="Notifications"
        title="Announcements & automations"
        subtitle="Broadcast updates to every member and review automated notification rules."
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
            toast.success("Announcement broadcast to all members");
            setTitle("");
            setBody("");
          }}
        >
          <Megaphone className="size-4" /> Broadcast to members
        </Button>
      </section>

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
