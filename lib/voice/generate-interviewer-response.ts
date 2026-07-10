import { generateText } from "ai";
import { groq, MODELS } from "@/lib/ai/client";
import type { InterviewIntent } from "@/lib/voice/intent-classifier";
import {
  shouldPivotTopic,
  type InterviewState,
  type SessionContext,
} from "@/lib/voice/interview-state";
import { buildInterviewerSystemPrompt } from "@/lib/voice/interviewer-prompt";
import type { InterviewerStyle } from "@/lib/voice/interviewer-styles";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function generateInterviewerResponse(options: {
  messages: ChatMessage[];
  ctx: SessionContext;
  style: InterviewerStyle;
  state: InterviewState;
  intent: InterviewIntent;
  acknowledgment: string;
}): Promise<string> {
  const pivotRecommended = shouldPivotTopic(options.state, options.style);

  const system = buildInterviewerSystemPrompt(
    options.ctx,
    options.style,
    options.state,
    options.intent,
    options.acknowledgment,
    pivotRecommended,
  );

  const conversationMessages = options.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const { text } = await generateText({
    model: groq(MODELS.structuredQuality),
    system,
    messages: conversationMessages,
    temperature: 0.75,
    maxOutputTokens: 300,
  });

  return text.trim();
}

export async function* streamInterviewerResponse(options: {
  messages: ChatMessage[];
  ctx: SessionContext;
  style: InterviewerStyle;
  state: InterviewState;
  intent: InterviewIntent;
  acknowledgment: string;
}): AsyncGenerator<string> {
  const { streamText } = await import("ai");
  const pivotRecommended = shouldPivotTopic(options.state, options.style);

  const system = buildInterviewerSystemPrompt(
    options.ctx,
    options.style,
    options.state,
    options.intent,
    options.acknowledgment,
    pivotRecommended,
  );

  const conversationMessages = options.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const result = streamText({
    model: groq(MODELS.structuredQuality),
    system,
    messages: conversationMessages,
    temperature: 0.75,
    maxOutputTokens: 300,
  });

  for await (const chunk of result.textStream) {
    yield chunk;
  }
}
