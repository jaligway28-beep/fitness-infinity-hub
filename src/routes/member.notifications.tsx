import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bell, CalendarCheck, CreditCard, Megaphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/ui-bits";
import type { Notification } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

const NOTIF_TABS = ["all", "unread", "booking", "reminder", "membership", "announcement"] as const;
type NotifTab = (typeof NOTIF_TABS)[number];

export const Route = createFileRoute("/member/notifications")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: NOTIF_TABS.includes(search.tab as NotifTab) ? (search.tab as NotifTab) : "all",
  }),
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
  const { tab } = Route.useSearch();
  const navigate = useNavigate();
  const setTab = (next: string) =>
    navigate({ to: "/member/notifications", search: { tab: next as NotifTab }, replace: true });

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
        <EmptyState title="No notifications" body="New alerts will appear here." />
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
