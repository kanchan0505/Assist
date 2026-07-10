"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getAvatarStatusLabel,
  INTERVIEWER_AVATAR,
  resolveAvatarPhase,
  type AvatarPhase,
} from "@/lib/voice/avatar-config";
import { createTalkingHead, ensureTalkingHeadStream, type TalkingHeadInstance } from "@/lib/voice/talking-head-client";
import {
  estimateSpeechScale,
  resolveLipsyncLang,
  scaleVisemePayload,
  textToVisemePayload,
} from "@/lib/voice/talking-head-sync";

type Props = {
  status: "idle" | "connecting" | "active" | "ended";
  speaking: boolean;
  speechText: string;
  interviewLanguage: string;
};

const LISTENING_GESTURES = ["side", "ok", "index", "shrug"] as const;

function phaseBadgeClass(phase: AvatarPhase) {
  switch (phase) {
    case "speaking":
      return "border-primary/30 bg-primary/10";
    case "listening":
      return "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-300";
    case "connecting":
      return "border-amber-500/30 bg-amber-500/10";
    default:
      return "";
  }
}

export function TalkingHeadAvatar({
  status,
  speaking,
  speechText,
  interviewLanguage,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<TalkingHeadInstance | null>(null);
  const streamReadyRef = useRef(false);
  const lastSyncedTextRef = useRef("");
  const lipsyncLang = resolveLipsyncLang(interviewLanguage);

  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const phase = resolveAvatarPhase(status, speaking);
  const statusLabel = getAvatarStatusLabel(phase);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;

    async function init() {
      try {
        setLoadState("loading");
        setLoadError(null);

        const head = await createTalkingHead(container!, interviewLanguage);
        if (disposed) {
          head.dispose();
          return;
        }

        headRef.current = head;
        setLoadState("ready");
      } catch (error) {
        console.error("[TalkingHead] init failed:", error);
        if (!disposed) {
          setLoadState("error");
          setLoadError(
            error instanceof Error ? error.message : "Failed to load 3D avatar",
          );
        }
      }
    }

    void init();

    return () => {
      disposed = true;
      streamReadyRef.current = false;
      lastSyncedTextRef.current = "";
      headRef.current?.streamStop();
      headRef.current?.dispose();
      headRef.current = null;
    };
  }, [interviewLanguage]);

  useEffect(() => {
    const head = headRef.current;
    if (!head || loadState !== "ready") return;
    if (status !== "connecting" && status !== "active") return;

    let cancelled = false;

    void ensureTalkingHeadStream(head, interviewLanguage).then(() => {
      if (!cancelled) streamReadyRef.current = true;
    });

    return () => {
      cancelled = true;
    };
  }, [status, loadState, interviewLanguage]);

  useEffect(() => {
    const head = headRef.current;
    if (!head || !streamReadyRef.current) return;

    if (!speaking) {
      if (lastSyncedTextRef.current) {
        head.streamInterrupt();
        head.stopGesture(500);
        head.lookAhead(400);
        lastSyncedTextRef.current = "";
      }
      return;
    }

    const trimmed = speechText.trim();
    if (!trimmed || trimmed === lastSyncedTextRef.current) return;

    lastSyncedTextRef.current = trimmed;

    head.streamInterrupt();
    head.stopGesture(300);

    const payload = textToVisemePayload(head, trimmed, lipsyncLang);
    if (!payload) return;

    const scale = estimateSpeechScale(trimmed, lipsyncLang);
    head.streamAudio(scaleVisemePayload(payload, scale));
    head.lookAtCamera(500);
    head.setMood("neutral");

    if (trimmed.includes("?")) {
      head.playGesture("handup", 2.4, false, 700);
    } else if (/great|good|excellent|nice|well done/i.test(trimmed)) {
      head.playGesture("thumbup", 2, false, 600);
    }
  }, [speaking, speechText, lipsyncLang]);

  useEffect(() => {
    const head = headRef.current;
    if (!head || status !== "ended") return;
    head.streamInterrupt();
    head.stopGesture(400);
    lastSyncedTextRef.current = "";
  }, [status]);

  useEffect(() => {
    if (status !== "active" || speaking) return;

    const timer = window.setInterval(() => {
      if (speaking || !headRef.current) return;
      if (Math.random() > 0.3) return;

      const gesture =
        LISTENING_GESTURES[Math.floor(Math.random() * LISTENING_GESTURES.length)];
      headRef.current.playGesture(gesture, 2.2, Math.random() > 0.5, 900);
    }, 14_000);

    return () => window.clearInterval(timer);
  }, [status, speaking]);

  useEffect(() => {
    const onVisibility = () => {
      const head = headRef.current;
      if (!head) return;
      if (document.visibilityState === "visible") head.start();
      else head.stop();
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-muted/50 to-background">
      <div className="flex items-start justify-between gap-3 border-b bg-background/60 px-4 py-3 backdrop-blur-sm">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Your interviewer</p>
          <p className="text-lg font-semibold">{INTERVIEWER_AVATAR.name}</p>
          <p className="text-xs text-muted-foreground">{INTERVIEWER_AVATAR.role}</p>
        </div>
        <Badge variant={phase === "speaking" ? "default" : "secondary"} className={phaseBadgeClass(phase)}>
          {phase === "connecting" && <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />}
          {statusLabel}
        </Badge>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className={cn(
            "h-[min(52vh,420px)] w-full bg-[#1a1f2e]",
            loadState !== "ready" && "opacity-0",
          )}
          aria-label={`${INTERVIEWER_AVATAR.name} 3D interviewer avatar`}
        />

        {loadState === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#1a1f2e] text-sm text-white/80">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p>Loading 3D interviewer...</p>
          </div>
        )}

        {loadState === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1a1f2e] px-6 text-center text-sm text-white/80">
            <p className="font-medium text-white">Could not load 3D avatar</p>
            <p className="text-white/60">{loadError}</p>
          </div>
        )}

        {phase === "speaking" && loadState === "ready" && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 flex -translate-x-1/2 items-end gap-1 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className="w-1 animate-sound-bar rounded-full bg-primary"
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <p className="px-4 py-3 text-center text-sm text-muted-foreground">
        {phase === "idle" && "Press Start interview to connect with your AI interviewer."}
        {phase === "connecting" && "Setting up your voice session..."}
        {phase === "speaking" && "Watch Alex's lip-sync while you listen to the question."}
        {phase === "listening" && "Your turn — answer clearly into your microphone."}
        {phase === "ended" && "Session complete. Review your transcript and score below."}
      </p>
    </div>
  );
}
