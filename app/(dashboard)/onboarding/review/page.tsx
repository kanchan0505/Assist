import { redirect } from "next/navigation";
import { ResumeReviewForm } from "@/components/resume/resume-review-form";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects, skills } from "@/lib/db/schema";

export default async function ReviewPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);

  if (!resume) {
    redirect("/onboarding/upload");
  }

  const [resumeSkills, resumeProjects] = await Promise.all([
    db.select().from(skills).where(eq(skills.resumeId, resume.id)),
    db.select().from(projects).where(eq(projects.resumeId, resume.id)),
  ]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Review extracted data</h1>
        <p className="mt-2 text-muted-foreground">
          Step 2 of 3 — Edit skills and projects before generating questions
        </p>
      </div>
      <ResumeReviewForm
        initialSkills={resumeSkills}
        initialProjects={resumeProjects}
      />
    </div>
  );
}
