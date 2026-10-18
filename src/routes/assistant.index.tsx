import { createFileRoute, redirect } from "@tanstack/react-router";

import { supabase } from "@/integrations/supabase/client";
import { createThread } from "@/routes/assistant";

export const Route = createFileRoute("/assistant/")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const userId = (context as { userId: string }).userId;
    const { data } = await supabase
      .from("ai_threads")
      .select("id")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1);
    const id = data?.[0]?.id ?? (await createThread(userId));
    throw redirect({ to: "/assistant/$threadId", params: { threadId: id }, replace: true });
  },
  component: () => null,
});
