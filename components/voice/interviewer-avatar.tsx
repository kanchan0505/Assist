"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import {
  getAvatarStatusLabel,
  INTERVIEWER_AVATAR,
  resolveAvatarPhase,
} from "@/lib/voice/avatar-config";
import { cn } from "@/lib/utils";

const TalkingHeadAvatar = dynamic(
  () =>
    import("@/components/voice/talking-head-avatar").then((m) => m.TalkingHeadAvatar),
  {
    ssr: false,
    loading: () => <InterviewerAvatarSkeleton immersive />,
  },
);

type Props = {
  status: "idle" | "connecting" | "active" | "ended";
  speaking: boolean;
  speechText: string;
  volumeLevel: number;
  utteranceId: number;
  interviewLanguage: string;
  immersive?: boolean;
};

function InterviewerAvatarSkeleton({ immersive }: { immersive: boolean }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden",
        immersive
          ? "h-full w-full"
          : "rounded-2xl border bg-gradient-to-b from-muted/50 to-background",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center bg-[#0b1020]",
          immersive ? "h-full min-h-[50vh]" : "h-[min(52vh,420px)]",
        )}
      >
        <div className="flex flex-col items-center gap-3 text-sm text-white/80">
          <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
          <p>Loading AI interviewer…</p>
        </div>
      </div>
    </div>
  );
}

export function InterviewerAvatar({
  status,
  speaking,
  speechText,
  volumeLevel,
  utteranceId,
  interviewLanguage,
  immersive = false,
}: Props) {
  return (
    <TalkingHeadAvatar
      status={status}
      speaking={speaking}
      speechText={speechText}
      volumeLevel={volumeLevel}
      utteranceId={utteranceId}
      interviewLanguage={interviewLanguage}
      immersive={immersive}
    />
  );
}

export { resolveAvatarPhase, getAvatarStatusLabel, INTERVIEWER_AVATAR };
