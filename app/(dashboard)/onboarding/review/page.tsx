import { redirect } from "next/navigation";
import { ResumeReviewForm } from "@/components/resume/resume-review-form";
import { PageHeader } from "@/components/dashboard/page-header";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects, skills } from "@/lib/db/schema";

export default async function ReviewPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);

  if (!resume) redirect("/onboarding/upload");

  const [resumeSkills, resumeProjects] = await Promise.all([
    db.select().from(skills).where(eq(skills.resumeId, resume.id)),
    db.select().from(projects).where(eq(projects.resumeId, resume.id)),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <PageHeader
        title="Review extracted data"
        description="Step 2 of 2 — Edit skills and projects, then start practicing interviews."
      />
      <ResumeReviewForm
        initialSkills={resumeSkills}
        initialProjects={resumeProjects}
      />
    </div>
  );
}
