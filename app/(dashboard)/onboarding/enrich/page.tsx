import { redirect } from "next/navigation";
import { ProjectEnrichForm } from "@/components/resume/project-enrich-form";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects } from "@/lib/db/schema";

export default async function EnrichPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);

  if (!resume) {
    redirect("/onboarding/upload");
  }

  const resumeProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.resumeId, resume.id));

  if (resumeProjects.length === 0) {
    redirect("/onboarding/review");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Enrich your projects</h1>
        <p className="mt-2 text-muted-foreground">
          Step 3 of 3 — Help the AI voice interviewer ask better project questions
        </p>
      </div>
      <ProjectEnrichForm projects={resumeProjects} />
    </div>
  );
}
