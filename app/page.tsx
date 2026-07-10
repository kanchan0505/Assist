import Link from "next/link";
import { auth } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const session = await auth();

  return (
    <main className="flex flex-1 flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-semibold">ResumeInterview</span>
          <Link
            href={session ? "/dashboard" : "/login"}
            className={cn(buttonVariants())}
          >
            {session ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-4xl flex-1 flex-col justify-center px-4 py-16">
        <p className="mb-4 text-sm font-medium text-primary">
          AI-Powered Voice Interview Prep
        </p>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Practice real technical interviews out loud
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
          Upload your resume. Our AI extracts your skills and projects, then runs
          live voice mock interviews tailored to what you actually claim — powered
          by Vapi.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href={session ? "/dashboard" : "/login"}
            className={cn(buttonVariants({ size: "lg" }))}
          >
            {session ? "Go to dashboard" : "Get started free"}
          </Link>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Resume-driven",
              desc: "Interviews focus on skills and projects from your resume.",
            },
            {
              title: "Live voice",
              desc: "Speak naturally with an AI interviewer via Vapi — no typing required.",
            },
            {
              title: "AI debrief",
              desc: "Get a scored summary with strengths and areas to improve after each session.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border p-6">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
