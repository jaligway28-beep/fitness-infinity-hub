import { useChat } from "@ai-sdk/react";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useMemo } from "react";
import { toast } from "sonner";

import aiCoach from "@/assets/ai-coach.png";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/assistant/$threadId")({
  ssr: false,
  loader: async ({ params }) => {
    const { data: thread } = await supabase.from("ai_threads").select("id").eq("id", params.threadId).maybeSingle();
    if (!thread) throw notFound();
    const { data, error } = await supabase
      .from("ai_messages")
      .select("sdk_id, role, parts")
      .eq("thread_id", params.threadId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const messages: UIMessage[] = (data ?? []).map((m) => ({
      id: m.sdk_id,
      role: m.role as UIMessage["role"],
      parts: m.parts as UIMessage["parts"],
    }));
    return { messages };
  },
  notFoundComponent: () => (
    <p className="surface-panel p-6 text-sm text-muted-foreground">This chat doesn't exist or was deleted. Start a new chat.</p>
  ),
  component: ThreadPage,
});

const SUGGESTIONS = [
  "Give me a 3-day beginner full-body routine",
  "How much protein do I need to build muscle?",
  "Healthy ulam ideas under 500 calories",
  "Estimate my daily calories for weight loss",
];

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { messages } = Route.useLoaderData();
  return <ChatWindow key={threadId} threadId={threadId} initialMessages={messages} />;
}

function ChatWindow({ threadId, initialMessages }: { threadId: string; initialMessages: UIMessage[] }) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
        headers: async (): Promise<Record<string, string>> => {
          const { data } = await supabase.auth.getSession();
          const token = data.session?.access_token;
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (e) => toast.error("The assistant couldn't answer", { description: e.message }),
    onFinish: () => window.dispatchEvent(new Event("ai-thread-updated")),
  });

  const busy = status === "submitted" || status === "streaming";
  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    void sendMessage({ text: t });
  };

  return (
    <section className="surface-panel flex h-[calc(100vh-14rem)] min-h-[28rem] flex-col p-0 lg:h-[calc(100vh-10rem)]">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <img src={aiCoach} alt="" width={36} height={36} className="size-9 rounded-full" />
        <div>
          <h1 className="font-display text-sm font-semibold">AI Fitness Assistant</h1>
          <p className="text-xs text-muted-foreground">Workouts, nutrition & healthy habits — English or Taglish</p>
        </div>
      </header>

      <Conversation className="flex-1">
        <ConversationContent>
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<img src={aiCoach} alt="" width={64} height={64} className="size-16 rounded-full" />}
              title="Kumusta! How can I help you train today?"
              description="Ask about routines, protein, calories or meal ideas. Answers are general guidance, not medical advice."
            >
              <div className="mt-4 flex flex-col items-center gap-3">
                <img src={aiCoach} alt="" width={64} height={64} className="size-16 rounded-full" />
                <p className="font-display text-base font-semibold">Kumusta! How can I help you train today?</p>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  Ask about routines, protein, calories or meal ideas. Answers are general guidance, not medical advice.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </ConversationEmptyState>
          ) : (
            messages.map((m) => (
              <Message key={m.id} from={m.role}>
                <MessageContent
                  className={
                    m.role === "user"
                      ? "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground"
                      : "bg-transparent"
                  }
                >
                  {m.parts.map((part, i) =>
                    part.type === "text" ? (
                      m.role === "assistant" ? (
                        <MessageResponse key={i}>{part.text}</MessageResponse>
                      ) : (
                        <p key={i} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      )
                    ) : null,
                  )}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" ? (
            <Message from="assistant">
              <MessageContent className="bg-transparent">
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          ) : null}
          {error && !busy ? (
            <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error.message || "Something went wrong. Please try again."}
            </p>
          ) : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border p-3">
        <PromptInput onSubmit={({ text }) => send(text)}>
          <PromptInputTextarea autoFocus placeholder="Ask about workouts, food, protein, calories…" />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} onStop={stop} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </section>
  );
}
