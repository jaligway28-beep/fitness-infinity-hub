import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, CalendarClock, CreditCard, Flame, QrCode } from "lucide-react";

import { QrPass } from "@/components/QrPass";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { EmptyState, PageHeader, SectionHeader, StatCard, StatusPill } from "@/components/ui-bits";
import { dayLabel, daysUntil, formatDate, isoDay, plans, todayIso } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/member/")({
  head: () => ({
    meta: [
      { title: "Member Dashboard — Fitness Infinity" },
      {
        name: "description",
        content:
          "Track your membership status, upcoming trainer appointments, QR attendance and notifications.",
      },
      { property: "og:title", content: "Member Dashboard — Fitness Infinity" },
      {
        property: "og:description",
        content: "Membership status, bookings, QR attendance history and reminders in one view.",
      },
    ],
  }),
  component: MemberDashboard,
});

function MemberDashboard() {
  const { currentMember, bookings, attendance, notifications } = useGym();
  const today = todayIso();

  const upcoming = bookings
    .filter((b) => b.memberId === currentMember.id && b.date >= today && b.status !== "cancelled")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);
  const myAttendance = attendance.filter((a) => a.memberId === currentMember.id);
  const weekStart = isoDay(-6);
  const checkinsThisWeek = myAttendance.filter(
    (a) => a.kind === "check-in" && a.date >= weekStart,
  );
  const recentAttendance = myAttendance.slice(0, 4);
  const unread = notifications.filter((n) => n.audience === "member" && !n.read);
  const daysLeft = Math.max(0, daysUntil(currentMember.expiresOn));
  const sessionCredits =
    plans.find((p) => p.name === currentMember.plan)?.name === "Infinity Elite" ? 10 : 4;
  const creditsUsed = bookings.filter(
    (b) =>
      b.memberId === currentMember.id &&
      b.status !== "cancelled" &&
      b.status !== "declined" &&
      b.date.slice(0, 7) === todayIso().slice(0, 7),
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Member workspace"
        title={`Let's train, ${currentMember.name.split(" ")[0]}`}
        subtitle="Your membership, sessions and gym entries at a glance."
        action={
          <Button asChild>
            <Link to="/member/book">
              <CalendarClock className="size-4" /> Book a trainer
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Membership"
          value={currentMember.plan}
          hint={`${daysLeft} days left · expires ${formatDate(currentMember.expiresOn)}`}
          icon={<CreditCard className="size-4" />}
          link={{ to: "/member/plans", "aria-label": "View membership and renewal options" }}
        />
        <StatCard
          label="Upcoming sessions"
          value={upcoming.length}
          hint={upcoming[0] ? `Next: ${dayLabel(upcoming[0].date)} · ${upcoming[0].slot}` : "None booked"}
          icon={<CalendarClock className="size-4" />}
          accent="accent"
          link={{ to: "/member/bookings", search: { tab: "upcoming" }, "aria-label": "View my upcoming bookings" }}
        />
        <StatCard
          label="Check-ins this week"
          value={checkinsThisWeek.length}
          hint="QR check-ins in the last 7 days"
          icon={<QrCode className="size-4" />}
        />
        <StatCard
          label="Unread alerts"
          value={unread.length}
          hint="Reminders and announcements"
          icon={<Bell className="size-4" />}
          accent="warning"
          link={{ to: "/member/notifications", search: { tab: "unread" }, "aria-label": "View unread alerts" }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-panel space-y-4 p-6 lg:col-span-2">
          <SectionHeader
            title="Upcoming appointments"
            subtitle="Sessions awaiting confirmation or already locked in"
            action={
              <Button asChild variant="outline" size="sm">
                <Link to="/member/bookings">Manage</Link>
              </Button>
            }
          />
          {upcoming.length === 0 ? (
            <EmptyState
              icon={<CalendarPlus className="size-5" />}
              title="No sessions booked"
              body="Book a session with a trainer and start working toward your fitness goals."
              action={{ label: "Browse Trainers", link: { to: "/member/book", "aria-label": "Browse trainers and book a session" } }}
              secondaryAction={{ label: "View Past Sessions", link: { to: "/member/bookings", search: { tab: "past" } } }}
            />
          ) : (
            <ul className="space-y-3">
              {upcoming.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background/40 p-4"
                >
                  <div>
                    <p className="font-semibold">{b.trainerName}</p>
                    <p className="text-sm text-muted-foreground">
                      {dayLabel(b.date)} · {b.slot} · {b.goal}
                    </p>
                  </div>
                  <StatusPill status={b.status} />
                </li>
              ))}
            </ul>
          )}

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold">Monthly session credits</p>
              <p className="text-muted-foreground">
                {creditsUsed} of {sessionCredits} used
              </p>
            </div>
            <Progress
              value={Math.min(100, (creditsUsed / sessionCredits) * 100)}
              className="mt-3"
            />
          </div>
        </section>

        <section className="surface-panel flex flex-col items-center gap-4 p-6 text-center">
          <SectionHeader title="Your QR pass" />
          <QrPass value={`FI-${currentMember.id}-${currentMember.plan}`} size={200} />
          <div>
            <p className="font-display text-sm font-semibold">{currentMember.name}</p>
            <p className="text-xs text-muted-foreground">
              ID FI-{currentMember.id.toUpperCase()}00{currentMember.id.length}
            </p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link to="/member/qr">
              <QrCode className="size-4" /> Open full pass
            </Link>
          </Button>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="surface-panel space-y-4 p-6">
          <SectionHeader title="Recent QR attendance" subtitle="Last gym entries logged" />
          <ul className="space-y-3">
            {recentAttendance.map((a) => (
              <li key={a.id} className="flex items-center justify-between rounded-xl border border-border p-3.5">
                <div className="flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Flame className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{dayLabel(a.date)}</p>
                    <p className="text-xs text-muted-foreground">{a.method}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{a.time}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface-panel space-y-4 p-6">
          <SectionHeader
            title="Notifications"
            subtitle="Automated updates from the gym"
            action={
              <Button asChild variant="ghost" size="sm">
                <Link to="/member/notifications">View all</Link>
              </Button>
            }
          />
          <ul className="space-y-3">
            {notifications
              .filter((n) => n.audience === "member")
              .slice(0, 4)
              .map((n) => (
                <li key={n.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex items-center justify-between gap-2">
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
