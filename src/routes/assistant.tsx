import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { requireSignedIn } from "@/lib/auth-guard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/assistant")({
  ssr: false,
  beforeLoad: requireSignedIn,
  head: () => ({
    meta: [
      { title: "AI Fitness Assistant | Fitness Infinity" },
      { name: "description", content: "Ask about workouts, gym routines, protein, calories and healthy Filipino-friendly meals." },
      { property: "og:title", content: "AI Fitness Assistant | Fitness Infinity" },
      { property: "og:description", content: "Your AI gym and nutrition guide at Fitness Infinity." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AssistantLayout,
});

type Thread = { id: string; title: string; updated_at: string };

export async function createThread(userId: string) {
  const { data, error } = await supabase.from("ai_threads").insert({ user_id: userId }).select("id").single();
  if (error) throw error;
  return data.id;
}

function AssistantLayout() {
  const { role, userId } = Route.useRouteContext();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const activeId = pathname.split("/")[2] ?? null;
  const [threads, setThreads] = useState<Thread[]>([]);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("ai_threads")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    setThreads(data ?? []);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  // Refresh titles after each answer.
  useEffect(() => {
    const onDone = () => void load();
    window.addEventListener("ai-thread-updated", onDone);
    return () => window.removeEventListener("ai-thread-updated", onDone);
  }, [load]);

  const newChat = async () => {
    try {
      const id = await createThread(userId);
      await load();
      navigate({ to: "/assistant/$threadId", params: { threadId: id } });
    } catch (e) {
      toast.error("Couldn't start a new chat", { description: (e as Error).message });
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("ai_threads").delete().eq("id", id);
    if (error) {
      toast.error("Couldn't delete chat", { description: error.message });
      return;
    }
    await load();
    if (id === activeId) navigate({ to: "/assistant" });
  };

  return (
    <AppShell role={role}>
      <div className="grid gap-4 lg:grid-cols-[15rem_1fr]">
        <aside className="surface-panel hidden space-y-3 p-3 lg:block">
          <Button className="w-full" onClick={() => void newChat()}>
            <MessageSquarePlus className="size-4" /> New chat
          </Button>
          <ul className="space-y-1">
            {threads.length === 0 ? (
              <li className="px-2 py-3 text-xs text-muted-foreground">Your past chats will appear here.</li>
            ) : (
              threads.map((t) => (
                <li
                  key={t.id}
                  className={cn(
                    "group flex items-center gap-1 rounded-lg border border-transparent",
                    t.id === activeId && "border-primary/40 bg-muted/60",
                  )}
                >
                  <Link
                    to="/assistant/$threadId"
                    params={{ threadId: t.id }}
                    className="min-w-0 flex-1 truncate px-2.5 py-2 text-sm"
                  >
                    {t.title}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Delete chat ${t.title}`}
                    onClick={() => void remove(t.id)}
                    className="p-2 text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>
        <div className="min-w-0 space-y-3">
          <div className="flex gap-2 lg:hidden">
            <Button size="sm" onClick={() => void newChat()}>
              <MessageSquarePlus className="size-4" /> New chat
            </Button>
            {threads.length > 0 ? (
              <select
                aria-label="Past chats"
                className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 text-sm"
                value={activeId ?? ""}
                onChange={(e) => navigate({ to: "/assistant/$threadId", params: { threadId: e.target.value } })}
              >
                {threads.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
