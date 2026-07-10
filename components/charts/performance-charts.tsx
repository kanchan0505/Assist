"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type SessionPoint = {
  date: string;
  score: number;
  label: string;
};

type SkillPoint = {
  skill: string;
  score: number;
  count: number;
};

type Props = {
  performanceData: SessionPoint[];
  skillData: SkillPoint[];
  communication: number;
  technical: number;
  confidence: number;
};

export function PerformanceCharts({
  performanceData,
  skillData,
  communication,
  technical,
  confidence,
}: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-heading text-base">Performance over time</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {performanceData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Complete interviews to see trends.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="score" stroke="var(--primary)" fill="url(#scoreGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-heading text-base">Skill-wise scores</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {skillData.length === 0 ? (
            <p className="text-sm text-muted-foreground">No skill interviews yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="skill" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="score" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 lg:col-span-2">
        <CardHeader>
          <CardTitle className="font-heading text-base">Score breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Communication", value: communication },
              { label: "Technical", value: technical },
              { label: "Confidence", value: confidence },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border/50 p-4">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 font-heading text-3xl font-bold">
                  {item.value > 0 ? item.value.toFixed(1) : "—"}
                  <span className="text-lg text-muted-foreground">/10</span>
                </p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (item.value / 10) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
