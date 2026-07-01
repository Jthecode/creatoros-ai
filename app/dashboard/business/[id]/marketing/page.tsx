import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CalendarDays,
  Mail,
  Megaphone,
  PenTool,
  Search,
  Sparkles,
  Video,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

async function loadMarketingPage(id: string) {
  const [businessResult, generationsResult, eventsResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug, description, industry, audience")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id)
      .eq("module", "marketing"),

    supabaseAdmin
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .eq("business_id", id)
      .eq("source", "marketing"),
  ]);

  if (businessResult.error || !businessResult.data) return null;
  if (generationsResult.error) throw generationsResult.error;
  if (eventsResult.error) throw eventsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    generatedAssets: generationsResult.count ?? 0,
    campaigns: eventsResult.count ?? 0,
  };
}

const marketingTools = [
  {
    title: "Social Media Posts",
    description: "Generate Instagram, X, LinkedIn, and Facebook posts.",
    icon: Megaphone,
  },
  {
    title: "TikTok & Reels Captions",
    description: "Create short-form video hooks, captions, and hashtags.",
    icon: Video,
  },
  {
    title: "Email Campaigns",
    description: "Write welcome emails, promos, launches, and follow-ups.",
    icon: Mail,
  },
  {
    title: "Blog Articles",
    description: "Generate SEO blog posts for traffic and authority.",
    icon: PenTool,
  },
  {
    title: "SEO Keywords",
    description: "Find keywords, titles, descriptions, and search angles.",
    icon: Search,
  },
  {
    title: "Launch Calendar",
    description: "Plan a 7-day, 14-day, or 30-day marketing rollout.",
    icon: CalendarDays,
  },
];

export default async function MarketingPage({ params }: Props) {
  const { id } = await params;
  const data = await loadMarketingPage(id);

  if (!data) notFound();

  const { business, generatedAssets, campaigns } = data;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Megaphone className="h-3.5 w-3.5" />
                  AI Marketing Center
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Market {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Generate campaigns, social posts, emails, blogs, ads, SEO
                  content, and launch plans for your creator business.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#marketing-tools"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Campaign
                </a>

                <a
                  href="#marketing-brief"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <CalendarDays className="h-4 w-4" />
                  Build Calendar
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Megaphone className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Campaigns</p>
            <h2 className="mt-2 text-3xl font-black">{campaigns}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <PenTool className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Generated Assets</p>
            <h2 className="mt-2 text-3xl font-black">{generatedAssets}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <BarChart3 className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Marketing Score</p>
            <h2 className="mt-2 text-3xl font-black">Ready</h2>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div
            id="marketing-tools"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:col-span-2"
          >
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-yellow-200" />
              <h2 className="text-2xl font-black">Marketing Tools</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {marketingTools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <button
                    key={tool.title}
                    type="button"
                    className="rounded-3xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-200">
                      <Icon className="h-5 w-5" />
                    </div>

                    <h3 className="text-lg font-black">{tool.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {tool.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div
            id="marketing-brief"
            className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6"
          >
            <h2 className="text-2xl font-black text-yellow-100">
              AI Marketing Brief
            </h2>

            <div className="mt-5 space-y-4 text-sm leading-6 text-yellow-100/75">
              <p>
                <span className="font-black text-yellow-200">Business:</span>{" "}
                {business.name}
              </p>

              <p>
                <span className="font-black text-yellow-200">Industry:</span>{" "}
                {business.industry || "Not set"}
              </p>

              <p>
                <span className="font-black text-yellow-200">Audience:</span>{" "}
                {business.audience || "Not set"}
              </p>

              <p>
                <span className="font-black text-yellow-200">
                  Description:
                </span>{" "}
                {business.description || "No description yet."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}