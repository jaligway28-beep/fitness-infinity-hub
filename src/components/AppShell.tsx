import { Link, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  Bell,
  CalendarCheck,
  CalendarClock,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  QrCode,
  Users,
  UserRound,
} from "lucide-react";
import { useState, type ReactNode } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useGym } from "@/lib/gym-store";
import type { Role } from "@/lib/gym-data";
import { cn } from "@/lib/utils";

const memberNav = [
  { to: "/member", label: "Dashboard", icon: LayoutDashboard },
  { to: "/member/qr", label: "QR Pass", icon: QrCode },
  { to: "/member/book", label: "Book Trainer", icon: CalendarClock },
  { to: "/member/bookings", label: "My Bookings", icon: CalendarCheck },
  { to: "/member/plans", label: "Membership", icon: CreditCard },
  { to: "/member/notifications", label: "Notifications", icon: Bell },
  { to: "/member/profile", label: "Profile", icon: UserRound },
] as const;

const trainerNav = [
  { to: "/trainer", label: "Dashboard", icon: LayoutDashboard },
  { to: "/trainer/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/trainer/availability", label: "Availability", icon: CalendarClock },
  { to: "/trainer/members", label: "My Members", icon: Users },
  { to: "/trainer/messages", label: "Messages", icon: MessageSquare },
] as const;

const adminNav = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/members", label: "Members", icon: Users },
  { to: "/admin/trainers", label: "Trainers", icon: Dumbbell },
  { to: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
  { to: "/admin/attendance", label: "QR Attendance", icon: QrCode },
  { to: "/admin/plans", label: "Plans", icon: CreditCard },
  { to: "/admin/announcements", label: "Notifications", icon: Bell },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
] as const;

function navFor(role: Role) {
  if (role === "member") return memberNav;
  if (role === "trainer") return trainerNav;
  return adminNav;
}

export function AppShell({ role, children }: { role: Role; children: ReactNode }) {
  const { session, signOut, notifications } = useGym();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const nav = navFor(role);
  const unread = notifications.filter((n) => n.audience === role && !n.read).length;
  const displayName = session?.name ?? (role === "trainer" ? "Coach" : "Guest Member");

  const roleLabel = role === "member" ? "Member" : role === "trainer" ? "Trainer" : "Admin";

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {nav.map(({ to, label, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          onClick={onNavigate}
          activeOptions={{ exact: to === "/member" || to === "/trainer" || to === "/admin" }}
          activeProps={{
            className: "bg-sidebar-accent text-sidebar-accent-foreground border-primary/40",
          }}
          className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
        >
          <Icon className="size-4" />
          <span className="flex-1">{label}</span>
          {label === "Notifications" && unread > 0 ? (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
              {unread}
            </span>
          ) : null}
        </Link>
      ))}
    </nav>
  );

  const Brand = (
    <Link to="/" className="flex items-center gap-2.5">
      <Logo size={36} />
      <span className="leading-tight">
        <span className="block font-display text-sm font-semibold">Fitness Infinity</span>
        <span className="block text-[11px] text-muted-foreground">{roleLabel} workspace</span>
      </span>
    </Link>
  );

  const handleSignOut = () => {
    signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 lg:flex">
        {Brand}
        <div className="mt-8 flex-1">
          <NavList />
        </div>
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3">
          <p className="truncate text-sm font-semibold">{displayName}</p>
          <p className="text-xs text-muted-foreground">{roleLabel} account</p>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/85 px-4 py-3 backdrop-blur lg:px-8">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              {Brand}
              <div className="mt-8">
                <NavList onNavigate={() => setOpen(false)} />
              </div>
              <Button variant="ghost" size="sm" className="mt-4 w-full justify-start" onClick={handleSignOut}>
                <LogOut className="size-4" /> Sign out
              </Button>
            </SheetContent>
          </Sheet>

          <div className="hidden lg:block">
            <p className="text-sm font-semibold">Welcome back, {displayName.split(" ")[0]}</p>
            <p className="text-xs text-muted-foreground">
              Smart gym membership, bookings & QR attendance
            </p>
          </div>
          <span className="flex items-center gap-2 lg:hidden">
            <Logo size={26} />
            <span className="font-display text-sm font-semibold">Fitness Infinity</span>
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to={
                role === "member"
                  ? "/member/notifications"
                  : role === "trainer"
                    ? "/trainer/messages"
                    : "/admin/announcements"
              }
              className="relative grid size-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                  {unread}
                </span>
              ) : null}
            </Link>
            <span
              className={cn(
                "grid size-9 place-items-center rounded-xl bg-energy font-display text-xs font-bold text-primary-foreground",
              )}
            >
              {displayName
                .split(" ")
                .map((p) => p[0])
                .slice(0, 2)
                .join("")}
            </span>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl space-y-8 px-4 pb-28 pt-8 lg:px-8 lg:pb-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-sidebar-border bg-sidebar/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {nav.slice(0, 4).map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: to === "/member" || to === "/trainer" || to === "/admin" }}
            activeProps={{ className: "text-primary" }}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium text-sidebar-foreground/70 transition-colors"
          >
            <Icon className="size-5 shrink-0" />
            <span className="max-w-full truncate">{label}</span>
            {label === "Notifications" && unread > 0 ? (
              <span className="absolute right-2 top-1.5 grid size-4 place-items-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {unread}
              </span>
            ) : null}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium text-sidebar-foreground/70"
        >
          <Menu className="size-5 shrink-0" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
