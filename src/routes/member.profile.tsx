import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { PageHeader, SectionHeader } from "@/components/ui-bits";
import { FITNESS_GOALS } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/member/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Fitness Preferences — Fitness Infinity" },
      {
        name: "description",
        content:
          "Update your profile details, primary fitness goal, preferred training times and notification settings.",
      },
      { property: "og:title", content: "Profile & Fitness Preferences — Fitness Infinity" },
      {
        property: "og:description",
        content: "Personalize your training goals and notification preferences.",
      },
    ],
  }),
  component: ProfilePage,
});

const PREF_TIMES = ["Early morning", "Morning", "Lunch", "Afternoon", "Evening"];
const FOCUS = ["Upper body", "Lower body", "Core", "Cardio", "Flexibility", "Olympic lifts"];

function ProfilePage() {
  const { currentMember, updateMemberProfile } = useGym();
  const [name, setName] = useState(currentMember.name);
  const [email, setEmail] = useState(currentMember.email);
  const [goal, setGoal] = useState(currentMember.goal);
  const [times, setTimes] = useState<string[]>(["Evening"]);
  const [focus, setFocus] = useState<string[]>(["Upper body", "Core"]);

  const toggle = (list: string[], set: (v: string[]) => void, item: string) =>
    set(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Profile & fitness preferences"
        subtitle="Trainers use these preferences when planning your sessions."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface-panel flex flex-col items-center gap-3 p-6 text-center">
          <span className="grid size-20 place-items-center rounded-2xl bg-energy font-display text-2xl font-bold text-primary-foreground">
            {currentMember.initials}
          </span>
          <div>
            <p className="font-display text-lg font-semibold">{currentMember.name}</p>
            <p className="text-sm text-muted-foreground">{currentMember.email}</p>
          </div>
          <p className="rounded-full border border-primary/30 bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
            {currentMember.plan}
          </p>
          <p className="text-xs text-muted-foreground">Member since {currentMember.joinedOn}</p>
        </section>

        <section className="surface-panel space-y-5 p-6 lg:col-span-2">
          <SectionHeader title="Personal details" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Primary fitness goal</Label>
              <Select value={goal} onValueChange={setGoal}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FITNESS_GOALS.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preferred training times</Label>
            <div className="flex flex-wrap gap-2">
              {PREF_TIMES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(times, setTimes, t)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    times.includes(t)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Training focus</Label>
            <div className="flex flex-wrap gap-2">
              {FOCUS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(focus, setFocus, t)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                    focus.includes(t)
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border hover:border-accent/40",
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border p-4">
            {[
              { label: "Appointment reminders", hint: "24 hours before each session" },
              { label: "Membership expiry alerts", hint: "7 days before renewal" },
              { label: "Gym announcements", hint: "Facility updates and events" },
            ].map((row, i) => (
              <div key={row.label} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{row.label}</p>
                  <p className="text-xs text-muted-foreground">{row.hint}</p>
                </div>
                <Switch defaultChecked={i < 3} />
              </div>
            ))}
          </div>

          <Button onClick={() => updateMemberProfile({ name, email, goal })}>Save changes</Button>
        </section>
      </div>
    </>
  );
}
