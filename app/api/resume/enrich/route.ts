import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { projects, resumes } from "@/lib/db/schema";
import { enrichProjectsSchema } from "@/lib/validations/resume";

export async function PUT(request: Request) {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const body = await request.json();
    const data = enrichProjectsSchema.parse(body);

    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, session.user.id))
      .limit(1);

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    for (const item of data.projects) {
      await db
        .update(projects)
        .set({ enrichedDescription: item.enrichedDescription })
        .where(eq(projects.id, item.id));
    }

    const resumeProjects = await db
      .select()
      .from(projects)
      .where(eq(projects.resumeId, resume.id));

    return NextResponse.json({ projects: resumeProjects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enrichment failed" },
      { status: 400 },
    );
  }
}
