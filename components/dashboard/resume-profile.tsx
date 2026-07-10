"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Save, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/dashboard/page-header";

type Skill = { id?: string; name: string; category: string };
type Project = {
  id?: string;
  title: string;
  description?: string | null;
  enrichedDescription?: string | null;
};

type ResumeData = {
  resume: {
    id: string;
    fileName: string | null;
    parseStatus: string;
    updatedAt: string | Date;
  } | null;
  skills: Skill[];
  projects: Project[];
};

export function ResumeProfileClient({ initial }: { initial: ResumeData }) {
  const [data, setData] = useState(initial);
  const [skills, setSkills] = useState<Skill[]>(initial.skills);
  const [projects, setProjects] = useState<Project[]>(initial.projects);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const reload = useCallback(async () => {
    const res = await fetch("/api/resume");
    const json = await res.json();
    if (res.ok) {
      setData(json);
      setSkills(json.skills ?? []);
      setProjects(json.projects ?? []);
    }
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resume/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success("Resume uploaded and parsed");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/resume", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills: skills.map((s) => ({ name: s.name, category: s.category })),
          projects: projects.map((p) => ({
            title: p.title,
            description: p.description ?? "",
            enrichedDescription: p.enrichedDescription ?? "",
          })),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Save failed");
      setSkills(json.skills);
      setProjects(json.projects);
      toast.success("Profile saved");
      await reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete your resume and all extracted data? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/resume", { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? "Delete failed");
      }
      toast.success("Resume deleted");
      window.location.href = "/onboarding/upload";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  const strengths = skills.slice(0, 4).map((s) => s.name);
  const weaknesses =
    skills.length < 3
      ? ["Add more skills to unlock deeper technical interviews"]
      : ["Practice articulating trade-offs under pressure"];
  const topics = [
    ...skills.slice(0, 3).map((s) => `${s.name} fundamentals`),
    ...projects.slice(0, 2).map((p) => p.title),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Resume Profile"
        description="Manage your resume, skills, projects, and AI-generated interview insights."
      >
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
          Save changes
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="border-border/60 lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-heading">Resume file</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.resume ? (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <p className="font-medium">{data.resume.fileName ?? "Resume"}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  Status: {data.resume.parseStatus} · Updated{" "}
                  {new Date(data.resume.updatedAt).toLocaleDateString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No resume uploaded yet.</p>
            )}
            <div className="flex flex-wrap gap-3">
              <Label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm hover:bg-muted/50">
                <Upload className="size-4" />
                {uploading ? "Uploading..." : "Upload new resume"}
                <input type="file" accept=".pdf,.docx" className="hidden" onChange={handleUpload} disabled={uploading} />
              </Label>
              {data.resume && (
                <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
                  <Trash2 className="mr-2 size-4" />
                  Delete resume
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="font-heading text-base">AI analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium text-green-600 dark:text-green-400">Strengths</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {strengths.map((s) => (
                  <li key={s}>• {s}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400">Focus areas</p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {weaknesses.map((w) => (
                  <li key={w}>• {w}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium text-primary">Recommended topics</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {topics.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-heading">Skills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {skills.map((skill, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_140px_auto]">
              <Input
                value={skill.name}
                onChange={(e) => {
                  const next = [...skills];
                  next[i] = { ...skill, name: e.target.value };
                  setSkills(next);
                }}
                placeholder="Skill name"
              />
              <select
                value={skill.category}
                onChange={(e) => {
                  const next = [...skills];
                  next[i] = { ...skill, category: e.target.value };
                  setSkills(next);
                }}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {["language", "framework", "database", "tool"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <Button variant="ghost" size="sm" onClick={() => setSkills(skills.filter((_, j) => j !== i))}>
                Remove
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setSkills([...skills, { name: "", category: "language" }])}>
            Add skill
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-heading">Projects</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {projects.map((project, i) => (
            <div key={i} className="space-y-3 rounded-xl border border-border/50 p-4">
              <Input
                value={project.title}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...project, title: e.target.value };
                  setProjects(next);
                }}
                placeholder="Project title"
              />
              <Textarea
                value={project.description ?? ""}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...project, description: e.target.value };
                  setProjects(next);
                }}
                placeholder="Short description"
                rows={2}
              />
              <Textarea
                value={project.enrichedDescription ?? ""}
                onChange={(e) => {
                  const next = [...projects];
                  next[i] = { ...project, enrichedDescription: e.target.value };
                  setProjects(next);
                }}
                placeholder="Enriched context for interviews"
                rows={3}
              />
              <Button variant="ghost" size="sm" onClick={() => setProjects(projects.filter((_, j) => j !== i))}>
                Remove project
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setProjects([...projects, { title: "", description: "", enrichedDescription: "" }])}
          >
            Add project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
