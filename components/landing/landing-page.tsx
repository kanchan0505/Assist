import Link from "next/link";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { productName } from "@/lib/navigation";
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Mic,
  Sparkles,
  Upload,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Resume-driven interviews",
    desc: "AI extracts skills and projects from your resume to generate targeted voice interviews.",
  },
  {
    icon: Mic,
    title: "Live voice practice",
    desc: "Speak naturally with a 3D AI interviewer powered by Vapi — no typing required.",
  },
  {
    icon: Brain,
    title: "Adaptive questioning",
    desc: "Intent-aware follow-ups, hints, and realistic interviewer behavior.",
  },
  {
    icon: BarChart3,
    title: "Performance analytics",
    desc: "Scores, summaries, and skill-wise progress tracking after every session.",
  },
];

const steps = [
  { step: "01", title: "Upload resume", desc: "PDF or DOCX — AI parses your profile in seconds." },
  { step: "02", title: "Pick a topic", desc: "Choose a skill or project from your extracted profile." },
  { step: "03", title: "Voice interview", desc: "Live AI conversation with lip-synced 3D interviewer." },
  { step: "04", title: "Get feedback", desc: "Instant scored debrief with strengths and improvements." },
];

const faqs = [
  {
    q: "Is this a real voice interview?",
    a: "Yes. You speak out loud and the AI interviewer responds in real time via Vapi voice AI.",
  },
  {
    q: "What file formats are supported?",
    a: "PDF and DOCX resumes are supported for upload and AI parsing.",
  },
  {
    q: "Do I need to configure Vapi myself?",
    a: "No. The platform handles voice sessions — just sign in and start practicing.",
  },
];

export async function LandingPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-background">
      <div className="gradient-mesh pointer-events-none fixed inset-0 -z-10" />

      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Sparkles className="size-5 text-primary" />
            {productName}
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#faq" className="hover:text-foreground">FAQ</a>
          </nav>
          <Link
            href={session ? "/dashboard" : "/login"}
            className={cn(buttonVariants())}
          >
            {session ? "Dashboard" : "Get started"}
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-16 md:px-6 md:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm text-primary">
            <Zap className="size-4" />
            AI Voice Interview Platform
          </div>
          <h1 className="font-heading text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
            Ace your next interview with{" "}
            <span className="text-gradient">AI voice practice</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Upload your resume. Practice live technical interviews tailored to your skills and projects.
            Get instant AI feedback — like a real SaaS interview coach.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href={session ? "/interview" : "/login"}
              className={cn(buttonVariants({ size: "lg" }), "gap-2")}
            >
              Start practicing <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#how-it-works"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              See how it works
            </Link>
          </div>
        </div>

        <div className="relative mx-auto mt-16 max-w-4xl">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary/20 via-violet-500/10 to-cyan-500/20 blur-2xl animate-pulse-glow" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <div className="size-3 rounded-full bg-red-500/80" />
              <div className="size-3 rounded-full bg-amber-500/80" />
              <div className="size-3 rounded-full bg-green-500/80" />
              <span className="ml-2 text-xs text-muted-foreground">AI Interview Room</span>
            </div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="flex min-h-[220px] flex-col items-center justify-center bg-[#1a1f2e] p-8">
                <div className="size-24 animate-float rounded-full bg-gradient-to-br from-primary/40 to-violet-600/30 ring-4 ring-primary/20" />
                <p className="mt-4 text-sm font-medium text-white/90">Alex — AI Interviewer</p>
                <p className="mt-1 text-xs text-white/50">Speaking...</p>
              </div>
              <div className="space-y-3 p-6">
                <div className="rounded-xl bg-muted/50 p-3 text-sm">
                  <p className="text-xs font-medium text-primary">Interviewer</p>
                  <p className="mt-1 text-muted-foreground">Walk me through how you used React in your last project.</p>
                </div>
                <div className="rounded-xl bg-primary/10 p-3 text-sm">
                  <p className="text-xs font-medium text-primary">You</p>
                  <p className="mt-1">I built a dashboard with hooks and context for state...</p>
                </div>
                <div className="flex gap-2">
                  {["Listening", "Speaking", "Score: 8/10"].map((tag) => (
                    <span key={tag} className="rounded-full border px-2.5 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-border/50 bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-heading text-3xl font-bold md:text-4xl">Built for serious interview prep</h2>
            <p className="mt-3 text-muted-foreground">Everything you need to practice, improve, and track progress.</p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-border/60 bg-card/60 p-6 backdrop-blur-sm transition hover:border-primary/30 hover:shadow-lg">
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-2.5 text-primary transition group-hover:scale-110">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-heading font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <h2 className="text-center font-heading text-3xl font-bold md:text-4xl">How it works</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.step} className="relative rounded-2xl border border-border/60 p-6">
                <span className="font-heading text-4xl font-bold text-primary/20">{s.step}</span>
                <h3 className="mt-2 font-heading font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border/50 bg-muted/20 py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-heading text-3xl font-bold">Why candidates choose us</h2>
              <ul className="mt-6 space-y-4">
                {[
                  "Practice out loud — build real speaking confidence",
                  "Questions based on YOUR resume, not generic banks",
                  "3D AI interviewer with visible lip-sync",
                  "Track scores and improvement over time",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <p className="text-sm text-muted-foreground">Recent session</p>
              <p className="mt-2 font-heading text-2xl font-bold">JavaScript Technical</p>
              <p className="mt-4 text-4xl font-bold text-primary">8.5<span className="text-lg text-muted-foreground">/10</span></p>
              <p className="mt-4 text-sm text-muted-foreground">
                &ldquo;Strong fundamentals. Work on structuring answers with STAR format for behavioral follow-ups.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-20">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          <h2 className="text-center font-heading text-3xl font-bold">FAQ</h2>
          <div className="mt-10 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-border/60 p-5">
                <h3 className="font-medium">{f.q}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 py-20">
        <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
          <h2 className="font-heading text-3xl font-bold md:text-4xl">Ready to practice?</h2>
          <p className="mt-3 text-muted-foreground">Join and start your first AI voice interview in minutes.</p>
          <Link
            href={session ? "/interview" : "/login"}
            className={cn(buttonVariants({ size: "lg" }), "mt-8 gap-2")}
          >
            Get started free <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/50 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {productName}. AI-powered interview preparation.
      </footer>
    </div>
  );
}
