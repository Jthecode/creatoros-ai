"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  BriefcaseBusiness,
  Home,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Workflow,
} from "lucide-react";

type MobileBusinessNavProps = {
  businessId: string;
};

export default function MobileBusinessNav({
  businessId,
}: MobileBusinessNavProps) {
  const pathname = usePathname();

  const items = [
    {
      label: "Home",
      href: `/dashboard/business/${businessId}`,
      icon: Home,
    },
    {
      label: "Products",
      href: `/dashboard/business/${businessId}/products`,
      icon: Package,
    },
    {
      label: "Orders",
      href: `/dashboard/business/${businessId}/orders`,
      icon: ShoppingCart,
    },
    {
      label: "Store",
      href: `/storefront/${businessId}`,
      icon: Store,
    },
    {
      label: "AI",
      href: `/dashboard/business/${businessId}/employees`,
      icon: Bot,
    },
    {
      label: "CRM",
      href: `/dashboard/business/${businessId}/crm`,
      icon: BriefcaseBusiness,
    },
    {
      label: "Automation",
      href: `/dashboard/business/${businessId}/automation`,
      icon: Workflow,
    },
    {
      label: "Analytics",
      href: `/dashboard/business/${businessId}/analytics`,
      icon: BarChart3,
    },
    {
      label: "Settings",
      href: `/dashboard/business/${businessId}/settings`,
      icon: Settings,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/95 backdrop-blur-xl lg:hidden">
      <div className="flex overflow-x-auto">
        {items.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href ||
            pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-[88px] flex-col items-center justify-center gap-2 px-4 py-3 transition ${
                active
                  ? "text-yellow-400"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              <Icon size={22} />

              <span className="text-[11px] font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}