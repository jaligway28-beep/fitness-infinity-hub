import { createFileRoute } from "@tanstack/react-router";
import { Send } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/ui-bits";
import { formatDate, type Member } from "@/lib/gym-data";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/trainer/members")({
  head: () => ({
    meta: [
      { title: "My Members — Trainer | Fitness Infinity" },
      {
        name: "description",
        content:
          "Assigned members with their fitness goals, plans and session history, plus quick workout messages.",
      },
      { property: "og:title", content: "My Members — Trainer | Fitness Infinity" },
      {
        property: "og:description",
        content: "See member goals and send short workout recommendations.",
      },
    ],
  }),
  component: TrainerMembers,
});

function MessageDialog({ member }: { member: Member }) {
  const { sendMessage } = useGym();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Send className="size-4" /> Message
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Message {member.name}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="e.g. Add 10 minutes of incline walking after tomorrow's session."
          rows={4}
        />
        <DialogFooter>
          <Button
            disabled={!body.trim()}
            onClick={() => {
              sendMessage(member.id, member.name, body.trim());
              setBody("");
              setOpen(false);
            }}
          >
            Send recommendation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TrainerMembers() {
  const { members, bookings, activeTrainerId } = useGym();
  const assignedIds = new Set(
    bookings.filter((b) => b.trainerId === activeTrainerId).map((b) => b.memberId),
  );
  const assigned = members.filter((m) => assignedIds.has(m.id));

  return (
    <>
      <PageHeader
        eyebrow="Roster"
        title="My members"
        subtitle="Fitness goals, plan status and session counts for everyone you coach."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {assigned.map((m) => {
          const sessions = bookings.filter(
            (b) => b.memberId === m.id && b.trainerId === activeTrainerId,
          );
          const completed = sessions.filter((b) => b.status === "completed").length;
          return (
            <article key={m.id} className="surface-panel p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-energy font-display text-sm font-bold text-primary-foreground">
                  {m.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.email}</p>
                  <p className="mt-2 text-sm">
                    <span className="text-muted-foreground">Goal: </span>
                    <span className="font-medium text-primary">{m.goal}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.plan} · expires {formatDate(m.expiresOn)}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  {sessions.length} booked · {completed} completed
                </p>
                <MessageDialog member={m} />
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}
