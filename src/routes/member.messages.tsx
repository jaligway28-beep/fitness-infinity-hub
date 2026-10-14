import { createFileRoute } from "@tanstack/react-router";

import { Inbox } from "@/components/Inbox";
import { PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/member/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Member | Fitness Infinity" },
      { name: "description", content: "Chat with your coach and the Fitness Infinity gym team." },
      { property: "og:title", content: "Messages — Member | Fitness Infinity" },
      { property: "og:description", content: "Reply to your coach and gym admins in real time." },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="Inbox" title="Messages" subtitle="Reply to your coach or the gym team — replies arrive instantly." />
      <Inbox />
    </>
  ),
});
