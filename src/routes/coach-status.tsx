import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { requireSignedIn } from "@/lib/auth-guard";

export const Route = createFileRoute("/coach-status")({
  ssr: false,
  beforeLoad: requireSignedIn,
  head: () => ({
    meta: [
      { title: "Coach application status — Fitness Infinity" },
      { name: "description", content: "Check the review status of your Fitness Infinity coach application." },
      { property: "og:title", content: "Coach application status — Fitness Infinity" },
      { property: "og:description", content: "Apply to coach at Fitness Infinity and track admin approval." },
    ],
  }),
  component: CoachStatus,
});

type App = {
  id: string;
  status: string;
  specialization: string;
  experience_years: number;
  bio: string;
  review_note: string | null;
  created_at: string;
};

function CoachStatus() {
  const { userId, role } = Route.useRouteContext();
  const navigate = useNavigate();
  const [app, setApp] = useState<App | null | undefined>(undefined);
  const [spec, setSpec] = useState("");
  const [years, setYears] = useState("1");
  const [bio, setBio] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("coach_applications")
      .select("id, status, specialization, experience_years, bio, review_note, created_at")
      .eq("user_id", userId)
      .maybeSingle();
    setApp(data);
    if (data) {
      setSpec(data.specialization);
      setYears(String(data.experience_years));
      setBio(data.bio);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", userId).maybeSingle();
    const payload = {
      specialization: spec.trim(),
      experience_years: Math.max(0, Math.min(60, Number(years) || 0)),
      bio: bio.trim(),
      status: "pending",
      review_note: null,
      reviewed_at: null,
      reviewed_by: null,
    };
    const { error } = app
      ? await supabase.from("coach_applications").update(payload).eq("id", app.id)
      : await supabase.from("coach_applications").insert({
          ...payload,
          user_id: userId,
          full_name: profile?.full_name || u.user?.email || "Applicant",
          email: profile?.email || u.user?.email || "",
        });
    setBusy(false);
    if (error) {
      toast.error("Application not submitted", { description: error.message });
      return;
    }
    toast.success("Application submitted", { description: "An admin will review it soon." });
    void load();
  };

  const showForm = app === null || app?.status === "rejected";

  return (
    <div className="hero-bg grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link to="/" className="mb-8 flex items-center justify-center gap-2.5">
          <Logo size={40} />
          <span className="font-display text-base font-semibold">Fitness Infinity</span>
        </Link>
        <div className="surface-panel space-y-5 p-6 sm:p-8">
          {role === "trainer" || app?.status === "approved" ? (
            <div className="text-center">
              <CheckCircle2 className="mx-auto size-10 text-primary" />
              <h1 className="mt-3 font-display text-2xl font-semibold">You're an approved coach</h1>
              <p className="mt-1 text-sm text-muted-foreground">Your Coach dashboard is unlocked.</p>
              <Button className="mt-5 w-full" onClick={() => navigate({ to: "/trainer" })}>
                Open Coach dashboard
              </Button>
            </div>
          ) : app === undefined ? (
            <p className="text-center text-sm text-muted-foreground">Loading your application…</p>
          ) : (
            <>
              {app?.status === "pending" ? (
                <div className="text-center">
                  <Clock className="mx-auto size-10 text-primary" />
                  <h1 className="mt-3 font-display text-2xl font-semibold">Application pending review</h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Submitted {new Date(app.created_at).toLocaleDateString()}. Coach features unlock once an admin approves you.
                  </p>
                  <dl className="mt-4 grid gap-2 rounded-xl border border-border p-4 text-left text-sm">
                    <div><dt className="text-xs text-muted-foreground">Specialization</dt><dd>{app.specialization || "—"}</dd></div>
                    <div><dt className="text-xs text-muted-foreground">Experience</dt><dd>{app.experience_years} years</dd></div>
                  </dl>
                </div>
              ) : app?.status === "rejected" ? (
                <div className="text-center">
                  <XCircle className="mx-auto size-10 text-destructive" />
                  <h1 className="mt-3 font-display text-2xl font-semibold">Application not approved</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{app.review_note || "You can update your details and apply again."}</p>
                </div>
              ) : (
                <div>
                  <h1 className="font-display text-2xl font-semibold">Apply to coach</h1>
                  <p className="mt-1 text-sm text-muted-foreground">Tell us about your coaching background. An admin reviews every application.</p>
                </div>
              )}
              {showForm ? (
                <form className="space-y-4" onSubmit={submit}>
                  <div className="space-y-2">
                    <Label htmlFor="spec">Specialization</Label>
                    <Input id="spec" required value={spec} onChange={(e) => setSpec(e.target.value)} placeholder="Strength & conditioning" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="years">Years of experience</Label>
                    <Input id="years" type="number" min={0} max={60} required value={years} onChange={(e) => setYears(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio">Certifications & experience</Label>
                    <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="e.g. PRC-certified, 3 years at a CrossFit box" />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy}>
                    {busy ? "Submitting…" : app ? "Resubmit application" : "Submit application"}
                  </Button>
                </form>
              ) : null}
              <Button variant="outline" className="w-full" onClick={() => navigate({ to: "/member" })}>
                Continue to Member dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
