import Link from "next/link";
import { Sparkles } from "lucide-react";
import { productName } from "@/lib/navigation";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <div className="gradient-mesh pointer-events-none fixed inset-0 -z-10" />
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden flex-col justify-between border-r border-border/50 bg-card/30 p-10 lg:flex">
          <Link href="/" className="flex items-center gap-2 font-heading text-lg font-semibold">
            <Sparkles className="size-5 text-primary" />
            {productName}
          </Link>
          <div>
            <h2 className="font-heading text-3xl font-bold leading-tight">
              Practice interviews that feel <span className="text-gradient">real</span>
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Upload your resume, pick a skill or project, and start a live AI voice mock interview with instant feedback.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {productName}</p>
        </div>
        <div className="flex flex-col">
          <div className="flex justify-center p-6 lg:hidden">
            <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
              <Sparkles className="size-5 text-primary" />
              {productName}
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-center p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
