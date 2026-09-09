import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState, PageHeader, SectionHeader } from "@/components/ui-bits";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/trainer/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Trainer | Fitness Infinity" },
      {
        name: "description",
        content: "Send short workout recommendations and notes to the members you coach.",
      },
      { property: "og:title", content: "Messages — Trainer | Fitness Infinity" },
      {
        property: "og:description",
        content: "Trainer-to-member messaging for workout recommendations and reminders.",
      },
    ],
  }),
  component: TrainerMessages,
});

function TrainerMessages() {
  const { members, messages, sendMessage } = useGym();
  const [memberId, setMemberId] = useState(members[0]!.id);
  const [body, setBody] = useState("");

  const send = () => {
    const member = members.find((m) => m.id === memberId);
    if (!member || !body.trim()) return;
    sendMessage(member.id, member.name, body.trim());
    setBody("");
  };

  return (
    <>
      <PageHeader
        eyebrow="Coaching"
        title="Messages & workout recommendations"
        subtitle="Short notes land in the member's notification feed instantly."
      />

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="New message" />
        <Select value={memberId} onValueChange={setMemberId}>
          <SelectTrigger className="sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name} — {m.goal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="e.g. Great session today. Keep protein at 1.8g/kg and rest 90s between sets."
        />
        <Button disabled={!body.trim()} onClick={send}>
          Send message
        </Button>
      </section>

      <section className="surface-panel space-y-4 p-6">
        <SectionHeader title="Sent messages" />
        {messages.length === 0 ? (
          <EmptyState
          icon={<Send className="size-5" />}
          title="No messages yet"
          body="Send a workout recommendation to one of your members and it will appear here."
          action={{ label: "Message a Member", link: { to: "/trainer/members", "aria-label": "Open your member roster" } }}
        />
        ) : (
          <ul className="space-y-3">
            {messages.map((m) => (
              <li key={m.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">To {m.memberName}</p>
                  <span className="text-xs text-muted-foreground">{m.time}</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
