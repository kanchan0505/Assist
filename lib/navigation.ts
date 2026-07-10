import {
  BarChart3,
  FileUser,
  History,
  LayoutDashboard,
  Mic,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
};

export const mainNav: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "AI Interview", href: "/interview", icon: Mic },
  { title: "Resume Profile", href: "/resume", icon: FileUser },
  { title: "Progress Analytics", href: "/analytics", icon: BarChart3 },
  { title: "Interview History", href: "/history", icon: History },
  { title: "Settings", href: "/settings", icon: Settings },
];

export const productName = "ResumeInterview";
export const productTagline = "AI Voice Interview Platform";
