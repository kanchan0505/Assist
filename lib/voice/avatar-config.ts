export const INTERVIEWER_AVATAR = {
  name: "Alex",
  role: "AI Technical Interviewer",
  /**
   * TalkingHead demo avatar (Ready Player Me, CC BY-NC 4.0) with Oculus visemes.
   * Hosted on the TalkingHead project — reliable CORS + morph targets.
   */
  modelUrl: "https://met4citizen.github.io/TalkingHead/avatars/brunette.glb",
  body: "F" as const,
} as const;

export type AvatarPhase = "idle" | "connecting" | "speaking" | "listening" | "ended";

export function resolveAvatarPhase(
  status: "idle" | "connecting" | "active" | "ended",
  speaking: boolean,
): AvatarPhase {
  if (status === "idle") return "idle";
  if (status === "connecting") return "connecting";
  if (status === "ended") return "ended";
  return speaking ? "speaking" : "listening";
}

export function getAvatarStatusLabel(phase: AvatarPhase): string {
  switch (phase) {
    case "connecting":
      return "AI is thinking…";
    case "speaking":
      return "Speaking…";
    case "listening":
      return "Listening…";
    case "ended":
      return "Interview ended";
    default:
      return "Ready";
  }
}
