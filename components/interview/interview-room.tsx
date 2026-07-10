"use client";

import { VoiceInterviewPanel } from "@/components/voice/voice-interview-panel";
import { cn } from "@/lib/utils";
import { Brain, Ear, Mic, Pause, Sparkles } from "lucide-react";

type Props = {
  interviewType: "skill" | "project";
  targetId: string;
  targetTitle: string;
  interviewLanguage: string;
  interviewerStyle: string;
};

const statusConfig = {
  idle: { label: "Ready", icon: Sparkles, color: "text-white/70" },
  connecting: { label: "AI is thinking…", icon: Brain, color: "text-amber-300" },
  active_listening: { label: "Listening…", icon: Ear, color: "text-emerald-300" },
  active_speaking: { label: "Speaking…", icon: Mic, color: "text-sky-300" },
  paused: { label: "Paused", icon: Pause, color: "text-white/70" },
  ended: { label: "Session ended", icon: Sparkles, color: "text-white/60" },
};

export function InterviewRoom(props: Props) {
  return <VoiceInterviewPanel {...props} immersive />;
}

export function InterviewStatusPill({
  phase,
}: {
  phase: keyof typeof statusConfig;
}) {
  const config = statusConfig[phase];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium backdrop-blur-md",
        config.color,
      )}
    >
      <Icon className="size-4" />
      {config.label}
    </span>
  );
}
