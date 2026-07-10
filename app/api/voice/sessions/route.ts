import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { getSessionStats } from "@/lib/db/voice-queries";

export async function GET() {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;

  const stats = await getSessionStats(authResult.session.user.id);

  return NextResponse.json({
    totalSessions: stats.totalSessions,
    completedSessions: stats.completedSessions,
    averageScore: stats.averageScore,
    totalMinutes: stats.totalMinutes,
    sessions: stats.sessions.map((s) => ({
      id: s.id,
      interviewType: s.interviewType,
      skillId: s.skillId,
      projectId: s.projectId,
      interviewLanguage: s.interviewLanguage,
      interviewerStyle: s.interviewerStyle,
      score: s.score,
      summary: s.summary,
      durationSec: s.durationSec,
      status: s.status,
      createdAt: s.createdAt,
      completedAt: s.completedAt,
      sessionContext: s.sessionContext,
    })),
  });
}
