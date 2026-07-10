import { notFound, redirect } from "next/navigation";
import { VoiceInterviewPanel } from "@/components/voice/voice-interview-panel";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { projects } from "@/lib/db/schema";

export default async function VoiceProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ lang?: string; style?: string }>;
}) {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);
  const { projectId } = await params;
  const { lang, style } = await searchParams;

  if (!resume) {
    redirect("/onboarding/upload");
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.resumeId, resume.id)))
    .limit(1);

  if (!project) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Voice Interview</h1>
        <p className="mt-2 text-muted-foreground">
          Defend <strong>{project.title}</strong> with follow-up questions from a
          live AI interviewer.
        </p>
      </div>
      <VoiceInterviewPanel
        interviewType="project"
        targetId={project.id}
        targetTitle={project.title}
        interviewLanguage={lang ?? "en"}
        interviewerStyle={style ?? "balanced"}
      />
    </div>
  );
}
