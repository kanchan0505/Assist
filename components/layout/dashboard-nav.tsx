"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function DashboardNav() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/dashboard" className="text-lg font-semibold">
          ResumeInterview
        </Link>
        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
            Dashboard
          </Link>
          <Link href="/onboarding/upload" className="text-muted-foreground hover:text-foreground">
            Resume
          </Link>
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full p-0"
                aria-label="Open account menu"
              >
                <Avatar className="h-9 w-9">
                  <AvatarImage src={session?.user?.image ?? undefined} />
                  <AvatarFallback>
                    {session?.user?.name?.[0]?.toUpperCase() ?? "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
