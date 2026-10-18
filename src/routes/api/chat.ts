import { createOpenAI } from "@ai-sdk/openai";
import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
  withLovableAiGatewayRunIdHeader,
} from "@/lib/ai/run-id.server";

const MODEL = "openai/gpt-6-astra";
const GATEWAY = "https://ai.gateway.lovable.dev/v1";

const SYSTEM = `You are the Fitness Infinity AI Fitness Assistant, a friendly gym and nutrition guide for members and coaches of Fitness Infinity gym in the Philippines.
- Help with workouts, gym routines, exercise form, food choices, calorie estimates, protein, weight loss, muscle gain and healthy meal ideas (Filipino-friendly options welcome).
- Answer in clear, practical, supportive English. If the user writes in Filipino or Taglish, reply in the same style.
- Keep answers concise and skimmable: short paragraphs, bullet lists, and simple tables for plans.
- For calorie or macro estimates, ask for missing key details first (age, sex, height, weight, activity level, goal) when they matter. Always label numbers clearly as estimates.
- Safety: never diagnose illnesses, prescribe medicine or supplements doses for conditions, or recommend crash diets, extreme deficits (<1200 kcal for most adults), purging or unsafe practices. You do not replace a doctor or registered dietitian. For medical conditions, injuries, pain, pregnancy, eating disorders or severe symptoms, recommend seeing a qualified professional.
- You may suggest booking a session with a Fitness Infinity coach for personalized programming.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) return Response.json({ error: "Please sign in to use the assistant." }, { status: 401 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
        if (userError || !userData.user) return Response.json({ error: "Your session expired. Please sign in again." }, { status: 401 });
        const userId = userData.user.id;

        let payload: { messages?: UIMessage[]; threadId?: string };
        try {
          payload = await request.json();
        } catch {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const messages = Array.isArray(payload.messages) ? payload.messages : [];
        const threadId = typeof payload.threadId === "string" ? payload.threadId : "";
        if (!threadId || messages.length === 0) return Response.json({ error: "Invalid request" }, { status: 400 });

        const { data: thread } = await supabaseAdmin
          .from("ai_threads")
          .select("id, title, user_id")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread || thread.user_id !== userId) return Response.json({ error: "Conversation not found" }, { status: 404 });

        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return Response.json({ error: "The assistant isn't configured yet." }, { status: 500 });

        // Persist the newest user message.
        const last = messages[messages.length - 1]!;
        if (last.role === "user") {
          const { error } = await supabaseAdmin
            .from("ai_messages")
            .upsert(
              { thread_id: threadId, user_id: userId, sdk_id: last.id, role: "user", parts: last.parts as never },
              { onConflict: "thread_id,sdk_id" },
            );
          if (error) console.error("save user message failed", error.message);
          if (thread.title === "New chat") {
            const text = last.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ").trim();
            if (text) await supabaseAdmin.from("ai_threads").update({ title: text.slice(0, 60) }).eq("id", threadId);
          }
        }
        await supabaseAdmin.from("ai_threads").update({ updated_at: new Date().toISOString() }).eq("id", threadId);

        const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
        const provider = createOpenAI({
          baseURL: GATEWAY,
          apiKey,
          headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
          fetch: runIdFetch.fetch,
        });

        const result = streamText({
          model: provider.responses(MODEL),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
          abortSignal: request.signal,
          providerOptions: {
            openai: {
              forceReasoning: true,
              reasoningEffort: "low",
              reasoningSummary: "auto",
              store: false,
              include: ["reasoning.encrypted_content"],
            },
          },
        });

        const response = result.toUIMessageStreamResponse({
          originalMessages: messages,
          sendReasoning: true,
          onError: (error) => {
            const status = (error as { statusCode?: number })?.statusCode;
            if (status === 429) return "The assistant is busy right now. Please try again in a moment.";
            if (status === 402) return "AI credits have run out for this workspace.";
            return "Something went wrong while answering. Please try again.";
          },
          onFinish: async ({ responseMessage }) => {
            const { error } = await supabaseAdmin
              .from("ai_messages")
              .upsert(
                {
                  thread_id: threadId,
                  user_id: userId,
                  sdk_id: responseMessage.id,
                  role: "assistant",
                  parts: responseMessage.parts as never,
                },
                { onConflict: "thread_id,sdk_id" },
              );
            if (error) console.error("save assistant message failed", error.message);
          },
        });
        return withLovableAiGatewayRunIdHeader(response, runIdFetch);
      },
    },
  },
});
