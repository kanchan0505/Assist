import { redirect } from "next/navigation";
import { requireAuth, getUserResume } from "@/lib/auth-helpers";
import { getSessionStats } from "@/lib/db/voice-queries";
import { PageHeader } from "@/components/dashboard/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function HistoryPage() {
  const session = await requireAuth();
  const resume = await getUserResume(session.user.id);
  if (!resume) redirect("/onboarding/upload");

  const stats = await getSessionStats(session.user.id);
  const sessions = stats.sessions.filter((s) => s.status === "completed");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Interview History"
        description="Review past voice mock interviews, scores, and AI summaries."
      />

      {sessions.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <p className="font-medium">No completed interviews yet</p>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Start your first AI voice interview from the Interview page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <Card key={s.id} className="border-border/60 bg-card/60">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-heading font-semibold">
                        {s.sessionContext?.skillName ??
                          s.sessionContext?.projectTitle ??
                          s.interviewType}
                      </h3>
                      <Badge variant="outline" className="capitalize">
                        {s.interviewType}
                      </Badge>
                      <Badge variant="secondary">{s.interviewerStyle}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {s.completedAt
                        ? new Date(s.completedAt).toLocaleString()
                        : new Date(s.createdAt).toLocaleString()}
                      {s.durationSec ? ` · ${Math.round(s.durationSec / 60)} min` : ""}
                    </p>
                  </div>
                  <p className="font-heading text-3xl font-bold text-primary">
                    {s.score ?? "—"}
                    <span className="text-base text-muted-foreground">/10</span>
                  </p>
                </div>
                {s.summary && (
                  <p className="mt-4 rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground">
                    {s.summary}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
