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
  params: Promise<{
    id: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, description, industry, audience")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as BusinessRow;
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
  const business = await loadBusiness(id);

  if (!business) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Link
          href={`/dashboard/business/${business.id}`}
          className="mb-8 inline-flex items-center gap-2 text-yellow-400 hover:text-yellow-300"
        >
          <ArrowLeft size={18} />
          Back to Business
        </Link>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">
            AI Marketing Center
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Market {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Generate campaigns, social posts, emails, blogs, ads, SEO content,
            and launch plans for your creator business.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Sparkles size={18} />
              Generate Campaign
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <CalendarDays size={18} />
              Build 30-Day Calendar
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Megaphone className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Campaigns</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <PenTool className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Generated Assets</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <BarChart3 className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Marketing Score</p>
            <h2 className="mt-2 text-3xl font-bold">New</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="text-yellow-400" />
              <h2 className="text-2xl font-bold">Marketing Tools</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {marketingTools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <button
                    key={tool.title}
                    className="rounded-3xl border border-white/10 bg-black/40 p-5 text-left transition hover:border-yellow-400/50"
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                      <Icon size={22} />
                    </div>

                    <h3 className="text-lg font-bold">{tool.title}</h3>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {tool.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6">
            <h2 className="text-2xl font-bold">AI Marketing Brief</h2>

            <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-300">
              <p>
                <span className="font-bold text-yellow-400">Business:</span>{" "}
                {business.name}
              </p>

              <p>
                <span className="font-bold text-yellow-400">Industry:</span>{" "}
                {business.industry || "Not set"}
              </p>

              <p>
                <span className="font-bold text-yellow-400">Audience:</span>{" "}
                {business.audience || "Not set"}
              </p>

              <p>
                <span className="font-bold text-yellow-400">Description:</span>{" "}
                {business.description || "No description yet."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}