"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Mic,
  MicOff,
  Pause,
  PhoneOff,
  Play,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { INTERVIEWER_AVATAR } from "@/lib/voice/avatar-config";
import { cn } from "@/lib/utils";

type Props = {
  interviewType: "skill" | "project";
  targetId: string;
  targetTitle: string;
  interviewLanguage: string;
  interviewerStyle: string;
  immersive?: boolean;
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

function formatTimer(seconds: number) {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

export function VoiceInterviewPanel({
  interviewType,
  targetId,
  targetTitle,
  interviewLanguage,
  interviewerStyle,
  immersive = false,
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
  const [muted, setMuted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const startTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);
  const vapiRef = useRef<InstanceType<typeof Vapi> | null>(null);
  const isCallActiveRef = useRef(false);
  const userEndedRef = useRef(false);
  const transcriptRef = useRef<TranscriptLine[]>([]);
  const autoStartedRef = useRef(false);

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
    }
    vapiRef.current = null;
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

  useEffect(() => {
    if (status !== "active" || paused) return;
    const id = window.setInterval(() => {
      if (!startTimeRef.current) return;
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [status, paused]);

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
    setMuted(false);
    setPaused(false);
    setElapsedSec(0);

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
            console.warn("[Voice] Call ended:", reason);
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
          console.warn("[Voice] Non-fatal audio warning (ignored):", e);
          return;
        }

        console.error("[Voice] Error:", e);

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

  useEffect(() => {
    if (!immersive || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void startInterview();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- auto-start once on enter
  }, [immersive]);

  async function endInterview() {
    userEndedRef.current = true;
    cleanupVapi();
    setSpeaking(false);
    setPaused(false);
    setStatus("ended");
    await summarizeSession(false);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    try {
      vapiRef.current?.setMuted(next);
    } catch {
      // ignore if unsupported mid-call
    }
  }

  function togglePause() {
    if (status !== "active") return;
    const next = !paused;
    setPaused(next);
    try {
      // Pause = mute mic so the interviewer is not interrupted mid-thought.
      vapiRef.current?.setMuted(next || muted);
    } catch {
      // ignore
    }
  }

  const statusPhase =
    status === "active"
      ? paused
        ? "paused"
        : speaking
          ? "active_speaking"
          : "active_listening"
      : status === "connecting"
        ? "connecting"
        : status === "ended"
          ? "ended"
          : "idle";

  if (immersive) {
    return (
      <div className="relative flex h-full w-full flex-col">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(56,189,248,0.12),_transparent_55%),radial-gradient(ellipse_at_top,_rgba(45,212,191,0.08),_transparent_40%)]" />

        <header className="relative z-20 flex items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="min-w-0">
            <p className="text-xs tracking-wide text-white/50 uppercase">
              {interviewType === "skill" ? "Technical skill" : "Project deep-dive"}
            </p>
            <h1 className="truncate font-heading text-lg font-semibold md:text-xl">
              {targetTitle}
            </h1>
            <p className="mt-0.5 text-xs text-white/45">
              {getLanguageLabel(interviewLanguage)} · {getStyleLabel(interviewerStyle)} ·{" "}
              {INTERVIEWER_AVATAR.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {(status === "active" || status === "connecting") && (
              <div className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-sm text-white/80 tabular-nums sm:block">
                {formatTimer(elapsedSec)}
              </div>
            )}
            <InterviewStatusPill phase={statusPhase} />
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              onClick={() => {
                if (status === "active" || status === "connecting") {
                  void endInterview();
                  return;
                }
                router.push("/interview");
              }}
              aria-label="Exit interview"
            >
              <X className="size-5" />
            </Button>
          </div>
        </header>

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          {status !== "ended" ? (
            <div className="relative min-h-0 flex-1">
              <InterviewerAvatar
                status={status}
                speaking={speaking && !paused}
                speechText={assistantSpeechText}
                volumeLevel={volumeLevel}
                utteranceId={utteranceId}
                interviewLanguage={interviewLanguage}
                immersive
              />

              {paused && status === "active" && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 backdrop-blur-sm">
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-8 py-6 text-center backdrop-blur-xl">
                    <p className="font-heading text-xl font-semibold">Interview paused</p>
                    <p className="mt-1 text-sm text-white/60">
                      Your microphone is muted until you resume.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ResultsView
              summarizing={summarizing}
              summary={summary}
              score={score}
              transcript={transcript}
              error={error}
              onBack={() => router.push("/interview")}
              onAgain={() => {
                autoStartedRef.current = false;
                void startInterview();
              }}
            />
          )}
        </div>

        {error && status !== "ended" && (
          <div className="relative z-20 mx-4 mb-2 rounded-xl border border-rose-400/30 bg-rose-500/15 px-4 py-3 text-sm text-rose-100 md:mx-8">
            {error}
          </div>
        )}

        {status !== "ended" && (
          <footer className="relative z-20 flex flex-col items-center gap-4 px-4 py-5 md:px-8 md:py-6">
            <VoiceActivityBar
              active={status === "active" && !paused}
              speaking={speaking}
              volumeLevel={volumeLevel}
            />

            <div className="flex items-center gap-3 sm:gap-4">
              {status === "idle" && (
                <ControlButton
                  onClick={() => void startInterview()}
                  label="Start"
                  className="bg-sky-500 text-white hover:bg-sky-400"
                >
                  <Play className="size-5" />
                </ControlButton>
              )}

              {status === "connecting" && (
                <ControlButton disabled label="Connecting">
                  <Loader2 className="size-5 animate-spin" />
                </ControlButton>
              )}

              {status === "active" && (
                <>
                  <ControlButton
                    onClick={togglePause}
                    label={paused ? "Resume" : "Pause"}
                    className="bg-white/10 hover:bg-white/15"
                  >
                    {paused ? <Play className="size-5" /> : <Pause className="size-5" />}
                  </ControlButton>

                  <ControlButton
                    onClick={toggleMute}
                    label={muted ? "Unmute" : "Mute"}
                    className={cn(
                      "bg-white/10 hover:bg-white/15",
                      muted && "bg-amber-500/30 text-amber-100",
                    )}
                  >
                    {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
                  </ControlButton>

                  <ControlButton
                    onClick={() => void endInterview()}
                    label="End"
                    className="bg-rose-500 text-white hover:bg-rose-400"
                  >
                    <PhoneOff className="size-5" />
                  </ControlButton>
                </>
              )}
            </div>

            <p className="text-center text-xs text-white/40 sm:hidden">
              {formatTimer(elapsedSec)}
            </p>
          </footer>
        )}
      </div>
    );
  }

  // Non-immersive fallback (should rarely render now)
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/60 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>{getLanguageLabel(interviewLanguage)}</span>
          <span>·</span>
          <span>{getStyleLabel(interviewerStyle)}</span>
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
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
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
              Connecting…
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
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating AI performance summary...
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

function ControlButton({
  children,
  label,
  onClick,
  className,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group flex flex-col items-center gap-1.5 disabled:opacity-60",
      )}
    >
      <span
        className={cn(
          "inline-flex size-14 items-center justify-center rounded-full transition-transform group-hover:scale-105",
          className ?? "bg-white/10",
        )}
      >
        {children}
      </span>
      <span className="text-xs text-white/55">{label}</span>
    </button>
  );
}

function VoiceActivityBar({
  active,
  speaking,
  volumeLevel,
}: {
  active: boolean;
  speaking: boolean;
  volumeLevel: number;
}) {
  const bars = 12;
  return (
    <div className="flex h-8 items-end gap-1">
      {Array.from({ length: bars }).map((_, i) => {
        const wave = active
          ? speaking
            ? 0.35 + Math.sin((i + volumeLevel * 8) * 0.7) * 0.35 + volumeLevel * 0.4
            : 0.2 + (i % 3) * 0.08
          : 0.15;
        return (
          <span
            key={i}
            className={cn(
              "w-1 rounded-full transition-all duration-150",
              speaking ? "bg-sky-400" : active ? "bg-emerald-400/80" : "bg-white/25",
              active && "animate-sound-bar",
            )}
            style={{
              height: `${Math.max(4, Math.min(32, wave * 32))}px`,
              animationDelay: `${i * 0.05}s`,
              animationPlayState: active ? "running" : "paused",
            }}
          />
        );
      })}
    </div>
  );
}

function ResultsView({
  summarizing,
  summary,
  score,
  transcript,
  error,
  onBack,
  onAgain,
}: {
  summarizing: boolean;
  summary: string | null;
  score: number | null;
  transcript: TranscriptLine[];
  error: string | null;
  onBack: () => void;
  onAgain: () => void;
}) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 md:px-8">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl md:p-8">
        <p className="text-sm text-white/50">Interview complete</p>
        <h2 className="font-heading mt-1 text-3xl font-semibold">Performance summary</h2>

        {summarizing && (
          <div className="mt-6 flex items-center gap-2 text-sm text-white/60">
            <Loader2 className="size-4 animate-spin" />
            Generating your AI performance summary…
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {error}
          </div>
        )}

        {summary && (
          <div className="mt-6 space-y-3">
            <p className="font-heading text-4xl font-bold">
              <span className="text-sky-300">{score}</span>
              <span className="text-lg text-white/40"> / 10</span>
            </p>
            <p className="text-sm leading-relaxed text-white/70">{summary}</p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Button
            onClick={onBack}
            className="rounded-xl bg-white text-slate-900 hover:bg-white/90"
          >
            Back to Interview Studio
          </Button>
          <Button
            variant="outline"
            onClick={onAgain}
            className="rounded-xl border-white/20 bg-transparent text-white hover:bg-white/10"
          >
            Start again
          </Button>
        </div>
      </div>

      {transcript.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <p className="mb-4 text-sm font-medium text-white/50">Conversation transcript</p>
          <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
            {transcript.map((line, i) => (
              <div
                key={i}
                className={cn(
                  "rounded-xl p-3 text-sm",
                  line.role === "user"
                    ? "ml-4 bg-sky-500/15"
                    : "mr-4 bg-white/8",
                )}
              >
                <p className="mb-1 text-xs font-medium text-white/45">
                  {line.role === "user" ? "You" : "Interviewer"}
                </p>
                <p className="text-white/85">{line.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
