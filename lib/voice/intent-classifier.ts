import { z } from "zod";
import { generateStructured } from "@/lib/ai/generate-structured";

export const interviewIntentSchema = z.enum([
  "partial_answer",
  "confidently_wrong",
  "hint_request",
  "guessing",
  "misunderstood_question",
  "repeat_question",
  "simpler_question",
  "partial_multi_part",
  "short_answer",
  "rambling",
  "thinking_pause",
  "needs_time",
  "nervous",
  "frustrated",
  "overconfident",
  "skip_request",
  "dont_know",
  "strong_answer",
  "textbook_answer",
  "contradiction",
  "off_topic",
  "meta_logistics",
  "technical_hiccup",
  "candidate_question",
  "normal_answer",
]);

export type InterviewIntent = z.infer<typeof interviewIntentSchema>;

const classificationSchema = z.object({
  intent: interviewIntentSchema,
  confidence: z.number().min(0).max(1),
  topic: z.string(),
});

export async function classifyCandidateIntent(
  userMessage: string,
  recentContext: string,
  currentTopic: string,
): Promise<{ intent: InterviewIntent; topic: string }> {
  const result = await generateStructured("fast", {
    schema: classificationSchema,
    prompt: `Classify the candidate's latest utterance in a technical mock interview.

Current interview topic: ${currentTopic}

Recent conversation (last few turns):
${recentContext || "(start of interview)"}

Candidate's latest message:
"${userMessage}"

Pick the single best intent:
- partial_answer: half-right or fuzzy
- confidently_wrong: incorrect but stated confidently
- hint_request: explicitly asks for a hint
- guessing: "I think maybe X, not sure"
- misunderstood_question: answers a different question
- repeat_question: asks to repeat the question
- simpler_question: asks for simpler wording
- partial_multi_part: only answered part of a multi-part question
- short_answer: one word or very brief
- rambling: long off-track explanation
- thinking_pause / needs_time: silence markers or asks for time to think
- nervous / frustrated: emotional signals
- overconfident: dismissive or "this is easy"
- skip_request: wants to skip
- dont_know: doesn't know / can't answer
- strong_answer: solid complete answer
- textbook_answer: polished but generic, may lack depth
- contradiction: contradicts something said earlier
- off_topic: unrelated tangent
- meta_logistics: time left, audio check, etc.
- technical_hiccup: can't hear, garbled audio
- candidate_question: asks interviewer a question
- normal_answer: standard adequate response

Also extract the topic being discussed (skill, concept, or project area).`,
  });

  return { intent: result.intent, topic: result.topic || currentTopic };
}
