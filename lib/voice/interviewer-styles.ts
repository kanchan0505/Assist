export const INTERVIEWER_STYLES = [
  {
    value: "supportive",
    label: "Supportive",
    description: "Encouraging, gives hints, de-escalates stress, patient with pauses",
  },
  {
    value: "balanced",
    label: "Balanced",
    description: "Professional mix of warmth and rigor — default realistic interviewer",
  },
  {
    value: "strict",
    label: "Efficient",
    description: "Direct, fewer hints, moves on faster when stuck",
  },
] as const;

export type InterviewerStyle = (typeof INTERVIEWER_STYLES)[number]["value"];

export function getStyleLabel(style: string) {
  return INTERVIEWER_STYLES.find((s) => s.value === style)?.label ?? style;
}

export function getStyleInstructions(style: InterviewerStyle) {
  switch (style) {
    case "supportive":
      return `Style: SUPPORTIVE
- Reassure nervous candidates briefly, then continue naturally
- Offer small hints before moving on; never give full answers
- Allow thinking time; proactively offer to repeat questions after long pauses
- De-escalate frustration and pivot topics sooner when stuck`;
    case "strict":
      return `Style: EFFICIENT / STRICT
- Be polite but concise; minimal hand-holding
- At most one hint per topic; then move on
- Shorter acknowledgments; less emotional coaching
- Still professional — never rude or dismissive`;
    default:
      return `Style: BALANCED
- Professional and fair; mix encouragement with appropriate probing
- Give one nudge on "I don't know" before pivoting
- Probe strong answers for depth; redirect rambling politely`;
  }
}
