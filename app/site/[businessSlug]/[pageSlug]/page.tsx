import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    businessSlug: string;
    pageSlug: string;
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
  business_id: string;
  title: string;
  slug: string;
  html_content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  is_homepage: boolean;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

async function loadWebsitePage(businessSlug: string, pageSlug: string) {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, tagline, description, industry, audience")
    .eq("slug", businessSlug)
    .single();

  if (businessError || !business) return null;

  const { data: page, error: pageError } = await supabaseAdmin
    .from("website_pages")
    .select(
      "id, business_id, title, slug, html_content, seo_title, seo_description, status, is_homepage"
    )
    .eq("business_id", business.id)
    .eq("slug", pageSlug)
    .eq("status", "published")
    .single();

  if (pageError || !page) return null;

  return {
    business: business as Business,
    page: page as WebsitePage,
  };
}

export async function generateMetadata({ params }: Props) {
  const { businessSlug, pageSlug } = await params;
  const data = await loadWebsitePage(businessSlug, pageSlug);

  if (!data) {
    return {
      title: "Page Not Found",
    };
  }

  const { business, page } = data;

  return {
    title: page.seo_title || `${page.title} | ${business.name}`,
    description:
      page.seo_description ||
      business.description ||
      `${page.title} by ${business.name}`,
  };
}

export default async function WebsiteSubPage({ params }: Props) {
  const { businessSlug, pageSlug } = await params;
  const data = await loadWebsitePage(businessSlug, pageSlug);

  if (!data) notFound();

  const { business, page } = data;

  const hasHtml = Boolean(page.html_content?.trim());
  const plainText = hasHtml ? stripHtml(page.html_content ?? "") : "";

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
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

          <Link
            href={`/site/${business.slug}`}
            className="inline-flex w-fit items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Back Home
          </Link>
        </div>

        <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-6 sm:p-10 lg:p-12">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                {business.name}
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
                {page.title}
              </h1>

              {page.seo_description ? (
                <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                  {page.seo_description}
                </p>
              ) : null}
            </div>
          </div>

          <div className="border-t border-white/10 p-6 sm:p-10 lg:p-12">
            {hasHtml ? (
              <div
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-a:text-yellow-300 prose-strong:text-white"
                dangerouslySetInnerHTML={{
                  __html: page.html_content ?? "",
                }}
              />
            ) : (
              <div className="rounded-3xl border border-white/10 bg-black/40 p-6">
                <p className="text-sm leading-7 text-zinc-400">
                  {plainText || business.description || "This page is being built."}
                </p>
              </div>
            )}
          </div>
        </article>

        <footer className="border-t border-white/10 py-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} {business.name}. Powered by CreatorOS AI.
        </footer>
      </section>
    </main>
  );
}