import { redirect } from "next/navigation";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects, skills } from "@/lib/db/schema";
import { PageHeader } from "@/components/dashboard/page-header";
import { VoiceInterviewHub } from "@/components/voice/voice-interview-hub";

export default async function InterviewPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);

  if (!resume || resume.parseStatus !== "completed") {
    redirect("/onboarding/upload");
  }

  const [resumeSkills, resumeProjects] = await Promise.all([
    db.select().from(skills).where(eq(skills.resumeId, resume.id)),
    db.select().from(projects).where(eq(projects.resumeId, resume.id)),
  ]);

  if (resumeSkills.length === 0 && resumeProjects.length === 0) {
    redirect("/onboarding/review");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="AI Voice Interview"
        description="Select a skill or project, configure your session, and start a live voice mock interview."
      />
      <VoiceInterviewHub skills={resumeSkills} projects={resumeProjects} />
    </div>
  );
}
