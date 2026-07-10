export type InterviewDifficulty = "Foundational" | "Intermediate" | "Advanced";

export type InterviewMeta = {
  difficulty: InterviewDifficulty;
  estimatedMinutes: number;
  questionAreas: string[];
  skillsEvaluated: string[];
  preparationTips: string[];
  focusSummary: string;
};

const SKILL_CATEGORY_META: Record<
  string,
  Omit<InterviewMeta, "skillsEvaluated">
> = {
  language: {
    difficulty: "Intermediate",
    estimatedMinutes: 20,
    questionAreas: [
      "Core syntax & semantics",
      "Memory & performance trade-offs",
      "Debugging real-world bugs",
      "Idiomatic patterns",
    ],
    preparationTips: [
      "Review fundamentals and common pitfalls for this language.",
      "Be ready to explain why you choose one approach over another.",
      "Use concrete examples from past work when possible.",
    ],
    focusSummary:
      "Conceptual and scenario-based questions that test fluency and practical judgment.",
  },
  framework: {
    difficulty: "Intermediate",
    estimatedMinutes: 25,
    questionAreas: [
      "Architecture & component design",
      "Data flow & state management",
      "Performance & rendering",
      "Testing & production readiness",
    ],
    preparationTips: [
      "Sketch how you structure apps with this framework.",
      "Prepare to discuss trade-offs you have made in real projects.",
      "Expect follow-ups on edge cases and failure modes.",
    ],
    focusSummary:
      "Hands-on framework questions covering design decisions, trade-offs, and production concerns.",
  },
  database: {
    difficulty: "Advanced",
    estimatedMinutes: 25,
    questionAreas: [
      "Schema design & normalization",
      "Query performance & indexing",
      "Transactions & consistency",
      "Scaling & reliability",
    ],
    preparationTips: [
      "Refresh indexing strategies and EXPLAIN-style reasoning.",
      "Think through consistency vs availability trade-offs.",
      "Be ready to design a schema for a familiar product.",
    ],
    focusSummary:
      "Deep-dive questions on modeling, queries, and operational database thinking.",
  },
  tool: {
    difficulty: "Foundational",
    estimatedMinutes: 15,
    questionAreas: [
      "Core workflows & mental models",
      "When to use vs alternatives",
      "Common pitfalls",
      "Team collaboration patterns",
    ],
    preparationTips: [
      "Recall how you use this tool day-to-day.",
      "Prepare a short story about a problem it helped you solve.",
      "Know its limits as well as its strengths.",
    ],
    focusSummary:
      "Practical questions on how you apply this tool in real engineering workflows.",
  },
};

const DEFAULT_SKILL_META: Omit<InterviewMeta, "skillsEvaluated"> = {
  difficulty: "Intermediate",
  estimatedMinutes: 20,
  questionAreas: [
    "Core concepts",
    "Applied problem solving",
    "Trade-offs & judgment",
    "Communication clarity",
  ],
  preparationTips: [
    "Speak in structured answers — claim, evidence, then impact.",
    "It is fine to pause and think before responding.",
    "Ask clarifying questions when a prompt is ambiguous.",
  ],
  focusSummary:
    "Conceptual and scenario-based questions tailored to this skill.",
};

const PROJECT_META: Omit<InterviewMeta, "skillsEvaluated"> = {
  difficulty: "Advanced",
  estimatedMinutes: 30,
  questionAreas: [
    "Problem framing & goals",
    "Architecture & tech choices",
    "Trade-offs & constraints",
    "Impact, metrics & learnings",
  ],
  preparationTips: [
    "Use STAR (Situation, Task, Action, Result) for project stories.",
    "Be ready to defend key technical decisions and alternatives.",
    "Quantify impact where you can — users, latency, revenue, or time saved.",
  ],
  focusSummary:
    "Defend your project decisions, trade-offs, ownership, and measurable impact.",
};

export function getSkillInterviewMeta(
  skillName: string,
  category: string,
): InterviewMeta {
  const base = SKILL_CATEGORY_META[category] ?? DEFAULT_SKILL_META;
  return {
    ...base,
    skillsEvaluated: [
      skillName,
      "Technical communication",
      "Problem decomposition",
      category === "database" ? "System thinking" : "Practical judgment",
    ],
  };
}

export function getProjectInterviewMeta(projectTitle: string): InterviewMeta {
  return {
    ...PROJECT_META,
    skillsEvaluated: [
      "System design judgment",
      "Ownership & delivery",
      "Trade-off reasoning",
      projectTitle.length > 40 ? "Project storytelling" : projectTitle,
    ],
  };
}
