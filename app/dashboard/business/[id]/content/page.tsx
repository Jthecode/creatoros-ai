import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Mail,
  Megaphone,
  PenLine,
  Podcast,
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
  description: string | null;
  industry: string | null;
  audience: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name, description, industry, audience")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return data as BusinessRow;
}

const contentTools = [
  {
    title: "Blog Article",
    description: "Generate SEO-friendly blog posts for your business.",
    icon: BookOpen,
  },
  {
    title: "Newsletter",
    description: "Create email newsletters for leads and customers.",
    icon: Mail,
  },
  {
    title: "Press Release",
    description: "Write professional announcements for launches and updates.",
    icon: Megaphone,
  },
  {
    title: "Video Script",
    description: "Generate scripts for TikTok, YouTube, reels, and ads.",
    icon: Video,
  },
  {
    title: "Podcast Script",
    description: "Create podcast episode outlines, intros, and talking points.",
    icon: Podcast,
  },
  {
    title: "Product Description",
    description: "Turn rough product ideas into premium sales copy.",
    icon: FileText,
  },
];

export default async function ContentStudioPage({ params }: Props) {
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
            AI Content Studio
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Create Content for {business.name}
          </h1>

          <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
            Generate blogs, newsletters, scripts, press releases, product copy,
            landing page copy, and long-form business content with AI.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
              <Sparkles size={18} />
              Generate Content
            </button>

            <button className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50">
              <PenLine size={18} />
              Start Writing
            </button>
          </div>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <FileText className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Generated Assets</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <BookOpen className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Blog Drafts</p>
            <h2 className="mt-2 text-3xl font-bold">0</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <Sparkles className="mb-4 text-yellow-400" />
            <p className="text-sm text-zinc-400">Content Engine</p>
            <h2 className="mt-2 text-3xl font-bold">Ready</h2>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <div className="mb-6 flex items-center gap-3">
              <Sparkles className="text-yellow-400" />
              <h2 className="text-2xl font-bold">Content Tools</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {contentTools.map((tool) => {
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
            <h2 className="text-2xl font-bold">AI Content Brief</h2>

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