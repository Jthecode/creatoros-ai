"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Download,
  Filter,
  Loader2,
  Package,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Wand2,
  Zap,
} from "lucide-react";

type MarketplaceCategory =
  | "all"
  | "ai-modules"
  | "templates"
  | "automations"
  | "storefronts"
  | "marketing"
  | "sales"
  | "operations";

type MarketplaceItem = {
  id: string;
  title: string;
  description: string;
  category: Exclude<MarketplaceCategory, "all">;
  price: string;
  rating: number;
  installs: number;
  featured: boolean;
  creator: string;
  tags: string[];
  settings?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
};

type Props = {
  businessId?: string;
  installedAppIds?: string[];
};

const categories: { value: MarketplaceCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ai-modules", label: "AI Modules" },
  { value: "templates", label: "Templates" },
  { value: "automations", label: "Automations" },
  { value: "storefronts", label: "Storefronts" },
  { value: "marketing", label: "Marketing" },
  { value: "sales", label: "Sales" },
  { value: "operations", label: "Operations" },
];

const marketplaceItems: MarketplaceItem[] = [
  {
    id: "ai-sales-agent",
    title: "AI Sales Agent",
    description:
      "Install a trained AI sales assistant that follows up with leads, answers questions, and helps close customers.",
    category: "ai-modules",
    price: "Free",
    rating: 4.9,
    installs: 1240,
    featured: true,
    creator: "CreatorOS AI",
    tags: ["Sales", "Leads", "AI Employee"],
    settings: {
      autoCreateAgent: true,
      showOnStorefront: true,
    },
  },
  {
    id: "lead-follow-up",
    title: "Lead Follow-Up Automation",
    description:
      "Automatically send follow-up messages when someone submits a form or joins your customer list.",
    category: "automations",
    price: "Free",
    rating: 4.8,
    installs: 980,
    featured: true,
    creator: "CreatorOS AI",
    tags: ["Automation", "CRM", "Sales"],
    settings: {
      autoCreateAutomation: true,
      runMode: "manual",
    },
  },
  {
    id: "premium-storefront",
    title: "Premium Storefront Template",
    description:
      "A high-converting storefront layout built for digital products, services, coaching, and creator brands.",
    category: "storefronts",
    price: "$29",
    rating: 4.9,
    installs: 740,
    featured: true,
    creator: "CreatorOS AI",
    tags: ["Storefront", "Design", "Checkout"],
    settings: {
      showProducts: true,
      showLeadForm: true,
      showAIChat: true,
    },
  },
  {
    id: "email-campaign-kit",
    title: "Email Campaign Kit",
    description:
      "Generate launch emails, abandoned checkout emails, welcome sequences, and customer retention campaigns.",
    category: "marketing",
    price: "$19",
    rating: 4.7,
    installs: 620,
    featured: false,
    creator: "CreatorOS AI",
    tags: ["Email", "Marketing", "Launch"],
    settings: {
      autoCreateAutomation: true,
    },
  },
  {
    id: "business-plan-template",
    title: "AI Business Plan Template",
    description:
      "Turn any business idea into a structured business plan with offers, pricing, target audience, and growth strategy.",
    category: "templates",
    price: "Free",
    rating: 4.8,
    installs: 1510,
    featured: false,
    creator: "CreatorOS AI",
    tags: ["Planning", "Startup", "Strategy"],
  },
  {
    id: "support-bot",
    title: "Customer Support Bot",
    description:
      "Add a support AI that can answer FAQs, explain products, and help customers before and after checkout.",
    category: "ai-modules",
    price: "$39",
    rating: 4.9,
    installs: 530,
    featured: false,
    creator: "CreatorOS AI",
    tags: ["Support", "AI Employee", "Customers"],
    settings: {
      autoCreateAgent: true,
      showOnStorefront: true,
    },
  },
];

function getItemIcon(category: MarketplaceItem["category"]) {
  if (category === "ai-modules") return Bot;
  if (category === "automations") return Zap;
  if (category === "templates") return Wand2;
  return Package;
}

