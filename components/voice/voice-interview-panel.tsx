"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, PhoneOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type Vapi from "@vapi-ai/web";
import type { VapiVariableValues } from "@/lib/vapi/vapi.sdk";
import { getLanguageLabel } from "@/lib/voice/languages";
import { getStyleLabel } from "@/lib/voice/interviewer-styles";
import { buildVapiStartOverrides } from "@/lib/voice/build-vapi-overrides";
import type { VapiLlmMode } from "@/lib/voice/llm-mode";
import {
  formatVapiError,
  isFatalVapiError,
  isNonFatalVapiError,
} from "@/lib/voice/vapi-errors";
import { InterviewerAvatar } from "@/components/voice/interviewer-avatar";
import { InterviewStatusPill } from "@/components/interview/interview-room";

type Props = {
  interviewType: "skill" | "project";
  targetId: string;
  targetTitle: string;
  interviewLanguage: string;
  interviewerStyle: string;
};

type TranscriptLine = {
  role: "user" | "assistant";
  text: string;
};

type VapiTranscriptMessage = {
  type: string;
  role?: string;
  transcript?: string;
  transcriptType?: string;
  status?: string;
  endedReason?: string;
};

export function VoiceInterviewPanel({
  interviewType,
  targetId,
  targetTitle,
  interviewLanguage,
  interviewerStyle,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [speaking, setSpeaking] = useState(false);
  const [assistantSpeechText, setAssistantSpeechText] = useState("");
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [utteranceId, setUtteranceId] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const startTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);
  const isCallActiveRef = useRef(false);
  const userEndedRef = useRef(false);
  const transcriptRef = useRef<TranscriptLine[]>([]);

  const appendTranscript = useCallback((role: "user" | "assistant", text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setTranscript((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === role && last.text === trimmed) return prev;
      const next = [...prev, { role, text: trimmed }];
      transcriptRef.current = next;
      return next;
    });
  }, []);

  const cleanupVapi = useCallback(() => {
    if (vapiRef.current) {
      try {
        vapiRef.current.stop();
      } catch {
        // call may already be ended
      }
      vapiRef.current.removeAllListeners();
      vapiRef.current = null;
    }
    isCallActiveRef.current = false;
  }, []);

  const summarizeSession = useCallback(async (disconnected = false) => {
    if (!sessionIdRef.current || summarizing) return;

    const lines = transcriptRef.current;
    const transcriptText = lines
      .map((line) => `${line.role === "user" ? "Candidate" : "Interviewer"}: ${line.text}`)
      .join("\n");

    if (!transcriptText.trim()) {
      if (disconnected) {
        setError("The voice connection ended before any transcript was captured.");
      }
      return;
    }

    const durationSec = Math.max(
      1,
      Math.round((Date.now() - startTimeRef.current) / 1000),
    );

    setSummarizing(true);
    if (disconnected) {
      setError(null);
    }

    try {
      const res = await fetch("/api/voice/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          transcript: transcriptText,
          durationSec,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to summarize interview");

      setSummary(data.session.summary);
      setScore(data.session.score);
      if (disconnected) {
        setError(
          "The voice connection ended unexpectedly. Your partial interview was saved and summarized below.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : disconnected
            ? "Connection ended and summary generation failed."
            : "Failed to generate summary",
      );
    } finally {
      setSummarizing(false);
    }
  }, [summarizing]);

  useEffect(() => {
    return () => {
      cleanupVapi();
    };
  }, [cleanupVapi]);

  async function startInterview() {
    setStatus("connecting");
    setError(null);
    setTranscript([]);
    transcriptRef.current = [];
    setSummary(null);
    setScore(null);
    setSummarizing(false);
    userEndedRef.current = false;
    setAssistantSpeechText("");
    setVolumeLevel(0);
    setUtteranceId(0);

    try {
      const res = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interviewType,
          interviewLanguage,
          interviewerStyle,
          ...(interviewType === "project"
            ? { projectId: targetId }
            : { skillId: targetId }),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to start session");

      sessionIdRef.current = data.sessionId;
      const variableValues = data.variableValues as VapiVariableValues;
      const assistantId = data.assistantId as string;

      const Vapi = (await import("@vapi-ai/web")).default;
      const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_WEB_TOKEN!);
      vapiRef.current = vapi;

      vapi.on("call-start", () => {
        startTimeRef.current = Date.now();
        isCallActiveRef.current = true;
        setStatus("active");
      });

      vapi.on("call-end", () => {
        setSpeaking(false);
        isCallActiveRef.current = false;
        vapiRef.current = null;

        if (!userEndedRef.current) {
          setStatus("ended");
          void summarizeSession(true);
          return;
        }

        setStatus("ended");
      });

      vapi.on("volume-level", (level: number) => {
        setVolumeLevel(level);
      });

      vapi.on("speech-start", () => {
        setSpeaking(true);
        setUtteranceId((id) => id + 1);
      });
      vapi.on("speech-end", () => {
        setSpeaking(false);
        setVolumeLevel(0);
        setAssistantSpeechText("");
      });

      vapi.on("message", (message: VapiTranscriptMessage) => {
        if (message.type === "status-update" && message.status === "ended") {
          const reason = message.endedReason ?? "";
          if (
            reason &&
            reason !== "customer-ended-call" &&
            reason !== "assistant-ended-call"
          ) {
            console.warn("[Vapi] Call ended:", reason);
          }
        }

        if (message.type !== "transcript") {
          return;
        }

        const role = message.role === "user" ? "user" : "assistant";
        if (message.transcript) {
          if (role === "assistant") {
            setAssistantSpeechText(message.transcript);
          }
          if (message.transcriptType === "final") {
            appendTranscript(role, message.transcript);
          }
        }
      });

      vapi.on("call-start-progress", (progress: {
        status?: string;
        stage?: string;
        metadata?: { error?: string };
      }) => {
        if (progress.status === "failed") {
          const detail = progress.metadata?.error;
          setError(
            detail
              ? `Failed to start call (${progress.stage}): ${detail}`
              : `Failed to start call at stage: ${progress.stage ?? "unknown"}`,
          );
          setStatus("idle");
          cleanupVapi();
        }
      });

      vapi.on("error", (e: unknown) => {
        if (isNonFatalVapiError(e)) {
          console.warn("[Vapi] Non-fatal audio warning (ignored):", e);
          return;
        }

        console.error("[Vapi] Error:", e);

        if (isFatalVapiError(e) || !isCallActiveRef.current) {
          setError(formatVapiError(e));
          setStatus("idle");
          cleanupVapi();
        }
      });

      const llmMode = (data.llmMode as VapiLlmMode) ?? "dashboard";

      const startOverrides = buildVapiStartOverrides({
        sessionId: data.sessionId as string,
        variableValues,
        llmMode,
        customLlmUrl: (data.customLlmUrl as string | null) ?? null,
        fallbackSystemPrompt: data.fallbackSystemPrompt as string,
        interviewLanguage,
      });

      await vapi.start(assistantId, startOverrides);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setStatus("idle");
      cleanupVapi();
    }
  }

  async function endInterview() {
    userEndedRef.current = true;
    cleanupVapi();
    setSpeaking(false);
    setStatus("ended");
    await summarizeSession(false);
  }

  const statusPhase =
    status === "active"
      ? speaking
        ? "active_speaking"
        : "active_listening"
      : status === "connecting"
        ? "connecting"
        : status === "ended"
          ? "ended"
          : "idle";

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{getLanguageLabel(interviewLanguage)}</Badge>
          <Badge variant="outline">{getStyleLabel(interviewerStyle)}</Badge>
        </div>
        <InterviewStatusPill phase={statusPhase} />
      </div>

      <div className="space-y-5 p-5">
        <InterviewerAvatar
          status={status}
          speaking={speaking}
          speechText={assistantSpeechText}
          volumeLevel={volumeLevel}
          utteranceId={utteranceId}
          interviewLanguage={interviewLanguage}
        />

        {error && (
          <div
            className={`rounded-lg border p-3 text-sm ${
              summary
                ? "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-200"
                : "border-destructive/40 bg-destructive/5 text-destructive"
            }`}
          >
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {status === "idle" && (
            <Button onClick={startInterview} size="lg">
              <Mic className="mr-2 h-4 w-4" />
              Start interview
            </Button>
          )}
          {status === "connecting" && (
            <Button disabled size="lg">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting to Vapi...
            </Button>
          )}
          {status === "active" && (
            <Button variant="destructive" onClick={endInterview} size="lg">
              <PhoneOff className="mr-2 h-4 w-4" />
              End interview
            </Button>
          )}
          {status === "ended" && !summarizing && (
            <>
              <Button variant="outline" onClick={() => router.push("/dashboard")}>
                Back to dashboard
              </Button>
              <Button variant="secondary" onClick={startInterview}>
                Start again
              </Button>
            </>
          )}
        </div>

        {summarizing && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating AI performance summary...
          </div>
        )}

        {transcript.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Conversation transcript</p>
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-xl border border-border/60 bg-muted/20 p-4">
            {transcript.map((line, i) => (
              <div
                key={i}
                className={
                  line.role === "user"
                    ? "ml-4 rounded-lg bg-primary/5 p-3 text-sm"
                    : "mr-4 rounded-lg bg-muted p-3 text-sm"
                }
              >
                <p className="mb-1 text-xs font-medium text-muted-foreground">
                  {line.role === "user" ? "You" : "Interviewer"}
                </p>
                <p>{line.text}</p>
              </div>
            ))}
            </div>
          </div>
        )}

        {summary && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
            <p className="font-heading text-2xl font-bold">
              Score: <span className="text-primary">{score}/10</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
