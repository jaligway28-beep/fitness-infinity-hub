import { createFileRoute } from "@tanstack/react-router";

import { Inbox } from "@/components/Inbox";
import { PageHeader } from "@/components/ui-bits";

export const Route = createFileRoute("/admin/messages")({
  head: () => ({
    meta: [
      { title: "Messages — Admin | Fitness Infinity" },
      { name: "description", content: "Message coaches and members from the Fitness Infinity admin console." },
      { property: "og:title", content: "Messages — Admin | Fitness Infinity" },
      { property: "og:description", content: "Two-way messaging between admins, coaches and members." },
    ],
  }),
  component: () => (
    <>
      <PageHeader eyebrow="Inbox" title="Messages" subtitle="Talk with coaches and members in real time." />
      <Inbox />
    </>
  ),
});
