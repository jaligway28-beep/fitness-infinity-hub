import { createFileRoute } from "@tanstack/react-router";
import { Check, ClipboardCheck, UserMinus, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/coaches")({
  head: () => ({
    meta: [
      { title: "Coach Applications — Admin | Fitness Infinity" },
      { name: "description", content: "Review, approve or reject coach applications at Fitness Infinity." },
      { property: "og:title", content: "Coach Applications — Admin | Fitness Infinity" },
      { property: "og:description", content: "Admin approval workflow for new Fitness Infinity coaches." },
    ],
  }),
  component: CoachApplications,
});

type App = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  specialization: string;
  experience_years: number;
  bio: string;
  status: string;
  review_note: string | null;
  created_at: string;
};

type Tab = "pending" | "approved" | "rejected";

function CoachApplications() {
  const [apps, setApps] = useState<App[]>([]);
  const [tab, setTab] = useState<Tab>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from("coach_applications")
      .select("id, user_id, full_name, email, specialization, experience_years, bio, status, review_note, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Couldn't load applications", { description: error.message });
    setApps(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (a: App, approve: boolean) => {
    setBusyId(a.id);
    const { error } = await supabase.rpc("review_coach_application", { _id: a.id, _approve: approve });
    setBusyId(null);
    if (error) {
      toast.error("Review failed", { description: error.message });
      return;
    }
    toast.success(approve ? `${a.full_name} approved as coach` : `${a.full_name}'s application rejected`);
    void load();
  };

  const revoke = async (a: App) => {
    setBusyId(a.id);
    const { error } = await supabase.rpc("revoke_coach", { _user: a.user_id });
    setBusyId(null);
    if (error) {
      toast.error("Couldn't remove coach", { description: error.message });
      return;
    }
    toast.success(`${a.full_name} no longer has coach access`);
    void load();
  };

  const list = apps.filter((a) => a.status === tab);
  const count = (s: Tab) => apps.filter((a) => a.status === s).length;

  return (
    <>
      <PageHeader
        eyebrow="Staff"
        title="Coach Applications"
        subtitle="Approve applicants to unlock their Coach dashboard. Only admins can change coach access."
      />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({count("pending")})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({count("approved")})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({count("rejected")})</TabsTrigger>
        </TabsList>
      </Tabs>
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading applications…</p>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<ClipboardCheck className="size-5" />}
          title={tab === "pending" ? "No applications waiting" : `No ${tab} applications`}
          body={
            tab === "pending"
              ? "New coach sign-ups appear here for review. Share the sign-up page with coaches who want to join."
              : "Reviewed applications will be listed here."
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {list.map((a) => (
            <li key={a.id} className="surface-panel space-y-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.full_name}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                    a.status === "pending" && "bg-primary/15 text-primary",
                    a.status === "approved" && "bg-success/15 text-success",
                    a.status === "rejected" && "bg-destructive/15 text-destructive",
                  )}
                >
                  {a.status}
                </span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div><dt className="text-xs text-muted-foreground">Specialization</dt><dd>{a.specialization || "—"}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Experience</dt><dd>{a.experience_years} yrs</dd></div>
                <div className="col-span-2"><dt className="text-xs text-muted-foreground">Applied</dt><dd>{new Date(a.created_at).toLocaleDateString("en-US", { dateStyle: "medium" })}</dd></div>
                {a.bio ? <div className="col-span-2"><dt className="text-xs text-muted-foreground">Background</dt><dd className="text-muted-foreground">{a.bio}</dd></div> : null}
              </dl>
              {a.status === "pending" ? (
                <div className="flex gap-2">
                  <Button size="sm" disabled={busyId === a.id} onClick={() => void review(a, true)}>
                    <Check className="size-4" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => void review(a, false)}>
                    <X className="size-4" /> Reject
                  </Button>
                </div>
              ) : a.status === "approved" ? (
                <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => void revoke(a)}>
                  <UserMinus className="size-4" /> Remove coach access
                </Button>
              ) : (
                <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => void review(a, true)}>
                  <Check className="size-4" /> Approve anyway
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
