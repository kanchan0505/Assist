import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { skills, voiceSessions } from "@/lib/db/schema";

export async function getUserVoiceSessions(userId: string) {
  return db
    .select()
    .from(voiceSessions)
    .where(eq(voiceSessions.userId, userId))
    .orderBy(desc(voiceSessions.createdAt));
}

export async function getSessionStats(userId: string) {
  const sessions = await getUserVoiceSessions(userId);
  const completed = sessions.filter((s) => s.status === "completed");
  const scores = completed.map((s) => s.score).filter((s): s is number => s != null);

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    averageScore:
      scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : null,
    totalMinutes: Math.round(
      completed.reduce((sum, s) => sum + (s.durationSec ?? 0), 0) / 60,
    ),
    sessions,
  };
}

export async function getSkillNameMap(resumeId: string) {
  const rows = await db
    .select({ id: skills.id, name: skills.name })
    .from(skills)
    .where(eq(skills.resumeId, resumeId));
  return Object.fromEntries(rows.map((r) => [r.id, r.name]));
}
