"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project, Skill } from "@/lib/db/schema";

type SkillInput = { name: string; category: Skill["category"] };
type ProjectInput = { title: string; description: string };

type Props = {
  initialSkills: Skill[];
  initialProjects: Project[];
};

export function ResumeReviewForm({ initialSkills, initialProjects }: Props) {
  const router = useRouter();
  const [skills, setSkills] = useState<SkillInput[]>(
    initialSkills.map((s) => ({ name: s.name, category: s.category })),
  );
  const [projects, setProjects] = useState<ProjectInput[]>(
    initialProjects.map((p) => ({
      title: p.title,
      description: p.description ?? "",
    })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skills, projects }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSkills([...skills, { name: "", category: "language" }])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.map((skill, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="Skill name"
                value={skill.name}
                onChange={(e) => {
                  const next = [...skills];
                  next[i] = { ...next[i], name: e.target.value };
                  setSkills(next);
                }}
              />
              <select
                className="rounded-md border px-3 text-sm"
                value={skill.category}
                onChange={(e) => {
                  const next = [...skills];
                  next[i] = {
                    ...next[i],
                    category: e.target.value as Skill["category"],
                  };
                  setSkills(next);
                }}
              >
                <option value="language">Language</option>
                <option value="framework">Framework</option>
                <option value="database">Database</option>
                <option value="tool">Tool</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSkills(skills.filter((_, idx) => idx !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Projects</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setProjects([...projects, { title: "", description: "" }])
            }
          >
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {projects.map((project, i) => (
            <div key={i} className="space-y-2 rounded-lg border p-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Project title"
                  value={project.title}
                  onChange={(e) => {
                    const next = [...projects];
                    next[i] = { ...next[i], title: e.target.value };
                    setProjects(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setProjects(projects.filter((_, idx) => idx !== i))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                placeholder="Brief description"
                value={project.description}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...next[i], description: e.target.value };
                  setProjects(next);
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Finish setup"
        )}
      </Button>
    </form>
  );
}
