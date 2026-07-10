"use client";

import { useCallback, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Gauge,
  Lightbulb,
  Mic,
  Target,
  ListChecks,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { buttonVariants } from "@/components/ui/button";
import { INTERVIEW_LANGUAGES } from "@/lib/voice/languages";
import { INTERVIEWER_STYLES } from "@/lib/voice/interviewer-styles";
import type { InterviewMeta } from "@/lib/voice/interview-meta";
import { cn } from "@/lib/utils";

const LANGUAGE_STORAGE_KEY = "resume-interview-language";
const STYLE_STORAGE_KEY = "resume-interview-style";

type Props = {
  interviewType: "skill" | "project";
  targetId: string;
  targetTitle: string;
  categoryLabel: string;
  description?: string | null;
  meta: InterviewMeta;
};

const difficultyTone: Record<string, string> = {
  Foundational:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  Intermediate:
    "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300",
  Advanced:
    "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
};

const PREF_EVENT = "resume-interview-pref-change";

function subscribePrefs(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(PREF_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(PREF_EVENT, onStoreChange);
  };
}

function readStored(key: string, fallback: string, allowed: readonly string[]) {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  return stored && allowed.includes(stored) ? stored : fallback;
}

function writePref(key: string, value: string) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event(PREF_EVENT));
}

export function InterviewPrep({
  interviewType,
  targetId,
  targetTitle,
  categoryLabel,
  description,
  meta,
}: Props) {
  const language = useSyncExternalStore(
    subscribePrefs,
    () =>
      readStored(
        LANGUAGE_STORAGE_KEY,
        "en",
        INTERVIEW_LANGUAGES.map((l) => l.value),
      ),
    () => "en",
  );
  const style = useSyncExternalStore(
    subscribePrefs,
    () =>
      readStored(
        STYLE_STORAGE_KEY,
        "balanced",
        INTERVIEWER_STYLES.map((s) => s.value),
      ),
    () => "balanced",
  );

  const handleLanguageChange = useCallback((value: string) => {
    writePref(LANGUAGE_STORAGE_KEY, value);
  }, []);

  const handleStyleChange = useCallback((value: string) => {
    writePref(STYLE_STORAGE_KEY, value);
  }, []);

  const roomHref =
    interviewType === "skill"
      ? `/voice/skill/${targetId}?lang=${language}&style=${style}`
      : `/voice/project/${targetId}?lang=${language}&style=${style}`;

  return (
    <div className="space-y-8">
      <Link
        href="/interview"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to interview studio
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{categoryLabel}</Badge>
              <Badge
                variant="outline"
                className={cn(difficultyTone[meta.difficulty])}
              >
                {meta.difficulty}
              </Badge>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
              {targetTitle}
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
              {description?.trim() || meta.focusSummary}
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            <MetaStat icon={Gauge} label="Difficulty" value={meta.difficulty} />
            <MetaStat
              icon={Clock}
              label="Estimated duration"
              value={`~${meta.estimatedMinutes} min`}
            />
            <MetaStat
              icon={Target}
              label="Interview type"
              value={
                interviewType === "skill"
                  ? "Technical skill"
                  : "Project deep-dive"
              }
            />
          </div>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <ListChecks className="size-4 text-sky-600 dark:text-sky-400" />
              <h2 className="font-heading text-lg font-semibold">
                Expected question areas
              </h2>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2">
              {meta.questionAreas.map((area) => (
                <li
                  key={area}
                  className="rounded-xl border border-border/60 bg-card/50 px-4 py-3 text-sm"
                >
                  {area}
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-teal-600 dark:text-teal-400" />
              <h2 className="font-heading text-lg font-semibold">
                Skills evaluated
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {meta.skillsEvaluated.map((skill) => (
                <Badge key={skill} variant="outline" className="rounded-lg px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="size-4 text-amber-600 dark:text-amber-400" />
              <h2 className="font-heading text-lg font-semibold">
                Preparation tips
              </h2>
            </div>
            <ul className="space-y-2">
              {meta.preparationTips.map((tip) => (
                <li
                  key={tip}
                  className="flex gap-3 rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-foreground/40" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-b from-card to-muted/20 shadow-sm">
            <div className="border-b border-border/50 px-6 py-5">
              <p className="text-sm font-medium text-muted-foreground">
                Session setup
              </p>
              <h3 className="font-heading mt-1 text-xl font-semibold">
                Ready when you are
              </h3>
            </div>

            <div className="space-y-5 px-6 py-5">
              <div className="space-y-2">
                <Label htmlFor="prep-language">Interview language</Label>
                <select
                  id="prep-language"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {INTERVIEW_LANGUAGES.map((lang) => (
                    <option key={lang.value} value={lang.value}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prep-style">Interviewer style</Label>
                <select
                  id="prep-style"
                  value={style}
                  onChange={(e) => handleStyleChange(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {INTERVIEWER_STYLES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {INTERVIEWER_STYLES.find((s) => s.value === style)?.description}
                </p>
              </div>

              <div className="rounded-2xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                You will enter a full-screen interview room with your AI
                interviewer. Allow microphone access when prompted.
              </div>

              <Link
                href={roomHref}
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 w-full rounded-xl text-base",
                )}
              >
                <Mic className="mr-2 size-4" />
                Start Voice Interview
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetaStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 px-4 py-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="size-4" />
        <span className="text-xs font-medium tracking-wide uppercase">
          {label}
        </span>
      </div>
      <p className="mt-2 font-heading text-lg font-semibold">{value}</p>
    </div>
  );
}
