import type { VapiVariableValues } from "@/lib/vapi/vapi.sdk";
import { getCondensedInterviewGuidelines } from "@/lib/voice/interviewer-prompt";
import type { VapiLlmMode } from "@/lib/voice/llm-mode";

const DEEPGRAM_LANGUAGE: Record<string, string> = {
  en: "en",
  hi: "hi",
  es: "es",
  fr: "fr",
  de: "de",
};

export function buildVapiStartOverrides(options: {
  sessionId: string;
  variableValues: VapiVariableValues;
  llmMode: VapiLlmMode;
  customLlmUrl: string | null;
  fallbackSystemPrompt: string;
  interviewLanguage: string;
}) {
  const variableValues = {
    ...options.variableValues,
    sessionId: options.sessionId,
    interviewGuidelines: getCondensedInterviewGuidelines(),
  };

  const overrides: Record<string, unknown> = {
    variableValues,
    metadata: { sessionId: options.sessionId },
    maxDurationSeconds: 1800,
    backgroundSound: "off",
  };

  if (options.llmMode === "custom" && options.customLlmUrl) {
    overrides.model = {
      provider: "custom-llm",
      url: options.customLlmUrl,
      model: "resume-interview-interviewer",
      metadataSendMode: "variable",
      timeoutSeconds: 30,
    };
  } else if (options.llmMode === "groq") {
    overrides.model = {
      provider: "groq",
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: options.fallbackSystemPrompt }],
      temperature: 0.75,
      maxTokens: 300,
    };
  }

  const deepgramLang = DEEPGRAM_LANGUAGE[options.interviewLanguage];
  if (deepgramLang && deepgramLang !== "en") {
    overrides.transcriber = {
      provider: "deepgram",
      model: "nova-2-general",
      language: deepgramLang,
    };
  }

  return overrides;
}
