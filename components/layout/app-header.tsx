"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Menu, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type Props = {
  title?: string;
  description?: string;
  sidebarCollapsed: boolean;
  onSidebarToggle: () => void;
  mobileMenu?: React.ReactNode;
};

export function AppHeader({
  title,
  description,
  sidebarCollapsed,
  onSidebarToggle,
  mobileMenu,
}: Props) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const initials =
    session?.user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        {mobileMenu}

        <div>
          {title && (
            <h1 className="font-heading text-lg font-semibold leading-tight md:text-xl">
              {title}
            </h1>
          )}
          {description && (
            <p className="hidden text-sm text-muted-foreground sm:block">{description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="hidden sm:inline-flex"
          onClick={onSidebarToggle}
          aria-label="Toggle sidebar"
        >
          <Menu className="size-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="size-4 rotate-0 scale-100 transition dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="relative size-9 rounded-full p-0">
                <Avatar className="size-9">
                  <AvatarImage src={session?.user?.image ?? undefined} alt={session?.user?.name ?? ""} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{session?.user?.name ?? "User"}</p>
              <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/settings">Settings</Link>} />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-destructive"
            >
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
