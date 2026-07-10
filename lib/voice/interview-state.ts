import type { InterviewIntent } from "@/lib/voice/intent-classifier";

export type InterviewState = {
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
  lastIntent?: InterviewIntent;
};

export type SessionContext = {
  username: string;
  interviewType: "skill" | "project";
  interviewLanguage: string;
  interviewContext: string;
  skillName?: string;
  projectTitle?: string;
};

export function createInitialInterviewState(topic: string): InterviewState {
  return {
    exchangeCount: 0,
    dontKnowStreak: 0,
    hintsGiven: 0,
    skipsUsed: 0,
    currentTopic: topic,
    skippedTopics: [],
    weakAreas: [],
    hintsByTopic: {},
    recentPhrases: [],
    questionsAsked: 0,
  };
}

export function updateInterviewState(
  state: InterviewState,
  intent: InterviewIntent,
  topic: string,
  acknowledgment: string,
): InterviewState {
  const next: InterviewState = {
    ...state,
    exchangeCount: state.exchangeCount + 1,
    lastIntent: intent,
    currentTopic: topic,
    recentPhrases: [...state.recentPhrases, acknowledgment].slice(-6),
  };

  if (intent === "dont_know") {
    next.dontKnowStreak = state.dontKnowStreak + 1;
    if (next.dontKnowStreak >= 2 && !next.weakAreas.includes(topic)) {
      next.weakAreas = [...next.weakAreas, topic];
    }
  } else {
    next.dontKnowStreak = 0;
  }

  if (intent === "hint_request") {
    next.hintsGiven = state.hintsGiven + 1;
    next.hintsByTopic = {
      ...state.hintsByTopic,
      [topic]: (state.hintsByTopic[topic] ?? 0) + 1,
    };
  }

  if (intent === "skip_request") {
    next.skipsUsed = state.skipsUsed + 1;
    if (!next.skippedTopics.includes(topic)) {
      next.skippedTopics = [...next.skippedTopics, topic];
    }
  }

  if (
    intent === "strong_answer" ||
    intent === "normal_answer" ||
    intent === "partial_answer"
  ) {
    next.questionsAsked = state.questionsAsked + 1;
  }

  return next;
}

export function shouldPivotTopic(state: InterviewState, style: string): boolean {
  if (state.dontKnowStreak >= 3) return true;
  if (state.weakAreas.length >= 2 && state.dontKnowStreak >= 2) return true;
  if (style === "strict" && state.dontKnowStreak >= 2) return true;
  if (style === "supportive" && state.dontKnowStreak >= 3) return true;
  return false;
}

export function formatStateForPrompt(state: InterviewState): string {
  return [
    `Exchanges so far: ${state.exchangeCount}`,
    `Current topic: ${state.currentTopic}`,
    `"I don't know" streak: ${state.dontKnowStreak}`,
    `Hints given (total): ${state.hintsGiven}`,
    `Skips used: ${state.skipsUsed}`,
    state.skippedTopics.length
      ? `Skipped topics: ${state.skippedTopics.join(", ")}`
      : null,
    state.weakAreas.length ? `Weak areas detected: ${state.weakAreas.join(", ")}` : null,
    state.hintsByTopic[state.currentTopic]
      ? `Hints on current topic: ${state.hintsByTopic[state.currentTopic]}`
      : null,
    shouldPivotTopic(state, "balanced")
      ? "RECOMMENDATION: Consider pivoting to a new topic or wrapping up this line of questioning."
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}
