import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  FileText,
  Sparkles,
  Wand2,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import AIResultsClient from "./client";

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
};

type AIGenerationRow = {
  id: string;
  business_id: string;
  module: string;
  prompt: string | null;
  result: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

async function loadAIResults(id: string) {
  const [businessResult, resultsResult] = await Promise.all([
    supabaseAdmin
      .from("businesses")
      .select("id, name, slug")
      .eq("id", id)
      .single(),

    supabaseAdmin
      .from("ai_generations")
      .select("*")
      .eq("business_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (resultsResult.error) throw resultsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    results: (resultsResult.data ?? []) as AIGenerationRow[],
  };
}

export default async function AIResultsPage({ params }: Props) {
  const { id } = await params;
  const data = await loadAIResults(id);

  if (!data) {
    notFound();
  }

  const { business, results } = data;

  const optimizerReports = results.filter(
    (item) => item.module === "business_optimizer"
  );

  return (
    <main className="min-h-screen bg-[#050505] text-white">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <Link
          href={`/dashboard/businesses/${business.id}`}
          className="inline-flex w-fit items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Business
        </Link>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/30">
          <div className="relative p-5 sm:p-8 lg:p-10">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                <Sparkles className="h-3.5 w-3.5" />
                Saved AI Results
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                {business.name} AI Results
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                View saved AI generations, optimizer reports, content drafts,
                strategy outputs, and business insights created for this
                CreatorOS AI business.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <FileText className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Saved Results</p>
            <h2 className="mt-2 text-3xl font-black">{results.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Wand2 className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Optimizer Reports</p>
            <h2 className="mt-2 text-3xl font-black">
              {optimizerReports.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">AI Status</p>
            <h2 className="mt-2 text-3xl font-black">Ready</h2>
          </div>
        </div>

        <AIResultsClient businessId={business.id} initialResults={results} />
      </section>
    </main>
  );
}