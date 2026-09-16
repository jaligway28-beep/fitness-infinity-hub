import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { currentRole, homeFor } from "@/lib/auth-guard";
import { FITNESS_GOALS, plans, type Role } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your account — Fitness Infinity" },
      {
        name: "description",
        content:
          "Sign up for a Fitness Infinity account as a member, trainer or gym administrator.",
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

const ROLE_OPTIONS: { value: Role; label: string; hint: string }[] = [
  { value: "member", label: "Member", hint: "QR pass, bookings and membership" },
  { value: "trainer", label: "Trainer", hint: "Schedule, clients and availability" },
  { value: "admin", label: "Gym administrator", hint: "Full gym management console" },
];

function SignupPage() {
  const { updateMemberProfile } = useGym();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [goal, setGoal] = useState(FITNESS_GOALS[0]!);
  const [plan, setPlan] = useState(plans[1]!.name);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name.trim(), role },
      },
    });
    if (error) {
      setBusy(false);
      toast.error("We couldn't create your account", { description: error.message });
      return;
    }

    if (role === "member") {
      updateMemberProfile({
        ...(name.trim() ? { name: name.trim() } : {}),
        ...(email.trim() ? { email: email.trim() } : {}),
        goal,
        plan,
      });
    }

    if (!data.session) {
      setBusy(false);
      setSent(true);
      return;
    }

    const account = await currentRole();
    navigate({ to: account ? homeFor(account.role) : homeFor(role) });
    setBusy(false);
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(false);
      toast.error("Google sign-in failed", { description: result.error.message });
      return;
    }
    if (result.redirected) return;
    const account = await currentRole();
    navigate({ to: account ? homeFor(account.role) : "/member" });
    setBusy(false);
  };

  return (
    <div className="hero-bg grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo size={40} />
          <span className="font-display text-base font-semibold">Fitness Infinity</span>
        </Link>

        <div className="surface-panel p-6 sm:p-8">
          {sent ? (
            <div className="text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/15 text-primary">
                <MailCheck className="size-6" />
              </span>
              <h1 className="mt-4 font-display text-2xl font-semibold">Confirm your email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>.
                Open it to activate your account, then log in.
              </p>
              <Button className="mt-6 w-full" size="lg" onClick={() => navigate({ to: "/login" })}>
                Go to log in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display text-2xl font-semibold">Create your account</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pick the account type you need — your dashboard is set up automatically.
              </p>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Juan Dela Cruz"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Account type</Label>
                  <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label} — {o.hint}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {role === "member" ? (
                  <>
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
                  </>
                ) : null}

                <Button type="submit" className="w-full" size="lg" disabled={busy}>
                  {busy ? "Creating account…" : "Create account"}
                </Button>
              </form>

              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <Button variant="outline" className="w-full" size="lg" onClick={google} disabled={busy}>
                Continue with Google
              </Button>

              <p className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="font-semibold text-primary">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
