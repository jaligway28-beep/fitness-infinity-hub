import { Link, type LinkProps } from "@tanstack/react-router";
import { ArrowUpRight, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BookingStatus } from "@/lib/gym-data";

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
  link,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  accent?: "primary" | "accent" | "warning";
  /** When provided the whole card becomes an interactive link to a filtered view. */
  link?: LinkProps & { "aria-label"?: string };
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        {icon ? (
          <span
            className={cn(
              "grid size-9 place-items-center rounded-xl border border-border",
              accent === "accent" && "bg-accent/15 text-accent",
              accent === "warning" && "bg-warning/15 text-warning",
              (!accent || accent === "primary") && "bg-primary/15 text-primary",
            )}
          >
            {icon}
          </span>
        ) : null}
      </div>
      <p className="mt-3 font-display text-2xl font-semibold">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </>
  );

  if (link) {
    return (
      <Link
        {...link}
        className={cn(
          "surface-panel group relative block p-5 transition-all",
          "hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-lg",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {body}
        <ArrowUpRight className="absolute bottom-4 right-4 size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </Link>
    );
  }

  return <div className="surface-panel p-5">{body}</div>;
}

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-xl font-semibold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </header>
  );
}

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-warning/15 text-warning border-warning/30",
  confirmed: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-accent/15 text-accent border-accent/30",
  declined: "bg-destructive/15 text-destructive border-destructive/30",
  cancelled: "bg-muted text-muted-foreground border-border",
};

export function StatusPill({ status }: { status: BookingStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize",
        statusStyles[status],
      )}
    >
      {status}
    </span>
  );
}

export type EmptyStateAction = { label: string; link: LinkProps & { "aria-label"?: string } };

export function EmptyState({
  title,
  body,
  icon,
  action,
  secondaryAction,
}: {
  title: string;
  body: string;
  /** Contextual lucide icon; falls back to a neutral marker. */
  icon?: ReactNode;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-background/30 p-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl border border-border bg-primary/10 text-primary">
        {icon ?? <Sparkles className="size-5" />}
      </span>
      <p className="mt-4 font-display text-base font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action || secondaryAction ? (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {action ? (
            <Button asChild size="sm">
              <Link {...action.link}>{action.label}</Link>
            </Button>
          ) : null}
          {secondaryAction ? (
            <Button asChild size="sm" variant="outline">
              <Link {...secondaryAction.link}>{secondaryAction.label}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

