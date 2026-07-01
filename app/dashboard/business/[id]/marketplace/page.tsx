import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Bot,
  Download,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
  Zap,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import InstalledAppsPanel from "@/components/InstalledAppsPanel";
import MarketplaceClient from "@/app/marketplace/client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
};

type InstalledAppRow = {
  id: string;
  business_id: string;
  marketplace_app_id: string;
  title: string;
  description: string | null;
  category: string;
  icon: string | null;
  status: "active" | "paused" | "removed";
  settings: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function loadBusinessMarketplace(id: string) {
  const [businessResult, installedAppsResult, productsResult, aiAgentsResult] =
    await Promise.all([
      supabaseAdmin
        .from("businesses")
        .select("id, name, slug, description")
        .eq("id", id)
        .single(),

      supabaseAdmin
        .from("installed_apps")
        .select("*")
        .eq("business_id", id)
        .neq("status", "removed")
        .order("created_at", {
          ascending: false,
        }),

      supabaseAdmin
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id),

      supabaseAdmin
        .from("ai_agents")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id),
    ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (installedAppsResult.error) throw installedAppsResult.error;
  if (productsResult.error) throw productsResult.error;
  if (aiAgentsResult.error) throw aiAgentsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    installedApps: (installedAppsResult.data ?? []) as InstalledAppRow[],
    productsCount: productsResult.count ?? 0,
    aiAgentsCount: aiAgentsResult.count ?? 0,
  };
}

export default async function BusinessMarketplacePage({ params }: Props) {
  const { id } = await params;
  const data = await loadBusinessMarketplace(id);

  if (!data) {
    notFound();
  }

  const { business, installedApps, productsCount, aiAgentsCount } = data;

  const activeApps = installedApps.filter((app) => app.status === "active");
  const pausedApps = installedApps.filter((app) => app.status === "paused");
  const installedAppIds = installedApps.map((app) => app.marketplace_app_id);

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/businesses/${business.id}`}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  CreatorOS Marketplace
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {business.name} Marketplace
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Install AI apps, business automations, storefront upgrades,
                  templates, CRM tools, analytics modules, and premium CreatorOS
                  capabilities into this business.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link
                  href={`/marketplace?businessId=${business.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Browse Full Marketplace
                  <Download className="h-4 w-4" />
                </Link>

                {business.slug ? (
                  <Link
                    href={`/storefront/${business.slug}`}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                  >
                    View Storefront
                    <Store className="h-4 w-4" />
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Package className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Installed Apps</p>
            <h2 className="mt-2 text-3xl font-black">{installedApps.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Sparkles className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Active Apps</p>
            <h2 className="mt-2 text-3xl font-black text-emerald-300">
              {activeApps.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Settings className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Paused Apps</p>
            <h2 className="mt-2 text-3xl font-black">{pausedApps.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Store className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Products</p>
            <h2 className="mt-2 text-3xl font-black">{productsCount}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">AI Employees</p>
            <h2 className="mt-2 text-3xl font-black">{aiAgentsCount}</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Link
            href={`/marketplace?businessId=${business.id}`}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
          >
            <Download className="h-9 w-9 text-yellow-200" />

            <h3 className="mt-5 text-xl font-black">Browse Marketplace</h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Install AI modules, templates, automations, and storefront
              upgrades directly into this business.
            </p>
          </Link>

          <Link
            href={`/dashboard/businesses/${business.id}/automations`}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
          >
            <Zap className="h-9 w-9 text-yellow-200" />

            <h3 className="mt-5 text-xl font-black">AI Automations</h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Manage installed automations, lead follow-up flows, and AI
              workflows for this business.
            </p>
          </Link>

          <Link
            href={`/dashboard/businesses/${business.id}/files`}
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
          >
            <Settings className="h-9 w-9 text-yellow-200" />

            <h3 className="mt-5 text-xl font-black">Business Assets</h3>

            <p className="mt-3 text-sm leading-6 text-zinc-400">
              Manage logos, branding assets, AI files, contracts, and marketing
              materials.
            </p>
          </Link>
        </div>

        <InstalledAppsPanel
          businessId={business.id}
          initialApps={installedApps}
        />

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
              <Sparkles className="h-6 w-6" />
            </div>

            <div>
              <h2 className="text-2xl font-black text-yellow-100">
                Install More Apps
              </h2>

              <p className="mt-3 max-w-3xl text-sm leading-7 text-yellow-100/75">
                Apps installed here can automatically create AI employees,
                automations, storefront widgets, CRM tools, analytics modules,
                payment integrations, and future premium business capabilities.
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black/40">
            <MarketplaceClient
              businessId={business.id}
              installedAppIds={installedAppIds}
            />
          </div>
        </div>
      </section>
    </main>
  );
}