import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { getSessionStats } from "@/lib/db/voice-queries";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { projects, skills } from "@/lib/db/schema";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Clock, Mic, Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);

  if (!resume || resume.parseStatus !== "completed") {
    redirect("/onboarding/upload");
  }

  const [resumeSkills, resumeProjects, stats] = await Promise.all([
    db.select().from(skills).where(eq(skills.resumeId, resume.id)),
    db.select().from(projects).where(eq(projects.resumeId, resume.id)),
    getSessionStats(session.user.id),
  ]);

  if (resumeSkills.length === 0 && resumeProjects.length === 0) {
    redirect("/onboarding/review");
  }

  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const recent = stats.sessions.filter((s) => s.status === "completed").slice(0, 3);

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your AI interview command center — track progress and start your next session."
      >
        <Link href="/interview" className={cn(buttonVariants())}>
          <Mic className="mr-2 size-4" />
          Open Interview Studio
        </Link>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total interviews"
          value={stats.completedSessions}
          subtitle={`${stats.totalSessions} started`}
          icon={Mic}
        />
        <StatCard
          title="Average score"
          value={stats.averageScore ?? "—"}
          subtitle={stats.averageScore ? "Out of 10" : "Complete a session"}
          icon={Target}
        />
        <StatCard
          title="Practice time"
          value={`${stats.totalMinutes}m`}
          subtitle="Voice interview minutes"
          icon={Clock}
        />
        <StatCard
          title="Resume topics"
          value={resumeSkills.length + resumeProjects.length}
          subtitle={`${resumeSkills.length} skills · ${resumeProjects.length} projects`}
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="font-heading">Quick start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Jump into a voice mock interview tailored to your resume.
            </p>
            <Link href="/interview" className={cn(buttonVariants(), "w-full sm:w-auto")}>
              Choose interview topic <ArrowRight className="ml-2 size-4" />
            </Link>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60">
          <CardHeader>
            <CardTitle className="font-heading">Recent sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No completed interviews yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-border/50 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {s.sessionContext?.skillName ??
                          s.sessionContext?.projectTitle ??
                          s.interviewType}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.completedAt
                          ? new Date(s.completedAt).toLocaleDateString()
                          : "—"}
                      </p>
                    </div>
                    <span className="font-heading text-lg font-bold text-primary">
                      {s.score ?? "—"}/10
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/history" className={cn(buttonVariants({ variant: "ghost" }), "mt-4 px-0")}>
              View all history →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
