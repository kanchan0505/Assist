import Link from "next/link";
import { signIn } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield } from "lucide-react";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md border-border/60 bg-card/80 shadow-xl backdrop-blur-xl">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to access your dashboard, resume profile, and AI voice interviews.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <Button type="submit" className="w-full gap-2" size="lg">
            Continue with Google
            <ArrowRight className="size-4" />
          </Button>
        </form>

        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
          <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
          <p>
            Secure OAuth sign-in. We only use your profile to personalize interviews.
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our terms.{" "}
          <Link href="/" className="text-primary hover:underline">
            Learn more
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
