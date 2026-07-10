import { skillCategorySchema } from "@/lib/ai/schemas";
import { z } from "zod";

export const skillInputSchema = z.object({
  name: z.string().min(1),
  category: skillCategorySchema,
});

export const projectInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  enrichedDescription: z.string().optional(),
});

export const resumeReviewSchema = z.object({
  skills: z.array(skillInputSchema),
  projects: z.array(projectInputSchema),
});

export const answerSubmissionSchema = z.object({
  questionId: z.string().uuid(),
  userAnswer: z.string().min(1),
});

export const enrichProjectsSchema = z.object({
  projects: z.array(
    z.object({
      id: z.string().uuid(),
      enrichedDescription: z.string().min(10),
    }),
  ),
});
