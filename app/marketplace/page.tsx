import Link from "next/link";
import {
  AppWindow,
  Bot,
  BriefcaseBusiness,
  Download,
  Layers,
  Package,
  Search,
  Sparkles,
  Store,
  Workflow,
} from "lucide-react";
import Navbar from "@/components/Navbar";

const marketplaceItems = [
  {
    title: "AI Sales Employee",
    category: "AI Employee",
    description: "Install a trained AI sales rep for any creator business.",
    icon: Bot,
  },
  {
    title: "Premium Storefront Theme",
    category: "Theme",
    description: "A luxury black-and-gold storefront template.",
    icon: Store,
  },
  {
    title: "Music Promotion Business Kit",
    category: "Template",
    description: "Products, copy, pricing, FAQs, and marketing angles.",
    icon: BriefcaseBusiness,
  },
  {
    title: "Checkout Funnel Pack",
    category: "Sales Funnel",
    description: "Landing page, upsell, follow-up, and offer structure.",
    icon: Layers,
  },
  {
    title: "AI Follow-Up Workflow",
    category: "Automation",
    description: "Automated customer follow-ups after purchase or inquiry.",
    icon: Workflow,
  },
  {
    title: "Digital Product Starter Pack",
    category: "Products",
    description: "Ready-to-edit digital product ideas and offer templates.",
    icon: Package,
  },
  {
    title: "Creator App Extension",
    category: "App",
    description: "Extend CreatorOS AI with business-specific tools.",
    icon: AppWindow,
  },
];

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-[2rem] border border-yellow-400/20 bg-yellow-400/10 p-8 md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-yellow-400">
            CreatorOS AI Marketplace
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-7xl">
            Install AI employees, templates, apps, and business systems.
          </h1>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
            Discover AI-powered tools for creators, coaches, artists, agencies,
            sellers, and online businesses.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/ai-builder"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-4 font-bold text-black transition hover:bg-yellow-300"
            >
              Build With AI
              <Sparkles size={20} />
            </Link>

            <button className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 px-6 py-4 font-bold text-white transition hover:border-yellow-400/50">
              <Search size={20} />
              Browse Marketplace
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Bot className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">AI Employees</p>
            <h2 className="mt-2 text-3xl font-bold">Live Soon</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Store className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Templates</p>
            <h2 className="mt-2 text-3xl font-bold">Live Soon</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <AppWindow className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Apps</p>
            <h2 className="mt-2 text-3xl font-bold">Live Soon</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {marketplaceItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition hover:border-yellow-400/50"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                  <Icon size={28} />
                </div>

                <p className="mb-3 w-fit rounded-full border border-yellow-400/30 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                  {item.category}
                </p>

                <h2 className="text-2xl font-bold">{item.title}</h2>

                <p className="mt-3 leading-7 text-zinc-400">
                  {item.description}
                </p>

                <button className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 font-bold text-black transition hover:bg-yellow-300">
                  <Download size={18} />
                  Install
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}