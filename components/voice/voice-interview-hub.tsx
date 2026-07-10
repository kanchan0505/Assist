"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Code2,
  FolderKanban,
  Search,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Skill = { id: string; name: string; category: string };
type Project = { id: string; title: string; enrichedDescription: string | null };

type Props = {
  skills: Skill[];
  projects: Project[];
};

type Tab = "skills" | "projects";

const categoryBlurb: Record<string, string> = {
  language: "Language fundamentals & applied fluency",
  framework: "Framework design & production patterns",
  database: "Data modeling & query reasoning",
  tool: "Tooling workflows & practical usage",
};

export function VoiceInterviewHub({ skills, projects }: Props) {
  const [tab, setTab] = useState<Tab>(skills.length > 0 ? "skills" : "projects");
  const [query, setQuery] = useState("");

  const filteredSkills = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return skills;
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q),
    );
  }, [skills, query]);

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        (p.enrichedDescription?.toLowerCase().includes(q) ?? false),
    );
  }, [projects, query]);

  const skillsByCategory = useMemo(() => {
    const map = new Map<string, Skill[]>();
    for (const skill of filteredSkills) {
      const key = skill.category || "other";
      const list = map.get(key) ?? [];
      list.push(skill);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [filteredSkills]);

  const hasTargets = skills.length > 0 || projects.length > 0;

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-sky-500/10 via-background to-teal-500/5 px-6 py-10 md:px-10 md:py-12">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 left-1/3 size-56 rounded-full bg-teal-400/10 blur-3xl" />
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="size-3.5 text-sky-600 dark:text-sky-400" />
            AI Interview Studio
          </div>
          <h2 className="font-heading text-3xl font-semibold tracking-tight md:text-4xl">
            Choose what you want to practice
          </h2>
          <p className="text-base text-muted-foreground md:text-lg">
            Explore skills and projects from your resume. Open a topic to review
            difficulty, focus areas, and preparation tips — then start your live
            AI voice interview when you are ready.
          </p>
          <div className="flex flex-wrap gap-3 pt-1 text-sm text-muted-foreground">
            <span className="rounded-lg bg-background/60 px-3 py-1.5 ring-1 ring-border/50">
              {skills.length} skills
            </span>
            <span className="rounded-lg bg-background/60 px-3 py-1.5 ring-1 ring-border/50">
              {projects.length} projects
            </span>
          </div>
        </div>
      </section>

      {!hasTargets ? (
        <EmptyState />
      ) : (
        <section className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              role="tablist"
              className="inline-flex rounded-xl border border-border/60 bg-muted/40 p-1"
            >
              {skills.length > 0 && (
                <TabButton
                  active={tab === "skills"}
                  onClick={() => setTab("skills")}
                  icon={Code2}
                  label="Skills"
                  count={skills.length}
                />
              )}
              {projects.length > 0 && (
                <TabButton
                  active={tab === "projects"}
                  onClick={() => setTab("projects")}
                  icon={FolderKanban}
                  label="Projects"
                  count={projects.length}
                />
              )}
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  tab === "skills" ? "Search skills…" : "Search projects…"
                }
                className="h-10 rounded-xl border-border/60 bg-background/80 pl-9"
              />
            </div>
          </div>

          {tab === "skills" && (
            <div className="space-y-8">
              {filteredSkills.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No skills match “{query}”.
                </p>
              ) : (
                skillsByCategory.map(([category, items]) => (
                  <div key={category} className="space-y-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-heading text-sm font-semibold tracking-wide text-muted-foreground uppercase">
                        {category}
                      </h3>
                      <p className="hidden text-xs text-muted-foreground sm:block">
                        {categoryBlurb[category] ?? "Targeted technical practice"}
                      </p>
                    </div>
                    <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
                      {items.map((skill) => (
                        <li key={skill.id}>
                          <Link
                            href={`/interview/skill/${skill.id}`}
                            className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-sky-500/5 md:px-5"
                          >
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-700 transition group-hover:scale-105 dark:text-sky-300">
                              <Code2 className="size-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium">{skill.name}</p>
                                <Badge
                                  variant="outline"
                                  className="capitalize"
                                >
                                  {skill.category}
                                </Badge>
                              </div>
                              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                {categoryBlurb[skill.category] ??
                                  "View details & prepare"}
                              </p>
                            </div>
                            <span className="hidden items-center gap-1 text-sm text-muted-foreground transition group-hover:text-foreground sm:inline-flex">
                              View details
                              <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                            </span>
                            <ArrowRight className="size-4 text-muted-foreground sm:hidden" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "projects" && (
            <div className="space-y-3">
              {filteredProjects.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No projects match “{query}”.
                </p>
              ) : (
                <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/60 bg-card/40">
                  {filteredProjects.map((project) => (
                    <li key={project.id}>
                      <Link
                        href={`/interview/project/${project.id}`}
                        className="group flex items-center gap-4 px-4 py-4 transition-colors hover:bg-teal-500/5 md:px-5"
                      >
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 text-teal-700 transition group-hover:scale-105 dark:text-teal-300">
                          <FolderKanban className="size-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium">{project.title}</p>
                          <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                            {project.enrichedDescription ||
                              "Defend decisions, trade-offs, and impact"}
                          </p>
                        </div>
                        <span className="hidden items-center gap-1 text-sm text-muted-foreground transition group-hover:text-foreground sm:inline-flex">
                          View details
                          <ArrowRight className="size-4 transition group-hover:translate-x-0.5" />
                        </span>
                        <ArrowRight className="size-4 text-muted-foreground sm:hidden" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Code2;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
      <span
        className={cn(
          "rounded-md px-1.5 py-0.5 text-xs",
          active ? "bg-muted text-foreground" : "bg-transparent",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/70 bg-muted/20 px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted">
        <Sparkles className="size-5 text-muted-foreground" />
      </div>
      <h3 className="font-heading text-lg font-semibold">No interview topics yet</h3>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Add skills and projects to your resume profile to unlock personalized AI
        interview practice.
      </p>
      <Link
        href="/resume"
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm font-medium text-background transition hover:opacity-90"
      >
        Update resume profile
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}
