"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { mainNav, productName } from "@/lib/navigation";

type Props = {
  collapsed?: boolean;
  onNavigate?: () => void;
  showBrand?: boolean;
};

export function SidebarNav({
  collapsed = false,
  onNavigate,
  showBrand = true,
}: Props) {
  const pathname = usePathname();

  return (
    <>
      {showBrand && (
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 text-sky-700 dark:text-sky-300">
            <Sparkles className="size-4" />
          </div>
          {!collapsed && (
            <div>
              <p className="font-heading text-sm font-semibold">{productName}</p>
              <p className="text-xs text-muted-foreground">Interview Studio</p>
            </div>
          )}
        </div>
      )}

      <nav className="space-y-1">
        {mainNav.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href)) ||
            (item.href === "/interview" && pathname.startsWith("/voice"));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-sky-500/12 text-sky-800 shadow-sm dark:text-sky-200"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
              )}
            >
              <item.icon
                className={cn(
                  "size-5 shrink-0 transition-transform duration-200",
                  active && "scale-105",
                )}
              />
              {!collapsed && <span>{item.title}</span>}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