export default function MarketplaceClient({
  businessId,
  installedAppIds = [],
}: Props) {
  const searchParams = useSearchParams();

  const resolvedBusinessId =
    businessId || searchParams.get("businessId") || searchParams.get("business_id") || "";

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<MarketplaceCategory>("all");
  const [installed, setInstalled] = useState<string[]>(installedAppIds);
  const [installingId, setInstallingId] = useState("");
  const [error, setError] = useState("");

  const filteredItems = useMemo(() => {
    return marketplaceItems.filter((item) => {
      const search = query.toLowerCase();

      const matchesQuery =
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search) ||
        item.tags.some((tag) => tag.toLowerCase().includes(search));

      const matchesCategory =
        category === "all" ? true : item.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  const featuredItems = useMemo(() => {
    return marketplaceItems.filter((item) => item.featured);
  }, []);

  async function installItem(item: MarketplaceItem) {
    if (!resolvedBusinessId) {
      setError(
        "Choose a business first. Open marketplace from a business dashboard or use ?businessId=YOUR_BUSINESS_ID."
      );
      return;
    }

    if (installed.includes(item.id) || installingId) return;

    try {
      setInstallingId(item.id);
      setError("");

      const res = await fetch("/api/marketplace/install", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessId: resolvedBusinessId,
          marketplaceAppId: item.id,
          title: item.title,
          description: item.description,
          category: item.category,
          settings: item.settings ?? {},
          metadata: {
            ...(item.metadata ?? {}),
            price: item.price,
            rating: item.rating,
            creator: item.creator,
            tags: item.tags,
          },
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        throw new Error(data?.error || "Unable to install marketplace app.");
      }

      setInstalled((current) =>
        current.includes(item.id) ? current : [...current, item.id]
      );
    } catch (installError) {
      console.error(installError);
      setError(
        installError instanceof Error
          ? installError.message
          : "Unable to install marketplace app."
      );
    } finally {
      setInstallingId("");
    }
  }

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {error ? (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-200">
                <ShoppingBag className="h-3.5 w-3.5" />
                CreatorOS AI Marketplace
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Install AI tools for your business
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-400 sm:text-base">
                Browse AI modules, automations, templates, storefronts, and
                business apps built to help creators launch and grow faster.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Open Dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#marketplace-library"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  Browse Modules
                  <Package className="h-4 w-4" />
                </a>
              </div>

              {resolvedBusinessId ? (
                <p className="mt-4 text-xs text-zinc-500">
                  Installing apps into business:{" "}
                  <span className="font-mono text-yellow-200">
                    {resolvedBusinessId}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Marketplace Apps</p>
            <p className="mt-2 text-2xl font-black">{marketplaceItems.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Featured Tools</p>
            <p className="mt-2 text-2xl font-black">{featuredItems.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Installed</p>
            <p className="mt-2 text-2xl font-black">{installed.length}</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-xs text-zinc-500">Top Rating</p>
            <p className="mt-2 text-2xl font-black">4.9</p>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                <Sparkles className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-yellow-100">
                  Featured Marketplace Picks
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-yellow-100/70">
                  Start with these core tools to turn a basic business profile
                  into a full AI-powered business system.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {featuredItems.map((item) => {
                const isInstalled = installed.includes(item.id);
                const isInstalling = installingId === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => installItem(item)}
                    disabled={isInstalled || isInstalling}
                    className={
                      isInstalled
                        ? "rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-2 text-xs font-bold text-emerald-300"
                        : "rounded-full border border-yellow-400/20 bg-black/30 px-3 py-2 text-xs font-bold text-yellow-100 transition hover:bg-yellow-400/10 disabled:opacity-60"
                    }
                  >
                    {isInstalling ? "Installing..." : isInstalled ? "Installed" : "Install"}{" "}
                    {item.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div
          id="marketplace-library"
          className="grid gap-6 lg:grid-cols-[280px_1fr]"
        >
          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <Filter className="h-5 w-5 text-yellow-200" />
              <h2 className="font-bold">Categories</h2>
            </div>

            <div className="mt-5 space-y-2">
              {categories.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setCategory(item.value)}
                  className={
                    category === item.value
                      ? "flex w-full items-center justify-between rounded-2xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-left text-sm font-bold text-yellow-200"
                      : "flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-left text-sm font-bold text-zinc-400 transition hover:text-white"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-yellow-200" />
                <p className="text-sm font-black">AI Recommendation</p>
              </div>

              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Start with Sales Agent, Lead Follow-Up, and Premium Storefront
                for the strongest MVP flow.
              </p>
            </div>
          </aside>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-black">Marketplace Library</h2>
                <p className="text-sm text-zinc-500">
                  {filteredItems.length} item
                  {filteredItems.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="relative w-full md:max-w-sm">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search marketplace..."
                  className="w-full rounded-2xl border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-yellow-400/40"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => {
                const isInstalled = installed.includes(item.id);
                const isInstalling = installingId === item.id;
                const Icon = getItemIcon(item.category);

                return (
                  <div
                    key={item.id}
                    className="flex flex-col rounded-3xl border border-white/10 bg-black/40 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="rounded-2xl bg-yellow-400/10 p-3 text-yellow-200">
                        <Icon className="h-5 w-5" />
                      </div>

                      {item.featured ? (
                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-yellow-200">
                          Featured
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 flex-1">
                      <h3 className="text-lg font-black">{item.title}</h3>

                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        {item.description}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-5 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between gap-3 text-xs text-zinc-500">
                        <div className="flex items-center gap-1 text-yellow-200">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          <span className="font-bold">{item.rating}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Download className="h-3.5 w-3.5" />
                          <span>{item.installs.toLocaleString()}</span>
                        </div>

                        <span>{item.price}</span>
                      </div>

                      <button
                        onClick={() => installItem(item)}
                        disabled={isInstalled || isInstalling}
                        className={
                          isInstalled
                            ? "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm font-black text-emerald-300"
                            : "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-4 py-3 text-sm font-black text-black transition hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                        }
                      >
                        {isInstalling ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Installing...
                          </>
                        ) : isInstalled ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Installed
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Install Module
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-dashed border-white/10 bg-black/30 p-10 text-center">
                <Package className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="mt-4 font-black">No marketplace items found</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">
                  Try a different search term or category.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}