import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    businessSlug: string;
  }>;
};

type Business = {
  id: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

type WebsitePage = {
  id: string;
  title: string;
  slug: string;
  html_content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  is_homepage: boolean;
};

async function loadWebsiteHome(businessSlug: string) {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, tagline, description, industry, audience")
    .eq("slug", businessSlug)
    .single();

  if (businessError || !business) return null;

  const { data: pages, error: pagesError } = await supabaseAdmin
    .from("website_pages")
    .select("id, title, slug, html_content, seo_title, seo_description, status, is_homepage")
    .eq("business_id", business.id)
    .eq("status", "published")
    .order("is_homepage", { ascending: false })
    .order("created_at", { ascending: true });

  if (pagesError) throw pagesError;

  const publishedPages = (pages ?? []) as WebsitePage[];
  const homepage =
    publishedPages.find((page) => page.is_homepage) ?? publishedPages[0] ?? null;

  return {
    business: business as Business,
    homepage,
    pages: publishedPages,
  };
}

export async function generateMetadata({ params }: Props) {
  const { businessSlug } = await params;
  const data = await loadWebsiteHome(businessSlug);

  if (!data) {
    return {
      title: "Website Not Found",
    };
  }

  return {
    title:
      data.homepage?.seo_title ||
      `${data.business.name} | ${data.business.tagline || "Official Website"}`,
    description:
      data.homepage?.seo_description ||
      data.business.description ||
      `${data.business.name} powered by CreatorOS AI.`,
  };
}

export default async function WebsiteHomePage({ params }: Props) {
  const { businessSlug } = await params;
  const data = await loadWebsiteHome(businessSlug);

  if (!data) notFound();

  const { business, homepage, pages } = data;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <Link href={`/site/${business.slug}`} className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-400 text-black">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black text-white">{business.name}</p>
              <p className="text-xs text-zinc-500">
                {business.tagline || "Powered by CreatorOS AI"}
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap gap-2">
            {pages
              .filter((page) => !page.is_homepage)
              .slice(0, 6)
              .map((page) => (
                <Link
                  key={page.id}
                  href={`/site/${business.slug}/${page.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  {page.title}
                </Link>
              ))}
          </nav>
        </header>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-6 sm:p-10 lg:p-12">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                {business.industry || "AI Website"}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                {homepage?.title || business.name}
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                {homepage?.seo_description ||
                  business.description ||
                  "A premium business website powered by CreatorOS AI."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={`/site/${business.slug}/contact`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href={`/storefront/${business.slug}`}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  View Storefront
                </Link>
              </div>
            </div>
          </div>

          {homepage?.html_content ? (
            <div className="border-t border-white/10 p-6 sm:p-10 lg:p-12">
              <div
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-a:text-yellow-300 prose-strong:text-white"
                dangerouslySetInnerHTML={{
                  __html: homepage.html_content,
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {pages
            .filter((page) => !page.is_homepage)
            .slice(0, 6)
            .map((page) => (
              <Link
                key={page.id}
                href={`/site/${business.slug}/${page.slug}`}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
              >
                <h2 className="text-xl font-black">{page.title}</h2>
                <p className="mt-3 text-sm leading-6 text-zinc-400">
                  {page.seo_description ||
                    `Learn more about ${page.title.toLowerCase()} from ${business.name}.`}
                </p>
              </Link>
            ))}
        </div>

        <footer className="border-t border-white/10 py-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} {business.name}. Powered by CreatorOS AI.
        </footer>
      </section>
    </main>
  );
}