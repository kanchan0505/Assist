"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Code2, FolderKanban, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { INTERVIEW_LANGUAGES } from "@/lib/voice/languages";
import { INTERVIEWER_STYLES } from "@/lib/voice/interviewer-styles";
import { cn } from "@/lib/utils";

type Skill = { id: string; name: string; category: string };
type Project = { id: string; title: string; enrichedDescription: string | null };

type Props = {
  skills: Skill[];
  projects: Project[];
};

const LANGUAGE_STORAGE_KEY = "resume-interview-language";
const STYLE_STORAGE_KEY = "resume-interview-style";

export function VoiceInterviewHub({ skills, projects }: Props) {
  const [language, setLanguage] = useState("en");
  const [style, setStyle] = useState("balanced");

  useEffect(() => {
    const storedLang = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang && INTERVIEW_LANGUAGES.some((l) => l.value === storedLang)) {
      setLanguage(storedLang);
    }
    const storedStyle = localStorage.getItem(STYLE_STORAGE_KEY);
    if (storedStyle && INTERVIEWER_STYLES.some((s) => s.value === storedStyle)) {
      setStyle(storedStyle);
    }
  }, []);

  function handleLanguageChange(value: string) {
    setLanguage(value);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, value);
  }

  function handleStyleChange(value: string) {
    setStyle(value);
    localStorage.setItem(STYLE_STORAGE_KEY, value);
  }

  const hasTargets = skills.length > 0 || projects.length > 0;

  return (
    <div className="space-y-8">
      <Card className="border-border/60 bg-gradient-to-br from-primary/10 via-card/80 to-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5" />
            Voice mock interviews
          </CardTitle>
          <CardDescription>
            Pick a skill or project, choose your interview language, and practice
            with a live AI interviewer powered by Vapi.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="interview-language">Interview language</Label>
            <select
              id="interview-language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {INTERVIEW_LANGUAGES.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="interviewer-style">Interviewer style</Label>
            <select
              id="interviewer-style"
              value={style}
              onChange={(e) => handleStyleChange(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        </CardContent>
      </Card>

      {!hasTargets && (
        <p className="text-muted-foreground">
          Add skills and projects during onboarding to unlock voice interviews.
        </p>
      )}

      {skills.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Code2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold">Technical skills</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {skills.map((skill) => (
              <Card key={skill.id} className="flex flex-col border-border/60 bg-card/60 transition hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{skill.name}</CardTitle>
                    <Badge variant="outline" className="shrink-0 capitalize">
                      {skill.category}
                    </Badge>
                  </div>
                  <CardDescription>
                    Conceptual and scenario-based questions for this skill
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Link
                    href={`/voice/skill/${skill.id}?lang=${language}&style=${style}`}
                    className={cn(buttonVariants(), "w-full")}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start interview
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {projects.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-heading text-xl font-semibold">Projects</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="flex flex-col border-border/60 bg-card/60 transition hover:border-primary/30 hover:shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{project.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {project.enrichedDescription ||
                      "Defend your project decisions, trade-offs, and impact"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto">
                  <Link
                    href={`/voice/project/${project.id}?lang=${language}&style=${style}`}
                    className={cn(buttonVariants({ variant: "outline" }), "w-full")}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start interview
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
