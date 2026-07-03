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
  Command,
  FileText,
  FolderOpen,
  Globe,
  GraduationCap,
  Home,
  Inbox,
  Megaphone,
  Package,
  Palette,
  Rocket,
  Settings,
  ShoppingBag,
  Target,
  Users,
  Workflow,
} from "lucide-react";

type BusinessSidebarProps = {
  businessId: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
  special?: boolean;
};

const navItems: NavItem[] = [
  { label: "Overview", href: "", icon: Home },
  {
    label: "Command Center",
    href: "command-center",
    icon: Command,
    special: true,
  },
  { label: "Products", href: "/products", icon: Package },
  { label: "AI Employees", href: "/ai-agents", icon: Bot },
  { label: "Storefront", href: "/storefront", icon: ShoppingBag },
  {
    label: "Website Builder",
    href: "/website",
    icon: Globe,
    special: true,
  },
  {
    label: "AI Funnel Builder",
    href: "/funnels",
    icon: Rocket,
    special: true,
  },
  { label: "Marketing", href: "/marketing", icon: Megaphone },
  { label: "CRM", href: "/crm", icon: Users },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Automation", href: "/automation", icon: Workflow },
  { label: "Content", href: "/content", icon: FileText },
  { label: "Branding", href: "/branding", icon: Palette },
  { label: "Sales", href: "/sales", icon: Target },
  { label: "Courses", href: "/courses", icon: GraduationCap },
  { label: "Community", href: "/community", icon: Users },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Finance", href: "/finance", icon: CircleDollarSign },
  { label: "Team", href: "/team", icon: BriefcaseBusiness },
  { label: "Inbox", href: "/inbox", icon: Inbox },
  { label: "Files", href: "/files", icon: FolderOpen },
  { label: "Apps", href: "/apps", icon: AppWindow },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function BusinessSidebar({ businessId }: BusinessSidebarProps) {
  const pathname = usePathname();
  const basePath = `/dashboard/business/${businessId}`;

  return (
    <aside className="hidden h-screen w-72 shrink-0 overflow-y-auto border-r border-white/10 bg-black/95 px-4 py-6 lg:block">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-200"
      >
        <ChevronLeft className="h-4 w-4" />
        Main Dashboard
      </Link>

      <Link
        href={`/dashboard/command-center?businessId=${businessId}`}
        className="mb-4 flex items-center gap-3 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/20"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          <Command className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-200">
            AI Command
          </p>
          <h2 className="mt-1 text-lg font-black text-white">Run Business</h2>
        </div>
      </Link>

      <Link
        href={`${basePath}/funnels`}
        className="mb-4 flex items-center gap-3 rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/20"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400 text-black">
          <Rocket className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-yellow-200">
            AI Funnels
          </p>
          <h2 className="mt-1 text-lg font-black text-white">Build Funnel</h2>
        </div>
      </Link>

      <Link
        href={`${basePath}/website`}
        className="mb-4 flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.04]"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
          <Globe className="h-5 w-5" />
        </div>

        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-zinc-500">
            AI Website
          </p>
          <h2 className="mt-1 text-lg font-black text-white">Build Website</h2>
        </div>
      </Link>

      <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-yellow-200">
          CreatorOS AI
        </p>

        <h2 className="mt-3 text-xl font-black text-white">Business OS</h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Manage your website, funnels, storefront, products, AI employees,
          customers, automations, and growth tools.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;

          const href =
            item.href === "command-center"
              ? `/dashboard/command-center?businessId=${businessId}`
              : `${basePath}${item.href}`;

          const active =
            item.href === "command-center"
              ? pathname === "/dashboard/command-center"
              : item.href === ""
                ? pathname === basePath
                : pathname.startsWith(`${basePath}${item.href}`);

          return (
            <Link
              key={item.label}
              href={href}
              className={
                active
                  ? "flex items-center gap-3 rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-black transition"
                  : item.special
                    ? "flex items-center gap-3 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-black text-yellow-200 transition hover:bg-yellow-400/20"
                    : "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-zinc-400 transition hover:bg-white/[0.04] hover:text-white"
              }
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}