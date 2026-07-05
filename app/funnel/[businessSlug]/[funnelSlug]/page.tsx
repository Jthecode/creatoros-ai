import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertCircle,
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
  }>;
  searchParams?: Promise<{
    submitted?: string;
    error?: string;
    message?: string;
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

function cleanMessage(value: string | undefined) {
  if (!value) return "";
  return value.trim().slice(0, 180);
}

async function trackPageView(options: {
  businessId: string;
  funnelId: string;
  funnelPageId?: string | null;
  leadFormId?: string | null;
  pageUrl: string;
}) {
  await supabaseAdmin.from("conversion_events").insert({
    business_id: options.businessId,
    funnel_id: options.funnelId,
    funnel_page_id: options.funnelPageId || null,
    lead_form_id: options.leadFormId || null,
    event_name: "Funnel Page Viewed",
    event_type: "page_view",
    source: "funnel",
    page_url: options.pageUrl,
    metadata: {
      source: "server_funnel_home_render",
    },
  });
}

async function loadFunnelHome(businessSlug: string, funnelSlug: string) {
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
  const firstPage = funnelPages[0] ?? null;

  const { data: leadForm } = await supabaseAdmin
    .from("lead_forms")
    .select(
      "id, business_id, funnel_id, funnel_page_id, name, slug, title, description, submit_button_text, form_type, status, fields, success_message, redirect_url, is_active, is_published"
    )
    .eq("business_id", business.id)
    .or(
      firstPage
        ? `funnel_page_id.eq.${firstPage.id},funnel_id.eq.${funnel.id}`
        : `funnel_id.eq.${funnel.id}`
    )
    .eq("is_active", true)
    .or("status.eq.published,is_published.eq.true")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    business: business as Business,
    funnel: funnel as Funnel,
    pages: funnelPages,
    firstPage,
    leadForm: (leadForm ?? null) as LeadForm | null,
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
      firstPage?.headline ||
      `${data.funnel.name} | ${data.business.name}`,
    description:
      firstPage?.seo_description ||
      firstPage?.subheadline ||
      data.funnel.description ||
      data.business.description ||
      `${data.funnel.name} by ${data.business.name}`,
  };
}

export default async function FunnelHomePage({ params, searchParams }: Props) {
  const { businessSlug, funnelSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const data = await loadFunnelHome(businessSlug, funnelSlug);

  if (!data) notFound();

  const { business, funnel, pages, firstPage, leadForm } = data;
  const nextPage = pages[1] ?? null;

  const pageUrl = `/funnel/${business.slug}/${funnel.slug}`;

  await trackPageView({
    businessId: business.id,
    funnelId: funnel.id,
    funnelPageId: firstPage?.id || null,
    leadFormId: leadForm?.id || null,
    pageUrl,
  });

  const submitted = resolvedSearchParams.submitted === "1";
  const hasError = resolvedSearchParams.error === "1";
  const alertMessage =
    cleanMessage(resolvedSearchParams.message) ||
    (submitted
      ? leadForm?.success_message || "Thanks! We received your information."
      : hasError
        ? "Unable to submit the form. Please try again."
        : "");

  const heroTitle = firstPage?.headline || firstPage?.title || funnel.name;

  const heroDescription =
    firstPage?.subheadline ||
    firstPage?.seo_description ||
    funnel.description ||
    business.description ||
    "A premium AI-powered funnel built with CreatorOS AI.";

  const heroBody = firstPage?.body;

  const continueHref = nextPage
    ? `/funnel/${business.slug}/${funnel.slug}/${nextPage.slug}`
    : `/storefront/${business.slug}`;

  const pageType =
    firstPage?.page_type || firstPage?.type || funnel.goal || "AI Sales Funnel";

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
                className={
                  page.sort_order === 1
                    ? "rounded-full border border-yellow-400/40 bg-yellow-400/20 px-4 py-2 text-xs font-black text-yellow-100"
                    : "rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-bold text-zinc-300 transition hover:border-yellow-400/40 hover:text-yellow-200"
                }
              >
                {page.title}
              </Link>
            ))}
          </nav>
        </header>

        {submitted || hasError ? (
          <div
            className={
              submitted
                ? "rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-5 text-emerald-100"
                : "rounded-3xl border border-red-400/20 bg-red-400/10 p-5 text-red-100"
            }
          >
            <div className="flex items-start gap-3">
              {submitted ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
              )}

              <div>
                <h2 className="font-black">
                  {submitted ? "Submission received" : "Submission error"}
                </h2>

                <p className="mt-1 text-sm leading-6 opacity-80">
                  {alertMessage}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-6 sm:p-10 lg:p-12">
            <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {pageType.replaceAll("_", " ")}
              </div>

              <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-6xl">
                {heroTitle}
              </h1>

              <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-400">
                {heroDescription}
              </p>

              {heroBody ? (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-zinc-500">
                  {heroBody}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={continueHref}
                  className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  {firstPage?.cta_text || "Continue"}
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

        <section className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-6 sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-black/30 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-200">
              <Sparkles className="h-3.5 w-3.5" />
              Funnel Conversion
            </div>

            <h2 className="mt-4 text-3xl font-black text-yellow-100">
              Take the next step with {business.name}.
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
                  Goal
                </p>
                <p className="mt-2 text-sm font-black text-yellow-100">
                  {funnel.goal || "Convert visitors"}
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
            <input
              type="hidden"
              name="businessSlug"
              value={business.slug || ""}
            />
            <input type="hidden" name="funnelId" value={funnel.id} />
            <input type="hidden" name="funnelSlug" value={funnel.slug} />
            <input
              type="hidden"
              name="funnelPageId"
              value={firstPage?.id || ""}
            />
            <input type="hidden" name="pageSlug" value={firstPage?.slug || ""} />
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

        <div className="grid gap-4 md:grid-cols-4">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={
                page.sort_order === 1
                  ? `/funnel/${business.slug}/${funnel.slug}`
                  : `/funnel/${business.slug}/${funnel.slug}/${page.slug}`
              }
              className={
                page.sort_order === 1
                  ? "rounded-3xl border border-yellow-400/40 bg-yellow-400/10 p-5 transition hover:bg-yellow-400/20"
                  : "rounded-3xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-yellow-400/40 hover:bg-yellow-400/[0.03]"
              }
            >
              <p className="text-xs font-black uppercase tracking-wide text-yellow-200">
                Step {page.sort_order}
              </p>

              <h2 className="mt-3 text-xl font-black">{page.title}</h2>

              <p className="mt-2 text-sm capitalize text-zinc-500">
                {(page.page_type || page.type || "funnel step").replaceAll(
                  "_",
                  " "
                )}
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