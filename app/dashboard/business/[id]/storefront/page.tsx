import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Bot,
  Eye,
  Globe,
  MessageCircle,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Store,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import StorefrontClient from "./client";

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
  tagline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  status: string | null;
  generated_data: Record<string, unknown> | null;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  type: string | null;
  status: string | null;
  created_at: string;
};

type AgentRow = {
  id: string;
  name: string | null;
  role: string | null;
  opening_message: string | null;
  is_active: boolean | null;
  created_at: string;
};

function formatCurrency(cents: number | null, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format((cents ?? 0) / 100);
}

async function loadStorefrontManager(id: string) {
  const [businessResult, productsResult, agentsResult, leadsResult] =
    await Promise.all([
      supabaseAdmin.from("businesses").select("*").eq("id", id).single(),

      supabaseAdmin
        .from("products")
        .select(
          "id, name, description, price_cents, currency, type, status, created_at"
        )
        .eq("business_id", id)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("ai_agents")
        .select("id, name, role, opening_message, is_active, created_at")
        .eq("business_id", id)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("business_id", id),
    ]);

  if (businessResult.error || !businessResult.data) return null;

  if (productsResult.error) throw productsResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (leadsResult.error) throw leadsResult.error;

  return {
    business: businessResult.data as BusinessRow,
    products: (productsResult.data ?? []) as ProductRow[],
    agents: (agentsResult.data ?? []) as AgentRow[],
    leadsCount: leadsResult.count ?? 0,
  };
}

export default async function StorefrontManagerPage({ params }: Props) {
  const { id } = await params;
  const data = await loadStorefrontManager(id);

  if (!data) notFound();

  const { business, products, agents, leadsCount } = data;

  const activeProducts = products.filter(
    (product) => product.status === "active"
  );

  const activeAgents = agents.filter((agent) => agent.is_active);

  const storefrontHref = business.slug
    ? `/storefront/${business.slug}`
    : `/dashboard/business/${business.id}/settings`;

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
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-yellow-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-yellow-200">
                  <Store className="h-3.5 w-3.5" />
                  Storefront Manager
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {business.name} Storefront
                </h1>

                <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-400 sm:text-base">
                  Manage your public storefront headline, subheadline,
                  products, AI chat, lead capture, and launch readiness.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href={storefrontHref}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-yellow-400 px-5 py-3 text-sm font-black text-black transition hover:bg-yellow-300"
                >
                  <Eye className="h-4 w-4" />
                  View Storefront
                </Link>

                <a
                  href="#storefront-editor"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm font-bold text-white transition hover:border-yellow-400/40 hover:text-yellow-200"
                >
                  <Settings className="h-4 w-4" />
                  Edit Storefront
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Globe className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Storefront Status</p>
            <h2 className="mt-2 text-3xl font-black">
              {business.slug ? "Live" : "Draft"}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Package className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Active Products</p>
            <h2 className="mt-2 text-3xl font-black">
              {activeProducts.length}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <Bot className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">AI Employees</p>
            <h2 className="mt-2 text-3xl font-black">{activeAgents.length}</h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
            <MessageCircle className="h-7 w-7 text-yellow-200" />
            <p className="mt-4 text-xs text-zinc-500">Captured Leads</p>
            <h2 className="mt-2 text-3xl font-black">{leadsCount}</h2>
          </div>
        </div>

        <div id="storefront-editor">
          <StorefrontClient business={business} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Package className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Storefront Products</h2>
            </div>

            {products.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
                <Package className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="mt-4 font-black">No products yet</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Add products so your storefront can start selling.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-black">{product.name}</h3>
                        <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                          {product.description || "No description saved."}
                        </p>
                      </div>

                      <p className="font-black text-yellow-200">
                        {formatCurrency(
                          product.price_cents,
                          product.currency ?? "USD"
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Link
              href={`/dashboard/business/${business.id}/products`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
            >
              Manage Products
              <ShoppingBag className="h-4 w-4" />
            </Link>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <Bot className="h-5 w-5 text-yellow-200" />
              <h2 className="text-xl font-black">Storefront AI</h2>
            </div>

            {agents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-black/30 p-8 text-center">
                <Bot className="mx-auto h-10 w-10 text-zinc-600" />
                <h3 className="mt-4 font-black">No AI employees yet</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  Add an AI employee to answer questions and capture leads.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <h3 className="font-black">{agent.name || "AI Employee"}</h3>
                    <p className="mt-1 text-sm text-yellow-200">
                      {agent.role || "AI Sales Assistant"}
                    </p>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-400">
                      {agent.opening_message ||
                        "No opening message saved yet."}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <Link
              href={`/dashboard/business/${business.id}/ai-agents`}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-zinc-300 transition hover:border-yellow-400/30 hover:text-yellow-200"
            >
              Manage AI Employees
              <Bot className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-black/30 p-3 text-yellow-200">
              <Sparkles className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-xl font-black text-yellow-100">
                Storefront Editor Connected
              </h2>
              <p className="mt-2 text-sm leading-7 text-yellow-100/75">
                Storefront settings now save through your businesses API and
                products, AI employees, and lead capture stats stay visible on
                this page.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}