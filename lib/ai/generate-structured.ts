import { generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { extractJsonFromText } from "@/lib/ai/json-utils";
import {
  structuredFastModel,
  structuredQualityModel,
} from "@/lib/ai/client";

type StructuredModel = "fast" | "quality";

type GenerateStructuredOptions<T extends z.ZodTypeAny> = {
  schema: T;
  system?: string;
  prompt: string;
};

function getStructuredModel(tier: StructuredModel): LanguageModel {
  return tier === "fast" ? structuredFastModel() : structuredQualityModel();
}

export async function generateStructured<T extends z.ZodTypeAny>(
  tier: StructuredModel,
  options: GenerateStructuredOptions<T>,
): Promise<z.infer<T>> {
  const model = getStructuredModel(tier);
  const system = [
    options.system,
    "Respond with valid JSON only. No markdown code fences. No extra commentary.",
    "CRITICAL: If you use double quotes inside JSON string values, you MUST escape them with a backslash (e.g. \\\"like this\\\"). Never include unescaped double quotes inside JSON string values.",
  ]
    .filter(Boolean)
    .join("\n\n");

  let lastError = "Unknown JSON parse error";

  for (let attempt = 0; attempt < 3; attempt++) {
    const { text } = await generateText({
      model,
      system,
      prompt: `${options.prompt}

Output raw JSON only.`,
    });

    const raw = extractJsonFromText(text);
    if (!raw) {
      lastError = "Model did not return parseable JSON";
      continue;
    }

    const result = options.schema.safeParse(raw);
    if (result.success) {
      return result.data;
    }

    lastError = result.error.message;
  }

  throw new Error(`Failed to validate JSON: ${lastError}`);
}
