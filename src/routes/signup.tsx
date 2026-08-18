import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { Logo } from "@/components/Logo";
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
import { FITNESS_GOALS, plans } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Fitness Infinity" },
      {
        name: "description",
        content:
          "Sign up for a Fitness Infinity membership, pick a plan and set your fitness goal.",
      },
      { property: "og:title", content: "Create your account — Fitness Infinity" },
      {
        property: "og:description",
        content: "Join Fitness Infinity: QR gym entry, trainer booking and smart reminders.",
      },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { signIn, updateMemberProfile } = useGym();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goal, setGoal] = useState(FITNESS_GOALS[0]!);
  const [plan, setPlan] = useState(plans[1]!.name);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMemberProfile({
      ...(name.trim() ? { name: name.trim() } : {}),
      ...(email.trim() ? { email: email.trim() } : {}),
      goal,
      plan,
    });
    signIn("member", name);
    navigate({ to: "/member" });
  };

  return (
    <div className="hero-bg grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo size={40} />
          <span className="font-display text-base font-semibold">Fitness Infinity</span>
        </Link>

        <div className="surface-panel p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold">Create your membership</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your QR entry pass is generated the moment you join.
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" required />
            </div>
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label>Membership plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.name}>
                      {p.name} — ₱{p.price.toLocaleString()}/{p.period}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" size="lg">
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already a member?{" "}
            <Link to="/login" className="font-semibold text-primary">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
