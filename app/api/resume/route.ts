import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { projects, resumes, skills } from "@/lib/db/schema";
import { resumeReviewSchema } from "@/lib/validations/resume";

export async function GET() {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  const [resume] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, session.user.id))
    .limit(1);

  if (!resume) {
    return NextResponse.json({ resume: null, skills: [], projects: [] });
  }

  const [resumeSkills, resumeProjects] = await Promise.all([
    db.select().from(skills).where(eq(skills.resumeId, resume.id)),
    db.select().from(projects).where(eq(projects.resumeId, resume.id)),
  ]);

  return NextResponse.json({
    resume,
    skills: resumeSkills,
    projects: resumeProjects,
  });
}

export async function PUT(request: Request) {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const body = await request.json();
    const data = resumeReviewSchema.parse(body);

    const [resume] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, session.user.id))
      .limit(1);

    if (!resume) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    await db.delete(skills).where(eq(skills.resumeId, resume.id));
    await db.delete(projects).where(eq(projects.resumeId, resume.id));

    if (data.skills.length > 0) {
      await db.insert(skills).values(
        data.skills.map((skill) => ({
          resumeId: resume.id,
          name: skill.name,
          category: skill.category,
          source: "manual" as const,
        })),
      );
    }

    if (data.projects.length > 0) {
      await db.insert(projects).values(
        data.projects.map((project) => ({
          resumeId: resume.id,
          title: project.title,
          description: project.description,
          enrichedDescription: project.enrichedDescription,
          source: "manual" as const,
        })),
      );
    }

    const [resumeSkills, resumeProjects] = await Promise.all([
      db.select().from(skills).where(eq(skills.resumeId, resume.id)),
      db.select().from(projects).where(eq(projects.resumeId, resume.id)),
    ]);

    return NextResponse.json({
      skills: resumeSkills,
      projects: resumeProjects,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}

export async function DELETE() {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;

  const [resume] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, authResult.session.user.id))
    .limit(1);

  if (!resume) {
    return NextResponse.json({ error: "Resume not found" }, { status: 404 });
  }

  await db.delete(resumes).where(eq(resumes.id, resume.id));

  return NextResponse.json({ success: true });
}
