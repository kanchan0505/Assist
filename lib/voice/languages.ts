export const INTERVIEW_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
] as const;

export type InterviewLanguage = (typeof INTERVIEW_LANGUAGES)[number]["value"];

export function getLanguageLabel(code: string) {
  return INTERVIEW_LANGUAGES.find((l) => l.value === code)?.label ?? code;
}
