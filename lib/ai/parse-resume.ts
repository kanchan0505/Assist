import { PARSE_RESUME_SYSTEM } from "@/lib/ai/prompts";
import { parsedResumeSchema } from "@/lib/ai/schemas";
import { generateStructured } from "@/lib/ai/generate-structured";

export async function parseResumeWithAI(rawText: string) {
  return generateStructured("fast", {
    schema: parsedResumeSchema,
    system: PARSE_RESUME_SYSTEM,
    prompt: `Parse the resume below into JSON with this shape:
{
  "skills": [{ "name": "string", "category": "language|framework|database|tool" }],
  "projects": [{ "title": "string", "description": "string" }]
}

Resume text:
${rawText.slice(0, 12000)}`,
  });
}
