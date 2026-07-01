import Link from "next/link";
import { Bot, ExternalLink, Globe, Plus, Sparkles } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import BusinessStatsBar from "@/components/BusinessStatsBar";

type BusinessHeaderProps = {
  businessId: string;
};

type Business = {
  id: string;
  name: string;
  slug: string;
  status: string | null;
};

async function loadBusiness(id: string) {
  const { data, error } = await supabaseAdmin
    .from("businesses")
    .select("id, name, slug, status")
    .eq("id", id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Business;
}

export default async function BusinessHeader({
  businessId,
}: BusinessHeaderProps) {
  const business = await loadBusiness(businessId);

  if (!business) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="flex flex-col gap-6 px-8 py-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-yellow-400">
            CreatorOS AI Business
          </p>

          <h1 className="mt-3 text-3xl font-bold">{business.name}</h1>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-semibold capitalize text-green-400">
              {business.status ?? "draft"}
            </span>

            <Link
              href={`/storefront/${business.slug}`}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-300 transition hover:border-yellow-400/50 hover:text-yellow-400"
            >
              <Globe size={14} />
              View Storefront
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/dashboard/business/${business.id}/products`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-medium transition hover:border-yellow-400/50 hover:text-yellow-400"
          >
            <Plus size={18} />
            Add Product
          </Link>

          <Link
            href={`/dashboard/business/${business.id}/employees`}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-5 py-3 font-medium transition hover:border-yellow-400/50 hover:text-yellow-400"
          >
            <Bot size={18} />
            AI Employees
          </Link>

          <button className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300">
            <Sparkles size={18} />
            AI Optimize
          </button>
        </div>
      </div>

      <BusinessStatsBar businessId={business.id} />
    </header>
  );
}