"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Project } from "@/lib/db/schema";

type Props = {
  projects: Project[];
};

export function ProjectEnrichForm({ projects }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(
    projects.map((p) => ({
      id: p.id,
      enrichedDescription: p.enrichedDescription ?? "",
    })),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/resume/enrich", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projects: items }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <p className="text-muted-foreground">
        Add 2–3 sentences per project: what problem it solved, how you built it,
        and what you learned. This context is passed to the AI voice interviewer.
      </p>

      {items.map((item, i) => {
        const project = projects.find((p) => p.id === item.id);
        return (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle>{project?.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor={`enrich-${item.id}`}>Project context</Label>
              <Textarea
                id={`enrich-${item.id}`}
                rows={4}
                placeholder="What problem did it solve? What tech did you use and why? What was challenging?"
                value={item.enrichedDescription}
                onChange={(e) => {
                  const next = [...items];
                  next[i] = { ...next[i], enrichedDescription: e.target.value };
                  setItems(next);
                }}
              />
            </CardContent>
          </Card>
        );
      })}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save & go to dashboard"
        )}
      </Button>
    </form>
  );
}
