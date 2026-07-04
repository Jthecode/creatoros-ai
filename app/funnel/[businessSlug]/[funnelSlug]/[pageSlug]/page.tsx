import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Mail,
  Phone,
  Sparkles,
  User,
} from "lucide-react";

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
  is_published: boolean | null;
};

type FunnelPage = {
  id: string;
  business_id: string;
  funnel_id: string;
  title: string;
  slug: string;
  type: string | null;
  page_type: string | null;
  sort_order: number;
  headline: string | null;
  subheadline: string | null;
  body: string | null;
  cta_text: string | null;
  cta_url: string | null;
  html_content: string | null;
  seo_title: string | null;
  seo_description: string | null;
  status: string;
  is_published: boolean | null;
};

type LeadForm = {
  id: string;
  business_id: string;
  funnel_id: string | null;
  funnel_page_id: string | null;
  name: string;
  slug: string;
  title: string;
  description: string | null;
  submit_button_text: string;
  form_type: string;
  status: string;
  fields: unknown;
  success_message: string | null;
  redirect_url: string | null;
  is_active: boolean | null;
  is_published: boolean | null;
};

async function trackPageView(options: {
  businessId: string;
  funnelId: string;
  funnelPageId: string;
  leadFormId?: string | null;
  pageUrl: string;
}) {
  await supabaseAdmin.from("conversion_events").insert({
    business_id: options.businessId,
    funnel_id: options.funnelId,
    funnel_page_id: options.funnelPageId,
    lead_form_id: options.leadFormId || null,
    event_name: "Funnel Page Viewed",
    event_type: "page_view",
    source: "funnel",
    page_url: options.pageUrl,
    metadata: {
      source: "server_page_render",
    },
  });
}

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
    .select(
      "id, business_id, name, slug, description, goal, status, is_published"
    )
    .eq("business_id", business.id)
    .eq("slug", funnelSlug)
    .or("status.eq.published,is_published.eq.true")
    .single();

  if (funnelError || !funnel) return null;

  const { data: pages, error: pagesError } = await supabaseAdmin
    .from("funnel_pages")
    .select(
      "id, business_id, funnel_id, title, slug, type, page_type, sort_order, headline, subheadline, body, cta_text, cta_url, html_content, seo_title, seo_description, status, is_published"
    )
    .eq("funnel_id", funnel.id)
    .or("status.eq.published,is_published.eq.true")
    .order("sort_order", { ascending: true });

  if (pagesError) throw pagesError;

  const funnelPages = (pages ?? []) as FunnelPage[];
  const currentPage = funnelPages.find((page) => page.slug === pageSlug);

  if (!currentPage) return null;

  const { data: leadForm } = await supabaseAdmin
    .from("lead_forms")
    .select(
      "id, business_id, funnel_id, funnel_page_id, name, slug, title, description, submit_button_text, form_type, status, fields, success_message, redirect_url, is_active, is_published"
    )
    .eq("business_id", business.id)
    .or(`funnel_page_id.eq.${currentPage.id},funnel_id.eq.${funnel.id}`)
    .eq("is_active", true)
    .or("status.eq.published,is_published.eq.true")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
    leadForm: (leadForm ?? null) as LeadForm | null,
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
      data.currentPage.subheadline ||
      data.funnel.description ||
      data.business.description ||
      `${data.currentPage.title} by ${data.business.name}`,
  };
}

