import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { projects, resumes, skills } from "@/lib/db/schema";

export async function getResumeWithDetails(resumeId: string) {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.id, resumeId))
    .limit(1);

  if (!resume) return null;

  const [resumeSkills, resumeProjects] = await Promise.all([
    db.select().from(skills).where(eq(skills.resumeId, resumeId)),
    db.select().from(projects).where(eq(projects.resumeId, resumeId)),
  ]);

  return { resume, skills: resumeSkills, projects: resumeProjects };
}

export async function getProjectById(projectId: string, resumeId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.resumeId, resumeId)))
    .limit(1);
  return project ?? null;
}

export async function getSkillById(skillId: string, resumeId: string) {
  const [skill] = await db
    .select()
    .from(skills)
    .where(and(eq(skills.id, skillId), eq(skills.resumeId, resumeId)))
    .limit(1);
  return skill ?? null;
}
