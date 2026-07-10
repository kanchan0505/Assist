"use client";

import { InterviewerAvatar } from "@/components/voice/interviewer-avatar";
import { VoiceInterviewPanel } from "@/components/voice/voice-interview-panel";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Brain, Ear, Mic, Sparkles } from "lucide-react";

type Props = {
  interviewType: "skill" | "project";
  targetId: string;
  targetTitle: string;
  interviewLanguage: string;
  interviewerStyle: string;
};

const statusConfig = {
  idle: { label: "Ready", icon: Sparkles, color: "text-muted-foreground" },
  connecting: { label: "Connecting...", icon: Brain, color: "text-amber-500" },
  active_listening: { label: "Listening...", icon: Ear, color: "text-green-500" },
  active_speaking: { label: "Speaking...", icon: Mic, color: "text-primary" },
  ended: { label: "Session ended", icon: Sparkles, color: "text-muted-foreground" },
};

export function InterviewRoom(props: Props) {
  return (
    <div className="space-y-6">
      <VoiceInterviewPanelShell {...props} />
    </div>
  );
}

function VoiceInterviewPanelShell(props: Props) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
      <div className="space-y-4">
        <InterviewStageHeader targetTitle={props.targetTitle} interviewType={props.interviewType} />
        <VoiceInterviewPanel {...props} />
      </div>
      <InterviewTipsCard />
    </div>
  );
}

function InterviewStageHeader({
  targetTitle,
  interviewType,
}: {
  targetTitle: string;
  interviewType: "skill" | "project";
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <p className="text-sm text-muted-foreground">AI Interviewer</p>
        <h2 className="font-heading text-xl font-semibold">{targetTitle}</h2>
      </div>
      <Badge variant="secondary">
        {interviewType === "skill" ? "Technical skill" : "Project deep-dive"}
      </Badge>
    </div>
  );
}

function InterviewTipsCard() {
  return (
    <Card className="hidden h-fit border-border/60 bg-card/60 p-5 backdrop-blur-sm xl:block">
      <h3 className="font-heading font-semibold">Interview tips</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
        <li>• Speak clearly and pause briefly between points.</li>
        <li>• Use the STAR method for project questions.</li>
        <li>• Say &ldquo;I don&apos;t know&rdquo; — the AI will guide you.</li>
        <li>• End the call to get your scored summary.</li>
      </ul>
    </Card>
  );
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
        "inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1.5 text-sm font-medium",
        config.color,
      )}
    >
      <Icon className="size-4" />
      {config.label}
    </span>
  );
}

export { InterviewerAvatar };
