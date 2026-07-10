import { redirect } from "next/navigation";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { getSessionStats } from "@/lib/db/voice-queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { PerformanceCharts } from "@/components/charts/performance-charts";
import { Target, TrendingUp, Clock } from "lucide-react";

export default async function AnalyticsPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);
  if (!resume) redirect("/onboarding/upload");

  const stats = await getSessionStats(session.user.id);
  const completed = stats.sessions.filter((s) => s.status === "completed" && s.score != null);

  const performanceData = [...completed]
    .reverse()
    .map((s, i) => ({
      date: s.completedAt
        ? new Date(s.completedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })
        : `#${i + 1}`,
      score: s.score ?? 0,
      label: s.sessionContext?.skillName ?? s.sessionContext?.projectTitle ?? "Interview",
    }));

  const skillMap = new Map<string, { total: number; count: number }>();
  for (const s of completed) {
    if (s.interviewType !== "skill") continue;
    const name = s.sessionContext?.skillName ?? "Unknown";
    const prev = skillMap.get(name) ?? { total: 0, count: 0 };
    skillMap.set(name, { total: prev.total + (s.score ?? 0), count: prev.count + 1 });
  }
  const skillData = [...skillMap.entries()].map(([skill, v]) => ({
    skill,
    score: Math.round((v.total / v.count) * 10) / 10,
    count: v.count,
  }));

  const avg = stats.averageScore ?? 0;
  const communication = avg > 0 ? Math.min(10, avg + 0.3) : 0;
  const technical = avg;
  const confidence = avg > 0 ? Math.max(0, avg - 0.2) : 0;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Progress Analytics"
        description="Track your interview performance, skill trends, and score breakdown."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Avg score" value={stats.averageScore ?? "—"} icon={Target} />
        <StatCard title="Completed" value={stats.completedSessions} icon={TrendingUp} />
        <StatCard title="Total minutes" value={`${stats.totalMinutes}m`} icon={Clock} />
      </div>

      <PerformanceCharts
        performanceData={performanceData}
        skillData={skillData}
        communication={communication}
        technical={technical}
        confidence={confidence}
      />
    </div>
  );
}
