"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import {
  getAvatarStatusLabel,
  INTERVIEWER_AVATAR,
  resolveAvatarPhase,
} from "@/lib/voice/avatar-config";

const TalkingHeadAvatar = dynamic(
  () =>
    import("@/components/voice/talking-head-avatar").then((m) => m.TalkingHeadAvatar),
  {
    ssr: false,
    loading: () => <InterviewerAvatarSkeleton />,
  },
);

type Props = {
  status: "idle" | "connecting" | "active" | "ended";
  speaking: boolean;
  speechText: string;
  volumeLevel: number;
  utteranceId: number;
  interviewLanguage: string;
};

function InterviewerAvatarSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/50 to-background">
      <div className="flex h-[min(52vh,420px)] items-center justify-center bg-[#1a1f2e]">
        <div className="flex flex-col items-center gap-3 text-sm text-white/80">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>Loading 3D interviewer...</p>
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
}: Props) {
  return (
    <TalkingHeadAvatar
      status={status}
      speaking={speaking}
      speechText={speechText}
      volumeLevel={volumeLevel}
      utteranceId={utteranceId}
      interviewLanguage={interviewLanguage}
    />
  );
}

export { resolveAvatarPhase, getAvatarStatusLabel, INTERVIEWER_AVATAR };
