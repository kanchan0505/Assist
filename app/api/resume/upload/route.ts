import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireApiAuth } from "@/lib/api-auth";
import { parseResumeWithAI } from "@/lib/ai/parse-resume";
import { isCloudinaryConfigured, uploadResumeFile } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { projects, resumes, skills } from "@/lib/db/schema";
import { extractTextFromFile } from "@/lib/resume/extract-text";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authResult = await requireApiAuth();
  if ("error" in authResult) return authResult.error;
  const { session } = authResult;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rawText = await extractTextFromFile(buffer, file.name);

    if (!rawText || rawText.length < 50) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from the file. Try a text-based PDF or DOCX.",
        },
        { status: 400 },
      );
    }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API key is not configured. Add GROQ_API_KEY to .env.local." },
        { status: 500 },
      );
    }

    let fileUrl: string | undefined;
    if (isCloudinaryConfigured()) {
      fileUrl = await uploadResumeFile(buffer, file.name, session.user.id);
    }

    const [existing] = await db
      .select()
      .from(resumes)
      .where(eq(resumes.userId, session.user.id))
      .limit(1);

    let resumeId: string;

    if (existing) {
      const [updated] = await db
        .update(resumes)
        .set({
          fileUrl: fileUrl,
          fileName: file.name,
          rawText,
          parseStatus: "processing",
          updatedAt: new Date(),
        })
        .where(eq(resumes.id, existing.id))
        .returning();
      resumeId = updated.id;

      await db.delete(skills).where(eq(skills.resumeId, resumeId));
      await db.delete(projects).where(eq(projects.resumeId, resumeId));
    } else {
      const [created] = await db
        .insert(resumes)
        .values({
          userId: session.user.id,
          fileUrl: fileUrl,
          fileName: file.name,
          rawText,
          parseStatus: "processing",
        })
        .returning();
      resumeId = created.id;
    }

    const parsed = await parseResumeWithAI(rawText);

    if (parsed.skills.length > 0) {
      await db.insert(skills).values(
        parsed.skills.map((skill) => ({
          resumeId,
          name: skill.name,
          category: skill.category,
          source: "ai" as const,
        })),
      );
    }

    if (parsed.projects.length > 0) {
      await db.insert(projects).values(
        parsed.projects.map((project) => ({
          resumeId,
          title: project.title,
          description: project.description,
          source: "ai" as const,
        })),
      );
    }

    await db
      .update(resumes)
      .set({
        parseStatus: "completed",
        parsedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(resumes.id, resumeId));

    const [resumeSkills, resumeProjects] = await Promise.all([
      db.select().from(skills).where(eq(skills.resumeId, resumeId)),
      db.select().from(projects).where(eq(projects.resumeId, resumeId)),
    ]);

    return NextResponse.json({
      resumeId,
      skills: resumeSkills,
      projects: resumeProjects,
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed. Please try again or use a DOCX file.",
      },
      { status: 500 },
    );
  }
}
