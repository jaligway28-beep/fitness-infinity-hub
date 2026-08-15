import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Dumbbell,
  Infinity as InfinityIcon,
  QrCode,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fitness Infinity — Smart Gym Membership & Trainer Booking" },
      {
        name: "description",
        content:
          "Fitness Infinity is a smart gym membership and trainer appointment system with QR code attendance, online booking and automated notifications.",
      },
      { property: "og:title", content: "Fitness Infinity — Smart Gym Management Prototype" },
      {
        property: "og:description",
        content:
          "Member, trainer and admin dashboards for QR attendance, trainer bookings, membership renewal and automated reminders.",
      },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: QrCode,
    title: "QR code attendance",
    body: "Every member carries a digital pass. One scan logs entry time instantly.",
  },
  {
    icon: CalendarClock,
    title: "Online trainer booking",
    body: "Pick a coach, date, open time slot and fitness goal in under a minute.",
  },
  {
    icon: Bell,
    title: "Automated notifications",
    body: "Confirmations, session reminders, expiry alerts and gym announcements.",
  },
  {
    icon: ShieldCheck,
    title: "Role-based dashboards",
    body: "Separate workspaces for members, trainers and gym administrators.",
  },
];

const roles = [
  {
    to: "/member",
    label: "Member",
    icon: Dumbbell,
    body: "QR pass, bookings, membership renewal and notifications.",
  },
  {
    to: "/trainer",
    label: "Trainer",
    icon: Users,
    body: "Today's sessions, availability slots and assigned members.",
  },
  {
    to: "/admin",
    label: "Admin",
    icon: ShieldCheck,
    body: "Attendance analytics, membership status and announcements.",
  },
] as const;

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 lg:px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-energy text-primary-foreground">
            <InfinityIcon className="size-5" />
          </span>
          <span className="font-display text-base font-semibold">Fitness Infinity</span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Sign up</Link>
          </Button>
        </div>
      </header>

      <section className="hero-bg">
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-10 lg:px-8 lg:pb-24 lg:pt-16">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            Capstone prototype
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Smart gym membership and <span className="text-energy">trainer appointment</span>{" "}
            management
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            QR code attendance, online booking and automated notifications in one clean workspace
            for members, trainers and gym staff.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/login">Open a dashboard</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/member/qr">See the QR pass</Link>
            </Button>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Mock data only", "Clickable prototype", "Responsive on mobile"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, body }) => (
            <article key={title} className="surface-panel p-5">
              <span className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 lg:px-8">
        <h2 className="font-display text-2xl font-semibold">Explore each role</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Jump straight into any workspace — no credentials needed in this prototype.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {roles.map(({ to, label, icon: Icon, body }) => (
            <Link key={to} to={to} className="surface-panel group p-6 transition-colors hover:border-primary/50">
              <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{label} dashboard</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">
                Open workspace →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <p className="mx-auto w-full max-w-6xl px-4 text-xs text-muted-foreground lg:px-8">
          Fitness Infinity — capstone prototype. All data shown is mock data.
        </p>
      </footer>
    </div>
  );
}
