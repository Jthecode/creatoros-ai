import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    businessSlug: string;
    funnelSlug: string;
  }>;
};

type Business = {
  id: string;
  name: string;
  slug: string | null;
  tagline: string | null;
  description: string | null;
};

type Funnel = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  goal: string | null;
  status: string;
};

type FunnelPage = {
  id: string;
  title: string;
  slug: string;
  type: string;
  sort_order: number;
  html_content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
};

async function loadFunnelHome(businessSlug: string, funnelSlug: string) {
  const { data: business, error: businessError } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, tagline, description")
    .eq("slug", businessSlug)
    .single();

  if (businessError || !business) return null;

  const { data: funnel, error: funnelError } = await supabaseAdmin
    .from("funnels")
    .select("id, business_id, name, slug, description, goal, status")
    .eq("business_id", business.id)
    .eq("slug", funnelSlug)
    .eq("status", "published")
    .single();

  if (funnelError || !funnel) return null;

  const { data: pages, error: pagesError } = await supabaseAdmin
    .from("funnel_pages")
    .select(
      "id, title, slug, type, sort_order, html_content, seo_title, seo_description, status"
    )
    .eq("funnel_id", funnel.id)
    .eq("status", "published")
    .order("sort_order", { ascending: true });

  if (pagesError) throw pagesError;

  return {
    business: business as Business,
    funnel: funnel as Funnel,
    pages: (pages ?? []) as FunnelPage[],
  };
}

export async function generateMetadata({ params }: Props) {
  const { businessSlug, funnelSlug } = await params;
  const data = await loadFunnelHome(businessSlug, funnelSlug);

  if (!data) {
    return {
      title: "Funnel Not Found",
    };
  }

  const firstPage = data.pages[0];

  return {
    title:
      firstPage?.seo_title ||
      `${data.funnel.name} | ${data.business.name}`,
    description:
      firstPage?.seo_description ||
      data.funnel.description ||
      data.business.description ||
      `${data.funnel.name} by ${data.business.name}`,
  };
}

export default async function FunnelHomePage({ params }: Props) {
  const { businessSlug, funnelSlug } = await params;
  const data = await loadFunnelHome(businessSlug, funnelSlug);

  if (!data) notFound();

  const { business, funnel, pages } = data;
  const firstPage = pages[0] ?? null;
  const nextPage = pages[1] ?? null;

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-center md:justify-between">
          <Link
            href={`/funnel/${business.slug}/${funnel.slug}`}
            className="flex items-center gap-3"
          >
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
            {pages.slice(0, 5).map((page) => (
              <Link
                key={page.id}
                href={
                  page.sort_order === 1
                    ? `/funnel/${business.slug}/${funnel.slug}`
                    : `/funnel/${business.slug}/${funnel.slug}/${page.slug}`
                }
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
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {funnel.goal || "AI Sales Funnel"}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                {firstPage?.title || funnel.name}
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                {firstPage?.seo_description ||
                  funnel.description ||
                  business.description ||
                  "A premium AI-powered funnel built with CreatorOS AI."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={
                    nextPage
                      ? `/funnel/${business.slug}/${funnel.slug}/${nextPage.slug}`
                      : `/storefront/${business.slug}`
                  }
                  className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  Continue
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

          {firstPage?.html_content ? (
            <div className="border-t border-white/10 p-6 sm:p-10 lg:p-12">
              <div
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-a:text-yellow-300 prose-strong:text-white"
                dangerouslySetInnerHTML={{
                  __html: firstPage.html_content,
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={
                page.sort_order === 1
                  ? `/funnel/${business.slug}/${funnel.slug}`
                  : `/funnel/${business.slug}/${funnel.slug}/${page.slug}`
              }
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
            >
              <p className="text-xs font-black uppercase tracking-wide text-yellow-200">
                Step {page.sort_order}
              </p>

              <h2 className="mt-3 text-xl font-black">{page.title}</h2>

              <p className="mt-2 text-sm capitalize text-zinc-500">
                {page.type}
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