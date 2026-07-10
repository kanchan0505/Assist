import { notFound, redirect } from "next/navigation";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { projects } from "@/lib/db/schema";
import { InterviewPrep } from "@/components/interview/interview-prep";
import { getProjectInterviewMeta } from "@/lib/voice/interview-meta";

export default async function InterviewProjectPrepPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);
  const { projectId } = await params;

  if (!resume) redirect("/onboarding/upload");

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.resumeId, resume.id)))
    .limit(1);

  if (!project) notFound();

  const meta = getProjectInterviewMeta(project.title);

  return (
    <InterviewPrep
      interviewType="project"
      targetId={project.id}
      targetTitle={project.title}
      categoryLabel="Project deep-dive"
      description={project.enrichedDescription}
      meta={meta}
    />
  );
}
