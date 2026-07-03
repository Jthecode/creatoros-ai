import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  FileText,
  Globe,
  Layout,
  Sparkles,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import WebsiteBuilderClient from "./client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

type Business = {
  id: string;
  name: string;
  slug: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

type WebsitePage = {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  html_content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  is_homepage: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
};

async function loadWebsiteBuilder(id: string) {
  const [businessResult, pagesResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select(
        "id, name, slug, storefront_headline, storefront_subheadline, description, industry, audience"
      )
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("website_pages")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) return null;
  if (pagesResult.error) throw pagesResult.error;

  return {
    business: businessResult.data as Business,
    pages: (pagesResult.data ?? []) as WebsitePage[],
  };
}

export default async function WebsiteBuilder({ params }: Props) {
  const { id } = await params;
  const data = await loadWebsiteBuilder(id);

  if (!data) notFound();

  const { business, pages } = data;

  const publishedPages = pages.filter((page) => page.status === "published");
  const draftPages = pages.filter((page) => page.status !== "published");
  const homepage = pages.find((page) => page.is_homepage) ?? pages[0] ?? null;

  const previewHref = business.slug ? `/site/${business.slug}` : "#";

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
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Globe className="h-3.5 w-3.5" />
                  AI Website Builder
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Website for {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Generate, edit, publish, and preview a full AI-powered website
                  with pages, SEO, landing copy, and business content.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#website-builder"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Sparkles className="h-4 w-4" />
                  Generate Website
                </a>

                <Link
                  href={previewHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Eye className="h-4 w-4" />
                  Preview Site
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <FileText className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Total Pages</p>
            <h2 className="mt-2 text-3xl font-black">{pages.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Globe className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Published</p>
            <h2 className="mt-2 text-3xl font-black">
              {publishedPages.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Layout className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Drafts</p>
            <h2 className="mt-2 text-3xl font-black">{draftPages.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Sparkles className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Homepage</p>
            <h2 className="mt-2 truncate text-3xl font-black">
              {homepage ? "Ready" : "None"}
            </h2>
          </div>
        </div>

        <div id="website-builder">
          <WebsiteBuilderClient
            business={business}
            initialPages={pages}
          />
        </div>
      </section>
    </main>
  );
}