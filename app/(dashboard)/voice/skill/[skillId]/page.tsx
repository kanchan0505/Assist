import { notFound, redirect } from "next/navigation";
import { VoiceInterviewPanel } from "@/components/voice/voice-interview-panel";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { skills } from "@/lib/db/schema";

export default async function VoiceSkillPage({
  params,
  searchParams,
}: {
  params: Promise<{ skillId: string }>;
  searchParams: Promise<{ lang?: string; style?: string }>;
}) {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);
  const { skillId } = await params;
  const { lang, style } = await searchParams;

  if (!resume) {
    redirect("/onboarding/upload");
  }

  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, skillId), eq(skills.resumeId, resume.id)))
    .limit(1);

  if (!skill) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Skill Voice Interview</h1>
        <p className="mt-2 text-muted-foreground">
          Technical questions about <strong>{skill.name}</strong> ({skill.category}).
        </p>
      </div>
      <VoiceInterviewPanel
        interviewType="skill"
        targetId={skill.id}
        targetTitle={skill.name}
        interviewLanguage={lang ?? "en"}
        interviewerStyle={style ?? "balanced"}
      />
    </div>
  );
}
