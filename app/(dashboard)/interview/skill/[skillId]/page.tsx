import { notFound, redirect } from "next/navigation";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { skills } from "@/lib/db/schema";
import { InterviewPrep } from "@/components/interview/interview-prep";
import { getSkillInterviewMeta } from "@/lib/voice/interview-meta";

export default async function InterviewSkillPrepPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);
  const { skillId } = await params;

  if (!resume) redirect("/onboarding/upload");

  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, skillId), eq(skills.resumeId, resume.id)))
    .limit(1);

  if (!skill) notFound();

  const meta = getSkillInterviewMeta(skill.name, skill.category);

  return (
    <InterviewPrep
      interviewType="skill"
      targetId={skill.id}
      targetTitle={skill.name}
      categoryLabel={`${skill.category} · Technical skill`}
      meta={meta}
    />
  );
}
