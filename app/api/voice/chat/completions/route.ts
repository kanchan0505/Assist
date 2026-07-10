import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { isGroqConfigured } from "@/lib/ai/client";
import { db } from "@/lib/db";
import { voiceSessions } from "@/lib/db/schema";
import { pickAcknowledgment } from "@/lib/voice/acknowledgments";
import { classifyCandidateIntent } from "@/lib/voice/intent-classifier";
import {
  createInitialInterviewState,
  updateInterviewState,
  type InterviewState,
  type SessionContext,
} from "@/lib/voice/interview-state";
import {
  generateInterviewerResponse,
  streamInterviewerResponse,
} from "@/lib/voice/generate-interviewer-response";
import {
  buildOpenAiCompletion,
  createOpenAiSseStream,
} from "@/lib/voice/openai-sse";
import type { InterviewerStyle } from "@/lib/voice/interviewer-styles";

type VapiChatRequest = {
  messages?: { role: string; content: string }[];
  stream?: boolean;
  model?: string;
  sessionId?: string;
  metadata?: { sessionId?: string } | string;
  call?: {
    id?: string;
    metadata?: { sessionId?: string };
    assistant?: { metadata?: { sessionId?: string } };
  };
};

function getSessionId(body: VapiChatRequest, request: Request): string | null {
  const fromQuery = new URL(request.url).searchParams.get("custom_session_id");
  const fromBody = body.sessionId;
  const fromMetadata =
    typeof body.metadata === "object" && body.metadata !== null
      ? body.metadata.sessionId
      : undefined;
  const fromCall = body.call?.metadata?.sessionId;
  const fromAssistant = body.call?.assistant?.metadata?.sessionId;

  return fromBody ?? fromMetadata ?? fromCall ?? fromAssistant ?? fromQuery;
}

function verifyLlmSecret(request: Request): boolean {
  const secret = process.env.VAPI_LLM_SECRET;
  if (!secret) return true;
  return request.headers.get("x-vapi-secret") === secret;
}

function getLastUserMessage(messages: { role: string; content: string }[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === "user" && messages[i]?.content?.trim()) {
      return messages[i]!.content.trim();
    }
  }
  return null;
}

function buildRecentContext(messages: { role: string; content: string }[]) {
  return messages
    .slice(-8)
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");
}

function emptyLlmResponse(stream: boolean, model?: string) {
  if (stream) {
    const emptyStream = (async function* () {})();
    return new Response(createOpenAiSseStream(emptyStream, model), {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }
  return NextResponse.json(buildOpenAiCompletion("", model));
}

export async function POST(request: Request) {
  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: "Groq API key not configured" },
      { status: 500 },
    );
  }

  if (!verifyLlmSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: VapiChatRequest;

  try {
    body = (await request.json()) as VapiChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const messages = body.messages ?? [];
    const sessionId = getSessionId(body, request);

    if (!sessionId) {
      console.warn("Custom LLM: missing sessionId", {
        keys: Object.keys(body),
        hasMetadata: Boolean(body.metadata),
        hasCall: Boolean(body.call),
      });
      return emptyLlmResponse(Boolean(body.stream), body.model);
    }

    const [voiceSession] = await db
      .select()
      .from(voiceSessions)
      .where(eq(voiceSessions.id, sessionId))
      .limit(1);

    if (!voiceSession || voiceSession.status !== "active") {
      console.warn("Custom LLM: session not found or inactive", sessionId);
      return emptyLlmResponse(Boolean(body.stream), body.model);
    }

    const ctx = voiceSession.sessionContext as SessionContext | null;
    if (!ctx) {
      return NextResponse.json({ error: "Session context missing" }, { status: 500 });
    }

    const style = (voiceSession.interviewerStyle ?? "balanced") as InterviewerStyle;
    const topicSeed =
      ctx.interviewType === "project"
        ? ctx.projectTitle ?? "project"
        : ctx.skillName ?? "technical skill";

    let state: InterviewState =
      (voiceSession.interviewState as InterviewState | null) ??
      createInitialInterviewState(topicSeed);

    const userMessage = getLastUserMessage(messages);
    if (!userMessage) {
      return emptyLlmResponse(Boolean(body.stream), body.model);
    }

    const recentContext = buildRecentContext(messages.slice(0, -1));
    const { intent, topic } = await classifyCandidateIntent(
      userMessage,
      recentContext,
      state.currentTopic || topicSeed,
    );

    const acknowledgment = pickAcknowledgment(state.recentPhrases);
    state = updateInterviewState(state, intent, topic, acknowledgment);

    await db
      .update(voiceSessions)
      .set({ interviewState: state })
      .where(eq(voiceSessions.id, sessionId));

    const chatMessages = messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    }));

    const genOptions = {
      messages: chatMessages,
      ctx,
      style,
      state,
      intent,
      acknowledgment,
    };

    if (body.stream) {
      const textStream = streamInterviewerResponse(genOptions);

      return new Response(createOpenAiSseStream(textStream, body.model), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    const content = await generateInterviewerResponse(genOptions);

    return NextResponse.json(buildOpenAiCompletion(content, body.model));
  } catch (error) {
    console.error("Custom LLM error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "LLM generation failed",
      },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-vapi-secret",
    },
  });
}
