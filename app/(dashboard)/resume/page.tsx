import { redirect } from "next/navigation";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { getResumeWithDetails } from "@/lib/db/queries";
import { ResumeProfileClient } from "@/components/dashboard/resume-profile";

export default async function ResumePage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);

  if (!resume) {
    redirect("/onboarding/upload");
  }

  const details = await getResumeWithDetails(resume.id);
  if (!details) redirect("/onboarding/upload");

  return (
    <ResumeProfileClient
      initial={{
        resume: {
          id: details.resume.id,
          fileName: details.resume.fileName,
          parseStatus: details.resume.parseStatus,
          updatedAt: details.resume.updatedAt,
        },
        skills: details.skills,
        projects: details.projects,
      }}
    />
  );
}
