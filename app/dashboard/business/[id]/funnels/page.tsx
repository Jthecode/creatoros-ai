import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  FileText,
  Filter,
  Flame,
  MousePointerClick,
  Sparkles,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import FunnelsClient from "./client";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
};

type FunnelPageRow = {
  id: string;
  title: string;
  slug: string;
  type: string;
  sort_order: number;
  status: string;
  created_at: string;
};

type FunnelRow = {
  id: string;
  business_id: string;
  name: string;
  slug: string;
  description: string | null;
  goal: string | null;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
  funnel_pages?: FunnelPageRow[];
};

async function loadFunnelsPage(id: string) {
  const [businessResult, funnelsResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug, description, industry, audience")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("funnels")
      .select(
        `
        *,
        funnel_pages (
          id,
          title,
          slug,
          type,
          sort_order,
          status,
          created_at
        )
      `
      )
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) return null;
  if (funnelsResult.error) throw funnelsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    funnels: (funnelsResult.data ?? []) as FunnelRow[],
  };
}

export default async function FunnelsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadFunnelsPage(id);

  if (!data) notFound();

  const { business, funnels } = data;

  const publishedFunnels = funnels.filter(
    (funnel) => funnel.status === "published"
  );

  const draftFunnels = funnels.filter((funnel) => funnel.status !== "published");

  const totalPages = funnels.reduce(
    (sum, funnel) => sum + (funnel.funnel_pages?.length ?? 0),
    0
  );

  const previewBaseHref = business.slug
    ? `/funnel/${business.slug}`
    : `/dashboard/business/${business.id}/funnels`;

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
                  <Filter className="h-3.5 w-3.5" />
                  AI Funnel Builder
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  Funnels for {business.name}
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Build complete sales funnels with landing pages, checkout
                  pages, upsells, downsells, thank-you pages, email capture, and
                  AI-powered follow-up systems.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="#funnel-builder"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Sparkles className="h-4 w-4" />
                  Create Funnel
                </a>

                <Link
                  href={previewBaseHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <MousePointerClick className="h-4 w-4" />
                  Preview Funnels
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Filter className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Funnels</p>
            <h2 className="mt-2 text-3xl font-black">{funnels.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <CheckCircle2 className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Published</p>
            <h2 className="mt-2 text-3xl font-black">
              {publishedFunnels.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <FileText className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Funnel Pages</p>
            <h2 className="mt-2 text-3xl font-black">{totalPages}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <BarChart3 className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Drafts</p>
            <h2 className="mt-2 text-3xl font-black">{draftFunnels.length}</h2>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
                <Flame className="h-6 w-6" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-yellow-100">
                  Funnel Flow
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-yellow-100/75">
                  Landing Page → Checkout → Upsell → Thank You → Email Follow-Up
                  → CRM → Analytics. This is where CreatorOS turns attention
                  into leads, customers, and revenue.
                </p>
              </div>
            </div>

            <a
              href="#funnel-builder"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
            >
              Build Funnel
              <Sparkles className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div id="funnel-builder">
          <FunnelsClient business={business} initialFunnels={funnels} />
        </div>
      </section>
    </main>
  );
}