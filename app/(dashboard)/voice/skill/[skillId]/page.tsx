import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { InterviewRoom } from "@/components/interview/interview-room";
import { PageHeader } from "@/components/dashboard/page-header";
import { buttonVariants } from "@/components/ui/button";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { skills } from "@/lib/db/schema";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function VoiceSkillPage({
  params,
  searchParams,
}: {
  params: Promise<{ skillId: string }>;
  searchParams: Promise<{ lang?: string; style?: string }>;
}) {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);
  const { skillId } = await params;
  const { lang, style } = await searchParams;

  if (!resume) redirect("/onboarding/upload");

  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, skillId), eq(skills.resumeId, resume.id)))
    .limit(1);

  if (!skill) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Interview Room"
        description={`Technical skill interview — ${skill.name} (${skill.category})`}
      >
        <Link href="/interview" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="mr-2 size-4" />
          Back
        </Link>
      </PageHeader>
      <InterviewRoom
        interviewType="skill"
        targetId={skill.id}
        targetTitle={skill.name}
        interviewLanguage={lang ?? "en"}
        interviewerStyle={style ?? "balanced"}
      />
    </div>
  );
}
