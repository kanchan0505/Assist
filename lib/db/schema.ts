import {
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const skillCategoryEnum = pgEnum("skill_category", [
  "language",
  "framework",
  "database",
  "tool",
]);

export const sourceEnum = pgEnum("source", ["ai", "manual", "seed"]);

export const parseStatusEnum = pgEnum("parse_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const questionSetCategoryEnum = pgEnum("question_set_category", [
  "language",
  "framework",
  "database",
  "project",
]);

export const voiceInterviewTypeEnum = pgEnum("voice_interview_type", [
  "skill",
  "project",
]);

export const voiceSessionStatusEnum = pgEnum("voice_session_status", [
  "active",
  "completed",
  "failed",
]);

export const interviewerStyleEnum = pgEnum("interviewer_style", [
  "supportive",
  "balanced",
  "strict",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  }),
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (verificationToken) => ({
    compositePk: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token],
    }),
  }),
);

export const resumes = pgTable("resumes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  fileUrl: text("file_url"),
  fileName: text("file_name"),
  rawText: text("raw_text"),
  parseStatus: parseStatusEnum("parse_status").default("pending").notNull(),
  parsedAt: timestamp("parsed_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: skillCategoryEnum("category").notNull(),
  source: sourceEnum("source").default("manual").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  enrichedDescription: text("enriched_description"),
  source: sourceEnum("source").default("manual").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const questionSets = pgTable("question_sets", {
  id: uuid("id").primaryKey().defaultRandom(),
  resumeId: uuid("resume_id")
    .notNull()
    .references(() => resumes.id, { onDelete: "cascade" }),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  category: questionSetCategoryEnum("category").notNull(),
  skillName: text("skill_name"),
  generatedAt: timestamp("generated_at", { mode: "date" }).defaultNow().notNull(),
});

export const questions = pgTable("questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionSetId: uuid("question_set_id")
    .notNull()
    .references(() => questionSets.id, { onDelete: "cascade" }),
  prompt: text("prompt").notNull(),
  order: integer("order").notNull(),
  source: sourceEnum("source").default("ai").notNull(),
});

export const sampleAnswers = pgTable("sample_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" })
    .unique(),
  answer: text("answer").notNull(),
  explanation: text("explanation").notNull(),
  improvementTips: text("improvement_tips"),
});

export const userAnswers = pgTable("user_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  questionId: uuid("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull(),
  aiScore: integer("ai_score"),
  aiFeedback: jsonb("ai_feedback").$type<{
    strengths?: string[];
    gaps?: string[];
    improvedAnswer?: string;
    followUpTopics?: string[];
    summary?: string;
  }>(),
  submittedAt: timestamp("submitted_at", { mode: "date" }).defaultNow().notNull(),
});

export const voiceSessions = pgTable("voice_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  interviewType: voiceInterviewTypeEnum("interview_type").notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
  skillId: uuid("skill_id").references(() => skills.id, {
    onDelete: "cascade",
  }),
  interviewLanguage: text("interview_language").default("en").notNull(),
  interviewerStyle: interviewerStyleEnum("interviewer_style")
    .default("balanced")
    .notNull(),
  sessionContext: jsonb("session_context").$type<{
    username: string;
    interviewType: "skill" | "project";
    interviewLanguage: string;
    interviewContext: string;
    skillName?: string;
    projectTitle?: string;
  }>(),
  interviewState: jsonb("interview_state").$type<{
    exchangeCount: number;
    dontKnowStreak: number;
    hintsGiven: number;
    skipsUsed: number;
    currentTopic: string;
    skippedTopics: string[];
    weakAreas: string[];
    hintsByTopic: Record<string, number>;
    recentPhrases: string[];
    questionsAsked: number;
    lastIntent?: string;
  }>(),
  transcript: text("transcript"),
  summary: text("summary"),
  score: integer("score"),
  durationSec: integer("duration_sec"),
  status: voiceSessionStatusEnum("status").default("active").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  completedAt: timestamp("completed_at", { mode: "date" }),
});

export type User = typeof users.$inferSelect;
export type Resume = typeof resumes.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type QuestionSet = typeof questionSets.$inferSelect;
export type Question = typeof questions.$inferSelect;
export type SampleAnswer = typeof sampleAnswers.$inferSelect;
export type UserAnswer = typeof userAnswers.$inferSelect;
export type VoiceSession = typeof voiceSessions.$inferSelect;
