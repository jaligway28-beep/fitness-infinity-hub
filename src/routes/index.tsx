import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  QrCode,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fitness Infinity — Smart Gym Management System" },
      {
        name: "description",
        content:
          "Manage memberships, trainer bookings, QR check-ins, attendance and notifications for your gym from one connected platform.",
      },
      { property: "og:title", content: "Fitness Infinity — Smart Gym Management System" },
      {
        property: "og:description",
        content:
          "One platform for gym owners, staff, trainers and members: memberships, QR attendance, trainer booking and automated reminders.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const audiences = [
  { icon: ShieldCheck, label: "Gym owners" },
  { icon: LayoutDashboard, label: "Administrators & staff" },
  { icon: Users, label: "Personal trainers" },
  { icon: Dumbbell, label: "Gym members" },
] as const;

const features = [
  {
    icon: CreditCard,
    title: "Membership Management",
    body: "Track membership status, plans, renewals and expiration dates.",
  },
  {
    icon: QrCode,
    title: "QR Code Attendance",
    body: "Members check in and out in seconds using their digital QR pass.",
  },
  {
    icon: CalendarClock,
    title: "Trainer Booking",
    body: "Members browse trainers, view availability and book sessions.",
  },
  {
    icon: CalendarDays,
    title: "Trainer Scheduling",
    body: "Trainers manage their open time slots and upcoming sessions.",
  },
  {
    icon: Bell,
    title: "Automated Notifications",
    body: "Reminders for bookings, membership expiry and gym updates.",
  },
  {
    icon: LayoutDashboard,
    title: "Smart Dashboard",
    body: "Personalised dashboards for admins, trainers and members.",
  },
] as const;

const steps = [
  {
    icon: UserPlus,
    title: "Register",
    body: "Create an account and set up your gym membership.",
  },
  {
    icon: QrCode,
    title: "Book & Check In",
    body: "Book a trainer and use your QR code for gym attendance.",
  },
  {
    icon: LayoutDashboard,
    title: "Stay on Track",
    body: "Manage appointments, memberships, attendance and notifications from your dashboard.",
  },
] as const;

const roles = [
  {
    to: "/admin",
    label: "Admin",
    icon: ShieldCheck,
    body: "Manage members, memberships, trainers, bookings, attendance and reports.",
  },
  {
    to: "/trainer",
    label: "Trainer",
    icon: Users,
    body: "Manage availability, view appointments and keep track of training sessions.",
  },
  {
    to: "/member",
    label: "Member",
    icon: Dumbbell,
    body: "View membership status, access your QR pass, book trainers and track appointments.",
  },
] as const;

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Logo size={40} />
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
            Smart gym management
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Everything Your Gym Needs, <span className="text-energy">In One Smart System</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Manage memberships, trainer bookings, QR check-ins, attendance and notifications from one
            simple platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#features">Explore Features</a>
            </Button>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2.5 rounded-xl border border-border bg-card/40 px-4 py-3 text-sm font-medium"
              >
                <Icon className="size-4 shrink-0 text-primary" /> {label}
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            Built to simplify day-to-day gym operations while making the member experience easier.
          </p>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-16 lg:px-8">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          Everything You Need to Run Your Gym
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 lg:px-8">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="surface-panel p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-energy font-display text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <Icon className="size-5 text-primary" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 lg:px-8">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Built for every role</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Each role gets its own workspace with only the tools it needs.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {roles.map(({ to, label, icon: Icon, body }) => (
            <Link
              key={to}
              to={to}
              className="surface-panel group p-6 transition-colors hover:border-primary/50"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-accent/15 text-accent">
                <Icon className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{label}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-primary">
                Open {label.toLowerCase()} workspace →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-20 lg:px-8">
        <div className="surface-panel flex flex-col items-start gap-5 p-8 sm:p-10">
          <h2 className="max-w-2xl font-display text-2xl font-semibold sm:text-3xl">
            Ready to Make Gym Management Simpler?
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
            Manage your gym operations and give members a better experience with one connected
            system.
          </p>
          <Button asChild size="lg">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto w-full max-w-6xl space-y-2 px-4 lg:px-8">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-display text-sm font-semibold">Fitness Infinity</span>
          </div>
          <p className="text-xs text-muted-foreground">
            This application is a capstone project prototype developed for academic purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
