import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/ui-bits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

type Contact = { user_id: string; full_name: string; email: string | null; role: string };
type Msg = { id: string; conversation_id: string; sender_id: string; body: string; created_at: string; read_at: string | null };
type Conv = { id: string; other: Contact | null; last?: Msg; unread: number };

const roleLabel = (r?: string) => (r === "trainer" ? "Coach" : r === "admin" ? "Admin" : "Member");
const fmt = (iso: string) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function Inbox() {
  const { account } = useAuth();
  const me = account?.userId ?? null;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newContact, setNewContact] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);
  activeRef.current = activeId;

  const loadConvs = useCallback(async () => {
    if (!me) return;
    const [{ data: c }, { data: parts }] = await Promise.all([
      supabase.rpc("list_contacts"),
      supabase.from("conversation_participants").select("conversation_id, user_id"),
    ]);
    const contactList = (c ?? []) as Contact[];
    setContacts(contactList);
    const mine = (parts ?? []).filter((p) => p.user_id === me).map((p) => p.conversation_id);
    if (mine.length === 0) {
      setConvs([]);
      setLoading(false);
      return;
    }
    const { data: msgs } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .in("conversation_id", mine)
      .order("created_at", { ascending: false })
      .limit(500);
    const list: Conv[] = mine.map((id) => {
      const otherId = (parts ?? []).find((p) => p.conversation_id === id && p.user_id !== me)?.user_id;
      const convMsgs = (msgs ?? []).filter((m) => m.conversation_id === id);
      return {
        id,
        other: contactList.find((x) => x.user_id === otherId) ?? null,
        last: convMsgs[0],
        unread: convMsgs.filter((m) => m.sender_id !== me && !m.read_at).length,
      };
    });
    list.sort((a, b) => (b.last?.created_at ?? "").localeCompare(a.last?.created_at ?? ""));
    setConvs(list);
    setLoading(false);
  }, [me]);

  const loadMessages = useCallback(
    async (id: string) => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at, read_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (error) {
        toast.error("Couldn't load messages", { description: error.message });
        return;
      }
      setMessages(data ?? []);
      if (me && (data ?? []).some((m) => m.sender_id !== me && !m.read_at)) {
        await supabase
          .from("messages")
          .update({ read_at: new Date().toISOString() })
          .eq("conversation_id", id)
          .neq("sender_id", me)
          .is("read_at", null);
        // Clear the matching message alerts from the bell.
        await supabase
          .from("notifications")
          .update({ read_at: new Date().toISOString() })
          .eq("user_id", me)
          .eq("kind", "message")
          .eq("link", id)
          .is("read_at", null);
        void loadConvs();
      }
    },
    [me, loadConvs],
  );

  useEffect(() => {
    void loadConvs();
  }, [loadConvs]);

  useEffect(() => {
    if (activeId) void loadMessages(activeId);
    else setMessages([]);
  }, [activeId, loadMessages]);

  // Realtime: new messages in any conversation I'm part of.
  useEffect(() => {
    if (!me) return;
    const channel = supabase
      .channel(`inbox-${me}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Msg;
        if (activeRef.current === m.conversation_id) {
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender_id !== me) void loadMessages(m.conversation_id);
        }
        void loadConvs();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [me, loadConvs, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const startWith = async (userId: string) => {
    const { data, error } = await supabase.rpc("start_conversation", { _other: userId });
    if (error || !data) {
      toast.error("Couldn't start conversation", { description: error?.message });
      return;
    }
    setNewContact("");
    await loadConvs();
    setActiveId(data as string);
  };

  const send = async () => {
    const text = body.trim();
    if (!text || !activeId || !me) return;
    setSending(true);
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeId, sender_id: me, body: text })
      .select("id, conversation_id, sender_id, body, created_at, read_at")
      .single();
    setSending(false);
    if (error) {
      toast.error("Message not sent", { description: error.message });
      return;
    }
    setBody("");
    setMessages((prev) => (prev.some((x) => x.id === data.id) ? prev : [...prev, data]));
    toast.success("Message sent");
    void loadConvs();
  };

  const active = convs.find((c) => c.id === activeId) ?? null;
  const available = useMemo(
    () => contacts.filter((c) => !convs.some((v) => v.other?.user_id === c.user_id)),
    [contacts, convs],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className={cn("surface-panel space-y-3 p-4", activeId && "hidden lg:block")}>
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">New conversation</p>
          <Select value={newContact} onValueChange={(v) => void startWith(v)}>
            <SelectTrigger aria-label="Start a conversation">
              <SelectValue placeholder={available.length ? "Choose a person…" : "No one else to message yet"} />
            </SelectTrigger>
            <SelectContent>
              {available.map((c) => (
                <SelectItem key={c.user_id} value={c.user_id}>
                  {c.full_name || c.email} — {roleLabel(c.role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <ul className="space-y-1">
          {loading ? (
            <li className="px-2 py-4 text-sm text-muted-foreground">Loading conversations…</li>
          ) : convs.length === 0 ? (
            <li className="px-2 py-4 text-sm text-muted-foreground">No conversations yet — pick someone above to say hi.</li>
          ) : (
            convs.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left transition-colors hover:bg-muted/50",
                    c.id === activeId && "border-primary/40 bg-muted/60",
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={cn("truncate text-sm", c.unread ? "font-semibold" : "font-medium")}>
                        {c.other?.full_name || c.other?.email || "Conversation"}
                      </span>
                      {c.unread ? (
                        <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                          {c.unread}
                        </span>
                      ) : null}
                    </span>
                    <span className="block text-[11px] text-muted-foreground">{roleLabel(c.other?.role)}</span>
                    <span className="block truncate text-xs text-muted-foreground">{c.last?.body ?? "No messages yet"}</span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className={cn("surface-panel flex min-h-[28rem] flex-col p-0", !activeId && "hidden lg:flex")}>
        {!active ? (
          <div className="grid flex-1 place-items-center p-6">
            <EmptyState
              icon={<MessageSquare className="size-5" />}
              title="Select a conversation"
              body="Pick a conversation on the left, or start a new one to message your coach, members or the gym team."
            />
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                <ArrowLeft className="size-4" />
              </Button>
              <div>
                <p className="text-sm font-semibold">{active.other?.full_name || active.other?.email}</p>
                <p className="text-xs text-muted-foreground">{roleLabel(active.other?.role)}</p>
              </div>
            </header>
            <ol className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
              {messages.length === 0 ? (
                <li className="py-8 text-center text-sm text-muted-foreground">No messages yet — write the first one below.</li>
              ) : (
                messages.map((m) => {
                  const mine = m.sender_id === me;
                  return (
                    <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                          mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <p className={cn("mt-1 text-[10px]", mine ? "text-primary-foreground/80" : "text-muted-foreground")}>
                          {fmt(m.created_at)}
                          {mine ? (m.read_at ? " · Read" : " · Sent") : ""}
                        </p>
                      </div>
                    </li>
                  );
                })
              )}
              <div ref={endRef} />
            </ol>
            <form
              className="flex items-end gap-2 border-t border-border p-3"
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
            >
              <Textarea
                rows={2}
                value={body}
                aria-label="Message"
                placeholder="Write a message…"
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                className="min-h-0 flex-1 resize-none"
              />
              <Button type="submit" disabled={!body.trim() || sending}>
                <Send className="size-4" /> Send
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
