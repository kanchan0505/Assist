import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session;
}

export async function getUserResume(userId: string) {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .limit(1);
  return resume ?? null;
}

export async function requireResume(userId: string) {
  const resume = await getUserResume(userId);
  if (!resume) {
    redirect("/onboarding/upload");
  }
  return resume;
}