export default async function FunnelStepPage({ params }: Props) {
  const { businessSlug, funnelSlug, pageSlug } = await params;
  const data = await loadFunnelPage(businessSlug, funnelSlug, pageSlug);

  if (!data) notFound();

  const {
    business,
    funnel,
    pages,
    currentPage,
    previousPage,
    nextPage,
    leadForm,
  } = data;

  const pageType =
    currentPage.page_type || currentPage.type || "funnel_step";

  const pageUrl = `/funnel/${business.slug}/${funnel.slug}/${currentPage.slug}`;

  await trackPageView({
    businessId: business.id,
    funnelId: funnel.id,
    funnelPageId: currentPage.id,
    leadFormId: leadForm?.id || null,
    pageUrl,
  });

  const nextHref = nextPage
    ? `/funnel/${business.slug}/${funnel.slug}/${nextPage.slug}`
    : `/storefront/${business.slug}`;

  const previousHref = previousPage
    ? previousPage.sort_order === 1
      ? `/funnel/${business.slug}/${funnel.slug}`
      : `/funnel/${business.slug}/${funnel.slug}/${previousPage.slug}`
    : null;

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
                {pageType.replaceAll("_", " ")}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                {currentPage.headline || currentPage.title}
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                {currentPage.subheadline ||
                  currentPage.seo_description ||
                  funnel.description ||
                  business.description ||
                  "This funnel step was built with CreatorOS AI."}
              </p>

              {currentPage.body ? (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-500">
                  {currentPage.body}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={nextHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  {currentPage.cta_text || (nextPage ? "Continue" : "Finish")}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                {previousHref ? (
                  <Link
                    href={previousHref}
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

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-200">
              <Sparkles className="h-3.5 w-3.5" />
              Funnel Conversion
            </div>

            <h2 className="mt-4 text-3xl font-black text-yellow-100">
              Ready for the next step?
            </h2>

            <p className="mt-3 text-sm leading-7 text-yellow-100/75">
              Submit your information below and this business will receive your
              lead inside CreatorOS AI CRM, funnel submissions, and conversion
              tracking.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-yellow-100/60">
                  Business
                </p>
                <p className="mt-2 text-sm font-black text-yellow-100">
                  {business.name}
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-yellow-100/60">
                  Funnel
                </p>
                <p className="mt-2 text-sm font-black text-yellow-100">
                  {funnel.name}
                </p>
              </div>

              <div className="rounded-2xl border border-yellow-400/20 bg-black/30 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-yellow-100/60">
                  Step
                </p>
                <p className="mt-2 text-sm font-black text-yellow-100">
                  {currentPage.title}
                </p>
              </div>
            </div>
          </div>

          <form
            action="/api/funnel-submit"
            method="post"
            className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-8"
          >
            <input type="hidden" name="businessId" value={business.id} />
            <input type="hidden" name="businessSlug" value={business.slug || ""} />
            <input type="hidden" name="funnelId" value={funnel.id} />
            <input type="hidden" name="funnelSlug" value={funnel.slug} />
            <input type="hidden" name="funnelPageId" value={currentPage.id} />
            <input type="hidden" name="pageSlug" value={currentPage.slug} />
            <input type="hidden" name="leadFormId" value={leadForm?.id || ""} />
            <input type="hidden" name="formSlug" value={leadForm?.slug || ""} />
            <input type="hidden" name="pageUrl" value={pageUrl} />

            <div className="mb-6">
              <h2 className="text-2xl font-black">
                {leadForm?.title || "Get Started"}
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {leadForm?.description ||
                  "Enter your details below and we will follow up with you."}
              </p>
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <User className="h-4 w-4 text-yellow-200" />
                  Name
                </span>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Your name"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <Mail className="h-4 w-4 text-yellow-200" />
                  Email
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-300">
                  <Phone className="h-4 w-4 text-yellow-200" />
                  Phone
                </span>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50"
                />
              </label>

              <label className="block">
                <span className="mb-2 text-sm font-bold text-zinc-300">
                  Message
                </span>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Tell us what you are looking for..."
                  className="w-full resize-none rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-yellow-400/50"
                />
              </label>
            </div>

            <button
              type="submit"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              {leadForm?.submit_button_text || "Submit"}
              <ArrowRight className="h-4 w-4" />
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-zinc-500">
              Powered by CreatorOS AI lead capture.
            </p>
          </form>
        </section>

        <footer className="border-t border-white/10 py-6 text-sm text-zinc-500">
          © {new Date().getFullYear()} {business.name}. Powered by CreatorOS AI.
        </footer>
      </section>
    </main>
  );
}