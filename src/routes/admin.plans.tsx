import { createFileRoute } from "@tanstack/react-router";
import { CreditCard } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader, SectionHeader, StatCard } from "@/components/ui-bits";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/admin/plans")({
  head: () => ({
    meta: [
      { title: "Membership Plans — Admin | Fitness Infinity" },
      {
        name: "description",
        content: "Manage Fitness Infinity membership plans, pricing, perks and subscriber counts.",
      },
      { property: "og:title", content: "Membership Plans — Admin | Fitness Infinity" },
      {
        property: "og:description",
        content: "Edit plan pricing and perks, and see how many members are on each tier.",
      },
    ],
  }),
  component: AdminPlans,
});

function AdminPlans() {
  const { plans, members, updatePlan } = useGym();
  const [editing, setEditing] = useState<string | null>(null);
  const [price, setPrice] = useState("");
  const [perk, setPerk] = useState("");

  const revenue = members
    .filter((m) => m.planStatus === "active")
    .reduce((sum, m) => sum + (plans.find((p) => p.name === m.plan)?.price ?? 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Memberships"
        title="Plan management"
        subtitle="Adjust pricing, perks and monitor how members are distributed across tiers."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active plans" value={plans.length} icon={<CreditCard className="size-4" />} />
        <StatCard
          label="Monthly recurring"
          value={`₱${revenue.toLocaleString()}`}
          hint="From active memberships"
          accent="accent"
        />
        <StatCard
          label="Needs renewal"
          value={members.filter((m) => m.planStatus !== "active").length}
          hint="Expiring or expired"
          accent="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((p) => {
          const subscribers = members.filter((m) => m.plan === p.name);
          const isEditing = editing === p.id;
          return (
            <section key={p.id} className="surface-panel space-y-4 p-6">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold">{p.name}</p>
                  <p className="text-sm text-muted-foreground">
                    ₱{p.price.toLocaleString()} / {p.period}
                  </p>
                </div>
                {p.featured ? (
                  <span className="rounded-full bg-primary/15 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    Featured
                  </span>
                ) : null}
              </div>

              <ul className="space-y-1.5 text-sm text-muted-foreground">
                {p.perks.map((k) => (
                  <li key={k}>• {k}</li>
                ))}
              </ul>

              <p className="text-xs text-muted-foreground">
                {subscribers.length} {subscribers.length === 1 ? "member" : "members"} on this plan
              </p>

              {isEditing ? (
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <div className="space-y-2">
                    <Label htmlFor={`price-${p.id}`}>Price (₱ / {p.period})</Label>
                    <Input
                      id={`price-${p.id}`}
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`perk-${p.id}`}>Add a perk</Label>
                    <Input
                      id={`perk-${p.id}`}
                      value={perk}
                      onChange={(e) => setPerk(e.target.value)}
                      placeholder="Free InBody scan"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const next = Number(price);
                        updatePlan(p.id, {
                          ...(Number.isFinite(next) && next > 0 ? { price: next } : {}),
                          ...(perk.trim() ? { perks: [...p.perks, perk.trim()] } : {}),
                        });
                        setEditing(null);
                        setPerk("");
                      }}
                    >
                      Save changes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditing(p.id);
                      setPrice(String(p.price));
                      setPerk("");
                    }}
                  >
                    Edit plan
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => updatePlan(p.id, { featured: !p.featured })}
                  >
                    {p.featured ? "Unfeature" : "Feature"}
                  </Button>
                </div>
              )}
            </section>
          );
        })}
      </div>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Members per plan" subtitle="Plan status of every membership record" />
        <ul className="divide-y divide-border">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
              <div>
                <p className="text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-muted-foreground">{m.plan}</p>
              </div>
              <span className="text-xs capitalize text-muted-foreground">{m.planStatus}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
