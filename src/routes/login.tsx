import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Infinity as InfinityIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Role } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — Fitness Infinity" },
      {
        name: "description",
        content: "Log in to the Fitness Infinity member, trainer or admin workspace.",
      },
      { property: "og:title", content: "Log in — Fitness Infinity" },
      { property: "og:description", content: "Role-based login for the Fitness Infinity gym system." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn } = useGym();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("member");
  const [email, setEmail] = useState("jayson@fitnessinfinity.app");
  const [password, setPassword] = useState("demo1234");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(role);
    navigate({ to: role === "member" ? "/member" : role === "trainer" ? "/trainer" : "/admin" });
  };

  return (
    <div className="hero-bg grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-energy text-primary-foreground">
            <InfinityIcon className="size-5" />
          </span>
          <span className="font-display text-base font-semibold">Fitness Infinity</span>
        </Link>

        <div className="surface-panel p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a role to open its dashboard. Prototype credentials are pre-filled.
          </p>

          <Tabs value={role} onValueChange={(v) => setRole(v as Role)} className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="member">Member</TabsTrigger>
              <TabsTrigger value="trainer">Trainer</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>
          </Tabs>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Log in as {role}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account yet?{" "}
            <Link to="/signup" className="font-semibold text-primary">
              Create a member account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
