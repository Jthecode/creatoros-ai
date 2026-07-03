import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    businessSlug: string;
    funnelSlug: string;
    pageSlug: string;
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

async function loadFunnelPage(
  businessSlug: string,
  funnelSlug: string,
  pageSlug: string
) {
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

  const funnelPages = (pages ?? []) as FunnelPage[];
  const currentPage = funnelPages.find((page) => page.slug === pageSlug);

  if (!currentPage) return null;

  const currentIndex = funnelPages.findIndex(
    (page) => page.id === currentPage.id
  );

  const previousPage = funnelPages[currentIndex - 1] ?? null;
  const nextPage = funnelPages[currentIndex + 1] ?? null;

  return {
    business: business as Business,
    funnel: funnel as Funnel,
    pages: funnelPages,
    currentPage,
    previousPage,
    nextPage,
  };
}

export async function generateMetadata({ params }: Props) {
  const { businessSlug, funnelSlug, pageSlug } = await params;
  const data = await loadFunnelPage(businessSlug, funnelSlug, pageSlug);

  if (!data) {
    return {
      title: "Funnel Page Not Found",
    };
  }

  return {
    title:
      data.currentPage.seo_title ||
      `${data.currentPage.title} | ${data.funnel.name}`,
    description:
      data.currentPage.seo_description ||
      data.funnel.description ||
      data.business.description ||
      `${data.currentPage.title} by ${data.business.name}`,
  };
}

export default async function FunnelStepPage({ params }: Props) {
  const { businessSlug, funnelSlug, pageSlug } = await params;
  const data = await loadFunnelPage(businessSlug, funnelSlug, pageSlug);

  if (!data) notFound();

  const { business, funnel, pages, currentPage, previousPage, nextPage } = data;

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
                {business.tagline || funnel.name}
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap gap-2">
            {pages.slice(0, 5).map((page) => {
              const href =
                page.sort_order === 1
                  ? `/funnel/${business.slug}/${funnel.slug}`
                  : `/funnel/${business.slug}/${funnel.slug}/${page.slug}`;

              return (
                <Link
                  key={page.id}
                  href={href}
                  className={
                    page.id === currentPage.id
                      ? "rounded-full border border-yellow-400/40 bg-yellow-400/20 px-4 py-2 text-xs font-black text-yellow-100"
                      : "rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200"
                  }
                >
                  {page.title}
                </Link>
              );
            })}
          </nav>
        </header>

        <div className="grid gap-2 sm:grid-cols-4">
          {pages.map((page) => (
            <div
              key={page.id}
              className={
                page.id === currentPage.id
                  ? "rounded-2xl border border-yellow-400/40 bg-yellow-400/20 p-3"
                  : "rounded-2xl border border-white/10 bg-white/[0.03] p-3"
              }
            >
              <p
                className={
                  page.id === currentPage.id
                    ? "text-xs font-black uppercase tracking-wide text-yellow-100"
                    : "text-xs font-black uppercase tracking-wide text-zinc-500"
                }
              >
                Step {page.sort_order}
              </p>

              <p className="mt-1 text-sm font-bold">{page.title}</p>
            </div>
          ))}
        </div>

        <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-6 sm:p-10 lg:p-12">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {currentPage.type}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                {currentPage.title}
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                {currentPage.seo_description ||
                  funnel.description ||
                  business.description ||
                  "This funnel step was built with CreatorOS AI."}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {nextPage ? (
                  <Link
                    href={`/funnel/${business.slug}/${funnel.slug}/${nextPage.slug}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                  >
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <Link
                    href={`/storefront/${business.slug}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                  >
                    Finish
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}

                {previousPage ? (
                  <Link
                    href={
                      previousPage.sort_order === 1
                        ? `/funnel/${business.slug}/${funnel.slug}`
                        : `/funnel/${business.slug}/${funnel.slug}/${previousPage.slug}`
                    }
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous
                  </Link>
                ) : null}
              </div>
            </div>
          </div>

          {currentPage.html_content ? (
            <div className="border-t border-white/10 p-6 sm:p-10 lg:p-12">
              <div
                className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-a:text-yellow-300 prose-strong:text-white"
                dangerouslySetInnerHTML={{
                  __html: currentPage.html_content,
                }}
              />
            </div>
          ) : null}
        </article>

        <footer className="border-t border-white/10 py-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} {business.name}. Powered by CreatorOS AI.
        </footer>
      </section>
    </main>
  );
}