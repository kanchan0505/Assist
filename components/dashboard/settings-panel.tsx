"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { INTERVIEW_LANGUAGES } from "@/lib/voice/languages";
import { INTERVIEWER_STYLES } from "@/lib/voice/interviewer-styles";

const LANG_KEY = "resume-interview-language";
const STYLE_KEY = "resume-interview-style";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

export function SettingsPanel({ user }: { user: User }) {
  const [language, setLanguage] = useState("en");
  const [style, setStyle] = useState("balanced");

  useEffect(() => {
    setLanguage(localStorage.getItem(LANG_KEY) ?? "en");
    setStyle(localStorage.getItem(STYLE_KEY) ?? "balanced");
  }, []);

  function saveDefaults() {
    localStorage.setItem(LANG_KEY, language);
    localStorage.setItem(STYLE_KEY, style);
  }

  const initials =
    user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-heading">Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarImage src={user.image ?? undefined} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: "/" })}>
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="font-heading">Interview defaults</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default language</Label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {INTERVIEW_LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label>Default interviewer style</Label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {INTERVIEWER_STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <Button onClick={saveDefaults}>Save defaults</Button>
        </CardContent>
      </Card>
    </div>
  );
}
