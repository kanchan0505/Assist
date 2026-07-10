import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { isGroqConfigured } from "@/lib/ai/client";
import { summarizeVoiceInterview } from "@/lib/ai/summarize-voice";
import { db } from "@/lib/db";
import { projects, resumes, skills, voiceSessions } from "@/lib/db/schema";
import { getVapiAssistantId } from "@/lib/vapi/vapi.sdk";
import type { VapiVariableValues } from "@/lib/vapi/vapi.sdk";
import { getLanguageLabel } from "@/lib/voice/languages";
import {
  createInitialInterviewState,
  type SessionContext,
} from "@/lib/voice/interview-state";
import type { InterviewerStyle } from "@/lib/voice/interviewer-styles";
import { INTERVIEWER_STYLES } from "@/lib/voice/interviewer-styles";
import { buildInitialInterviewerSystemPrompt } from "@/lib/voice/interviewer-prompt";
import { resolveCustomLlmUrl, resolveServerLlmMode } from "@/lib/voice/llm-mode";

function buildProjectContext(project: {
  title: string;
  description: string | null;
  enrichedDescription: string | null;
}) {
  return [
    `Project: ${project.title}`,
    project.description ? `Description: ${project.description}` : null,
    project.enrichedDescription
      ? `Additional context: ${project.enrichedDescription}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildSkillContext(skill: {
  name: string;
  category: string;
}) {
  return [
    `Technical skill: ${skill.name}`,
    `Category: ${skill.category}`,
    "Ask conceptual questions, practical scenarios, and follow-ups based on typical interview depth for this skill.",
  ].join("\n");
}

export async function POST(request: Request) {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const body = await request.json();
    const interviewType = body.interviewType as "skill" | "project";
    const interviewLanguage = (body.interviewLanguage as string) ?? "en";
    const interviewerStyleRaw = (body.interviewerStyle as string) ?? "balanced";
    const interviewerStyle = INTERVIEWER_STYLES.some((s) => s.value === interviewerStyleRaw)
      ? (interviewerStyleRaw as InterviewerStyle)
      : "balanced";
    const projectId = body.projectId as string | undefined;
    const skillId = body.skillId as string | undefined;

    if (!interviewType || (interviewType !== "skill" && interviewType !== "project")) {
      return NextResponse.json({ error: "Invalid interview type" }, { status: 400 });
    }

    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, session.user.id))
      .limit(1);

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    let interviewContext = "";
    let skillName: string | undefined;
    let projectTitle: string | undefined;
    let resolvedProjectId: string | undefined;
    let resolvedSkillId: string | undefined;

    if (interviewType === "project") {
      if (!projectId) {
        return NextResponse.json({ error: "projectId is required" }, { status: 400 });
      }

      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      if (!project || project.resumeId !== resume.id) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      interviewContext = buildProjectContext(project);
      projectTitle = project.title;
      resolvedProjectId = project.id;
    } else {
      if (!skillId) {
        return NextResponse.json({ error: "skillId is required" }, { status: 400 });
      }

      const [skill] = await db
        .select()
        .from(skills)
        .where(eq(skills.id, skillId))
        .limit(1);

      if (!skill || skill.resumeId !== resume.id) {
        return NextResponse.json({ error: "Skill not found" }, { status: 404 });
      }

      interviewContext = buildSkillContext(skill);
      skillName = skill.name;
      resolvedSkillId = skill.id;
    }

    const topicSeed =
      interviewType === "project"
        ? (projectTitle ?? "project")
        : (skillName ?? "technical skill");

    const sessionContext: SessionContext = {
      username: session.user.name?.split(" ")[0] ?? "there",
      interviewType,
      interviewLanguage: getLanguageLabel(interviewLanguage),
      interviewContext,
      skillName,
      projectTitle,
    };

    const [voiceSession] = await db
      .insert(voiceSessions)
      .values({
        userId: session.user.id,
        interviewType,
        projectId: resolvedProjectId,
        skillId: resolvedSkillId,
        interviewLanguage,
        interviewerStyle,
        sessionContext,
        interviewState: createInitialInterviewState(topicSeed),
        status: "active",
      })
      .returning();

    const variableValues: VapiVariableValues = {
      username: sessionContext.username,
      interviewType,
      interviewLanguage: sessionContext.interviewLanguage,
      interviewContext,
      skillName,
      projectTitle,
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? null;
    const customLlmUrl = resolveCustomLlmUrl(appUrl);
    const useGroqOverride = process.env.VAPI_USE_GROQ_OVERRIDE === "true";
    const llmMode = resolveServerLlmMode(appUrl, useGroqOverride);
    const initialState = createInitialInterviewState(topicSeed);
    const fallbackSystemPrompt = buildInitialInterviewerSystemPrompt(
      sessionContext,
      interviewerStyle,
      initialState,
    );

    return NextResponse.json({
      sessionId: voiceSession.id,
      assistantId: getVapiAssistantId(),
      variableValues,
      customLlmUrl,
      llmMode,
      fallbackSystemPrompt,
      interviewerStyle,
    });
  } catch (error) {
    console.error("Voice session error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session creation failed" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { error: "Groq API key not configured — cannot summarize interview" },
      { status: 500 },
    );
  }

  try {
    const body = await request.json();
    const { sessionId, transcript, durationSec } = body;

    if (!sessionId || !transcript?.trim()) {
      return NextResponse.json(
        { error: "sessionId and transcript are required" },
        { status: 400 },
      );
    }

    const [voiceSession] = await db
      .select()
      .from(voiceSessions)
      .where(
        and(
          eq(voiceSessions.id, sessionId),
          eq(voiceSessions.userId, session.user.id),
        ),
      )
      .limit(1);

    if (!voiceSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const result = await summarizeVoiceInterview(transcript);

    const [updated] = await db
      .update(voiceSessions)
      .set({
        transcript,
        summary: result.summary,
        score: Math.round(result.score),
        durationSec,
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(voiceSessions.id, sessionId))
      .returning();

    return NextResponse.json({ session: updated });
  } catch (error) {
    console.error("Voice session update error:", error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Session update failed" },
      { status: 500 },
    );
  }
}
