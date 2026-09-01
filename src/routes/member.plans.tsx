import { createFileRoute } from "@tanstack/react-router";
import { Check, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PageHeader, SectionHeader } from "@/components/ui-bits";
import { daysUntil, formatDate, plans } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/member/plans")({
  head: () => ({
    meta: [
      { title: "Membership Plans & Renewal — Fitness Infinity" },
      {
        name: "description",
        content: "Compare Fitness Infinity membership plans and renew or upgrade in one tap.",
      },
      { property: "og:title", content: "Membership Plans & Renewal — Fitness Infinity" },
      {
        property: "og:description",
        content: "Basic, Pro and Elite gym memberships with trainer sessions and recovery perks.",
      },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const { currentMember, renewPlan } = useGym();
  const daysLeft = Math.max(0, daysUntil(currentMember.expiresOn));
  const currentPrice = plans.find((p) => p.name === currentMember.plan)?.price ?? 0;
  const history = [0, 1, 2].map((back) => {
    const d = new Date(`${currentMember.expiresOn}T12:00:00`);
    d.setMonth(d.getMonth() - (back + 1));
    return {
      date: d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
      label: `${currentMember.plan} — monthly`,
      amount: currentPrice,
    };
  });

  return (
    <>
      <PageHeader
        eyebrow="Membership"
        title="Plans & renewal"
        subtitle="Renewal reminders are sent automatically 7 days before expiry."
      />

      <section className="surface-panel flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Current plan
          </p>
          <p className="mt-1 font-display text-xl font-semibold">{currentMember.plan}</p>
          <p className="text-sm text-muted-foreground">
            {daysLeft} days remaining · expires {formatDate(currentMember.expiresOn)}
          </p>
        </div>
        <Button onClick={() => renewPlan(currentMember.plan)}>
          <CreditCard className="size-4" /> Renew for 30 days
        </Button>
      </section>

      <SectionHeader title="Choose a plan" subtitle="Switch anytime — prorated in the prototype" />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((p) => {
          const current = p.name === currentMember.plan;
          return (
            <article
              key={p.id}
              className={cn(
                "surface-panel flex flex-col p-6",
                p.featured && "border-primary/50 shadow-none ring-1 ring-primary/30",
              )}
            >
              {p.featured ? (
                <span className="mb-3 inline-flex w-fit rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-semibold text-primary">
                  Most popular
                </span>
              ) : null}
              <h3 className="font-display text-lg font-semibold">{p.name}</h3>
              <p className="mt-2 font-display text-3xl font-semibold">
                ₱{p.price.toLocaleString()}
                <span className="text-sm font-normal text-muted-foreground">/{p.period}</span>
              </p>
              <ul className="mt-5 flex-1 space-y-2.5">
                {p.perks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {perk}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-6"
                variant={current ? "outline" : p.featured ? "default" : "secondary"}
                onClick={() => renewPlan(p.name)}
              >
                {current ? "Renew this plan" : `Switch to ${p.name.split(" ")[1]}`}
              </Button>
            </article>
          );
        })}
      </div>

      <section className="surface-panel space-y-3 p-6">
        <SectionHeader title="Payment history" subtitle="Mock receipts" />
        <ul className="divide-y divide-border text-sm">
          {history.map((row) => (
            <li key={row.date} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.date}</p>
              </div>
              <p className="font-semibold">₱{row.amount.toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
