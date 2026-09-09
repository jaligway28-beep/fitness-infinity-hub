import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, BellRing, CalendarCheck, CreditCard, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/ui-bits";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";

import type { Notification } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

const NOTIF_TABS = ["all", "unread", "booking", "reminder", "membership", "announcement"];

export const Route = createFileRoute("/member/notifications")({
  validateSearch: zodValidator(z.object({ tab: fallback(z.string(), "all").default("all") })),
  head: () => ({
    meta: [
      { title: "Notifications — Fitness Infinity" },
      {
        name: "description",
        content:
          "Booking confirmations, appointment reminders, membership expiry alerts and gym announcements.",
      },
      { property: "og:title", content: "Notifications — Fitness Infinity" },
      {
        property: "og:description",
        content: "Automated gym notifications for bookings, reminders and membership renewals.",
      },
    ],
  }),
  component: NotificationsPage,
});

const kindIcon: Record<Notification["kind"], typeof Bell> = {
  booking: CalendarCheck,
  reminder: Bell,
  membership: CreditCard,
  announcement: Megaphone,
};

function NotificationsPage() {
  const { notifications, markAllRead, markRead } = useGym();
  const search = Route.useSearch();
  const tab = NOTIF_TABS.includes(search.tab) ? search.tab : "all";
  const navigate = useNavigate();
  const setTab = (next: string) =>
    navigate({ to: "/member/notifications", search: { tab: next }, replace: true });

  const mine = notifications.filter((n) => n.audience === "member");
  const list =
    tab === "all"
      ? mine
      : tab === "unread"
        ? mine.filter((n) => !n.read)
        : mine.filter((n) => n.kind === tab);

  return (
    <>
      <PageHeader
        eyebrow="Automated notifications"
        title={tab === "unread" ? "Unread alerts" : "Notifications"}
        subtitle={
          tab === "unread"
            ? "Alerts you haven't opened yet — bookings, reminders and announcements."
            : "Everything the system sends you, in one feed."
        }
        action={
          <Button variant="outline" onClick={() => markAllRead("member")}>
            Mark all as read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="booking">Bookings</TabsTrigger>
          <TabsTrigger value="reminder">Reminders</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          <TabsTrigger value="announcement">Announcements</TabsTrigger>
        </TabsList>
      </Tabs>

      {list.length === 0 ? (
        <EmptyState
          icon={<BellRing className="size-5" />}
          title="You're all caught up"
          body="Booking confirmations, session reminders and gym announcements will show up here."
          action={{ label: "Book a Session", link: { to: "/member/book", "aria-label": "Book a trainer session" } }}
          secondaryAction={{ label: "View All Alerts", link: { to: "/member/notifications", search: { tab: "all" } } }}
        />
      ) : (
        <ul className="space-y-3">
          {list.map((n) => {
            const Icon = kindIcon[n.kind];
            return (
              <li
                key={n.id}
                className={cn(
                  "surface-panel flex items-start gap-4 p-5",
                  !n.read && "border-primary/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    n.read ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{n.title}</p>
                    <span className="text-xs text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                </div>
                {!n.read ? (
                  <Button variant="ghost" size="sm" onClick={() => markRead(n.id)}>
                    Mark read
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
