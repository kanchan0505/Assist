import { z } from "zod";

export const skillCategorySchema = z.enum([
  "language",
  "framework",
  "database",
  "tool",
]);

export const parsedResumeSchema = z.object({
  skills: z
    .array(
      z.object({
        name: z.string(),
        category: skillCategorySchema,
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        title: z.string(),
        description: z.string().default(""),
      }),
    )
    .default([]),
});

export type ParsedResume = z.infer<typeof parsedResumeSchema>;
