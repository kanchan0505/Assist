import { redirect } from "next/navigation";
import { ProjectEnrichForm } from "@/components/resume/project-enrich-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects } from "@/lib/db/schema";

export default async function EnrichPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);

  if (!resume) redirect("/onboarding/upload");

  const resumeProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.resumeId, resume.id));

  if (resumeProjects.length === 0) redirect("/onboarding/review");

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Enrich your projects"
        description="Step 3 of 3 — Add context so the AI asks sharper project questions."
      />
      <ProjectEnrichForm projects={resumeProjects} />
    </div>
  );
}
