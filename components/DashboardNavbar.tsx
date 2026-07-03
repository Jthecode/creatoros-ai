import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  Command,
  Globe,
  LayoutDashboard,
  ShoppingBag,
  Sparkles,
} from "lucide-react";

type DashboardNavbarProps = {
  businessId?: string;
};

export default function DashboardNavbar({ businessId }: DashboardNavbarProps) {
  const commandHref = businessId
    ? `/dashboard/command-center?businessId=${businessId}`
    : "/dashboard";

  const websiteHref = businessId
    ? `/dashboard/business/${businessId}/website`
    : "/dashboard";

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Command Center",
      href: commandHref,
      icon: Command,
    },
    {
      label: "Website Builder",
      href: websiteHref,
      icon: Globe,
    },
    {
      label: "AI Builder",
      href: "/ai-builder",
      icon: Sparkles,
    },
    {
      label: "Marketplace",
      href: "/marketplace",
      icon: ShoppingBag,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400 text-black">
            <Bot className="h-5 w-5" />
          </div>

          <div>
            <p className="text-sm font-black leading-none text-white">
              CreatorOS AI
            </p>
            <p className="mt-1 text-xs text-zinc-500">Business OS</p>
          </div>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          {links.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.label}
                href={link.href}
                className="inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold text-zinc-400 transition hover:bg-white/[0.04] hover:text-yellow-200"
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        <Link
          href={commandHref}
          className="hidden items-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-2 text-sm font-black text-yellow-200 transition hover:bg-yellow-400/20 sm:inline-flex"
        >
          <Command className="h-4 w-4" />
          Command
        </Link>

        <Link
          href="/ai-builder"
          className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-4 py-2 text-sm font-black text-black transition hover:bg-yellow-300"
        >
          <BriefcaseBusiness className="h-4 w-4" />
          Build
        </Link>
      </nav>
    </header>
  );
}