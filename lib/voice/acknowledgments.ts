export const ACKNOWLEDGMENT_POOL = [
  "Got it.",
  "That makes sense.",
  "Interesting approach.",
  "Fair enough.",
  "Okay, I follow.",
  "Right — thanks for walking through that.",
  "Good — that's helpful context.",
  "I see where you're going with that.",
  "Understood.",
  "That's a reasonable way to think about it.",
  "Okay, solid point.",
  "Thanks — that clarifies things.",
] as const;

export const TRANSITION_POOL = [
  "Let's shift gears a bit.",
  "Moving on —",
  "Next, I'd like to ask about",
  "Let's talk about something else now.",
  "Switching topics —",
  "Building on that —",
  "One more angle on this —",
] as const;

export function pickAcknowledgment(recent: string[]): string {
  const available = ACKNOWLEDGMENT_POOL.filter((p) => !recent.includes(p));
  const pool = available.length > 0 ? available : [...ACKNOWLEDGMENT_POOL];
  return pool[Math.floor(Math.random() * pool.length)]!;
}

export function pickTransition(recent: string[]): string {
  const available = TRANSITION_POOL.filter((p) => !recent.includes(p));
  const pool = available.length > 0 ? available : [...TRANSITION_POOL];
  return pool[Math.floor(Math.random() * pool.length)]!;
}
