import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { InterviewRoom } from "@/components/interview/interview-room";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { projects } from "@/lib/db/schema";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

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

  if (!resume) redirect("/onboarding/upload");

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.resumeId, resume.id)))
    .limit(1);

  if (!project) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Room"
        description={`Project deep-dive — ${project.title}`}
      >
        <Link href="/interview" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Link>
      </PageHeader>
      <InterviewRoom
        interviewType="project"
        targetId={project.id}
        targetTitle={project.title}
        interviewLanguage={lang ?? "en"}
        interviewerStyle={style ?? "balanced"}
      />
    </div>
  );
}
