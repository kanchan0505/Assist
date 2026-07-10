import type { TalkingHead } from "@met4citizen/talkinghead/modules/talkinghead.mjs";

export type VisemePayload = {
  visemes: string[];
  vtimes: number[];
  vdurations: number[];
};

const SUPPORTED_LIPSYNC_LANGS = new Set(["en", "de", "fi", "fr", "lt"]);

export function resolveLipsyncLang(interviewLanguage: string): string {
  const code = interviewLanguage.split("-")[0]?.toLowerCase() ?? "en";
  return SUPPORTED_LIPSYNC_LANGS.has(code) ? code : "en";
}

export function textToVisemePayload(
  head: TalkingHead,
  text: string,
  lipsyncLang: string,
): VisemePayload | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const processed = head.lipsyncPreProcessText(trimmed, lipsyncLang);
  const val = head.lipsyncWordsToVisemes(processed, lipsyncLang);
  if (!val?.visemes?.length) return null;

  return {
    visemes: val.visemes,
    vtimes: val.times,
    vdurations: val.durations,
  };
}

export function scaleVisemePayload(
  payload: VisemePayload,
  scale: number,
): VisemePayload {
  if (scale <= 0 || !Number.isFinite(scale) || scale === 1) return payload;

  return {
    visemes: payload.visemes,
    vtimes: payload.vtimes.map((t) => t * scale),
    vdurations: payload.vdurations.map((d) => d * scale),
  };
}

export function estimateSpeechScale(text: string, lipsyncLang: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words === 0) return 1;

  const wpm = lipsyncLang === "en" ? 150 : 130;
  const estimatedMs = (words / wpm) * 60_000;
  const baselineMs = Math.max(words * 180, 1200);
  return Math.min(2.2, Math.max(0.85, estimatedMs / baselineMs));
}
