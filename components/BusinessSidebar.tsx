"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AppWindow,
  BarChart3,
  Bot,
  BriefcaseBusiness,
  CalendarDays,
  ChevronLeft,
  CircleDollarSign,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Home,
  Inbox,
  Megaphone,
  Package,
  Palette,
  Settings,
  ShoppingBag,
  Target,
  Users,
  Workflow,
} from "lucide-react";

type BusinessSidebarProps = {
  businessId: string;
};

const navItems = [
  {
    label: "Overview",
    href: "",
    icon: Home,
  },
  {
    label: "Products",
    href: "/products",
    icon: Package,
  },
  {
    label: "AI Employees",
    href: "/employees",
    icon: Bot,
  },
  {
    label: "Website",
    href: "/website",
    icon: Globe,
  },
  {
    label: "Marketing",
    href: "/marketing",
    icon: Megaphone,
  },
  {
    label: "CRM",
    href: "/crm",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Automation",
    href: "/automation",
    icon: Workflow,
  },
  {
    label: "Content",
    href: "/content",
    icon: FileText,
  },
  {
    label: "Branding",
    href: "/branding",
    icon: Palette,
  },
  {
    label: "Sales",
    href: "/sales",
    icon: Target,
  },
  {
    label: "Courses",
    href: "/courses",
    icon: GraduationCap,
  },
  {
    label: "Community",
    href: "/community",
    icon: Users,
  },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
  },
  {
    label: "Finance",
    href: "/finance",
    icon: CircleDollarSign,
  },
  {
    label: "Team",
    href: "/team",
    icon: BriefcaseBusiness,
  },
  {
    label: "Inbox",
    href: "/inbox",
    icon: Inbox,
  },
  {
    label: "Files",
    href: "/files",
    icon: FolderOpen,
  },
  {
    label: "Apps",
    href: "/apps",
    icon: AppWindow,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export default function BusinessSidebar({
  businessId,
}: BusinessSidebarProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/business/${businessId}`;

  return (
    <aside className="hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-black/95 px-4 py-6 lg:block">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
      >
        <ChevronLeft size={18} />
        Main Dashboard
      </Link>

      <div className="mb-6 rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400">
          CreatorOS AI
        </p>

        <h2 className="mt-3 text-xl font-bold text-white">
          Business OS
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Manage every part of this creator business.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const href = `${basePath}${item.href}`;
          const Icon = item.icon;

          const active =
            item.href === ""
              ? pathname === basePath
              : pathname.startsWith(href);

          return (
            <Link
              key={item.label}
              href={href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-yellow-400 text-black"
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}