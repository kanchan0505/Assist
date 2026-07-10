import { z } from "zod";
import { generateStructured } from "@/lib/ai/generate-structured";

const voiceSummarySchema = z.object({
  summary: z.string().min(1),
  score: z.number().min(1).max(10),
  strengths: z.array(z.string()).default([]),
  improvements: z.array(z.string()).default([]),
});

export type VoiceSummary = z.infer<typeof voiceSummarySchema>;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function toScore(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return Math.min(10, Math.max(1, Math.round(value)));
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return Math.min(10, Math.max(1, Math.round(parsed)));
    }
  }
  return null;
}

function normalizeVoiceSummaryRaw(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;

  const record = raw as Record<string, unknown>;

  const nested = record.evaluation ?? record.result ?? record.data ?? record.interview_summary;
  const merged =
    nested && typeof nested === "object"
      ? { ...record, ...(nested as Record<string, unknown>) }
      : record;

  const summary =
    merged.summary ??
    merged.overall_summary ??
    merged.overallSummary ??
    merged.feedback ??
    merged.assessment ??
    merged.evaluation;

  const score = toScore(
    merged.score ?? merged.rating ?? merged.overall_score ?? merged.overallScore,
  );

  const strengths = toStringArray(
    merged.strengths ?? merged.strength ?? merged.positives ?? merged.what_went_well,
  );

  const improvements = toStringArray(
    merged.improvements ??
      merged.weaknesses ??
      merged.gaps ??
      merged.areas_to_improve ??
      merged.areasForImprovement ??
      merged.areas_for_improvement,
  );

  return { summary, score, strengths, improvements };
}

const voiceSummarySchemaWithNormalize = z.preprocess(
  normalizeVoiceSummaryRaw,
  voiceSummarySchema,
);

export async function summarizeVoiceInterview(transcript: string): Promise<VoiceSummary> {
  const trimmedTranscript = transcript.trim();
  if (!trimmedTranscript) {
    throw new Error("Transcript is empty — cannot generate interview summary");
  }

  const clippedTranscript = trimmedTranscript.slice(0, 12_000);

  return generateStructured("quality", {
    schema: voiceSummarySchemaWithNormalize,
    system:
      "You evaluate technical mock interview transcripts. Return exactly one JSON object with the required keys.",
    prompt: `Analyze this mock technical interview transcript and return JSON with EXACTLY these keys:
{
  "summary": "2-4 sentence overall performance summary as a string",
  "score": 7,
  "strengths": ["strength one", "strength two"],
  "improvements": ["area to improve one", "area to improve two"]
}

Rules:
- "summary" MUST be a non-empty string
- "score" MUST be a number from 1 to 10 (integer)
- "strengths" MUST be an array of strings (use [] if none)
- "improvements" MUST be an array of strings (use [] if none)
- Do not omit any key
- Do not use markdown fences

Transcript:
${clippedTranscript}`,
  });
}
