import { createGroq } from "@ai-sdk/groq";

export const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

/** Groq models for structured JSON (resume parsing, interview summaries). */
export const MODELS = {
  structuredFast: "llama-3.3-70b-versatile",
  structuredQuality: "llama-3.3-70b-versatile",
} as const;

export function structuredFastModel() {
  return groq(MODELS.structuredFast);
}

export function structuredQualityModel() {
  return groq(MODELS.structuredQuality);
}

export function isGroqConfigured() {
  return Boolean(process.env.GROQ_API_KEY);
}
