import { createFileRoute } from "@tanstack/react-router";

import { Inbox } from "@/components/Inbox";
import { PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/trainer/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Coach | Fitness Infinity" },
      { name: "description", content: "Send workout recommendations and chat with your members and the gym team." },
      { property: "og:title", content: "Messages — Coach | Fitness Infinity" },
      { property: "og:description", content: "Two-way coach messaging with members and admins." },
    ],
  }),
  component: () => (
    <>
      <PageHeader
        eyebrow="Coaching"
        title="Messages & workout recommendations"
        subtitle="Chat with members and admins — everyone can reply in real time."
      />
      <Inbox />
    </>
  ),
});
