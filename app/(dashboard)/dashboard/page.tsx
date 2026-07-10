import { redirect } from "next/navigation";
import { VoiceInterviewHub } from "@/components/voice/voice-interview-hub";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects, skills } from "@/lib/db/schema";

export default async function DashboardPage() {
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Interview Dashboard</h1>
        <p className="mt-2 text-muted-foreground">
          Welcome back{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}.
          Choose a topic and start a voice mock interview.
        </p>
      </div>

      <VoiceInterviewHub skills={resumeSkills} projects={resumeProjects} />
    </div>
  );
}
