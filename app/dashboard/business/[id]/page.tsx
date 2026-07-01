import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Bot,
  BriefcaseBusiness,
  DollarSign,
  Globe,
  Package,
  Pencil,
  Settings,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import MobileBusinessNav from "@/components/MobileBusinessNav";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type BusinessRow = {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  industry: string | null;
  audience: string | null;
  brand_voice: string | null;
  storefront_headline: string | null;
  storefront_subheadline: string | null;
  status: string | null;
  created_at: string;
};

type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number | null;
  currency: string | null;
  status: string | null;
};

type AgentRow = {
  id: string;
  name: string | null;
  role: string | null;
  is_active: boolean | null;
};

type OrderRow = {
  id: string;
  total_cents: number | null;
  customer_email: string | null;
  status: string | null;
};

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

async function loadBusiness(id: string) {
  const [businessResult, productsResult, agentsResult, ordersResult] =
    await Promise.all([
      supabaseAdmin.from("businesses").select("*").eq("id", id).single(),
      supabaseAdmin
        .from("products")
        .select("id, name, description, price_cents, currency, status")
        .eq("business_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("ai_agents")
        .select("id, name, role, is_active")
        .eq("business_id", id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("orders")
        .select("id, total_cents, customer_email, status")
        .eq("business_id", id),
    ]);

  if (businessResult.error || !businessResult.data) {
    return null;
  }

  if (productsResult.error) throw productsResult.error;
  if (agentsResult.error) throw agentsResult.error;
  if (ordersResult.error) throw ordersResult.error;

  const business = businessResult.data as BusinessRow;
  const products = (productsResult.data ?? []) as ProductRow[];
  const agents = (agentsResult.data ?? []) as AgentRow[];
  const orders = (ordersResult.data ?? []) as OrderRow[];

  const paidOrders = orders.filter((order) => order.status === "paid");

  const revenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_cents ?? 0),
    0
  );

  const customers = new Set(
    orders.map((order) => order.customer_email).filter(Boolean)
  );

  return {
    business,
    products,
    agents,
    stats: {
      revenue,
      products: products.length,
      agents: agents.length,
      orders: orders.length,
      customers: customers.size,
    },
  };
}

export default async function BusinessDashboard({ params }: Props) {
  const { id } = await params;
  const data = await loadBusiness(id);

  if (!data) {
    notFound();
  }

  const { business, products, agents, stats } = data;

  const cards = [
    {
      title: "Revenue",
      value: formatCurrency(stats.revenue),
      icon: DollarSign,
    },
    {
      title: "Products",
      value: stats.products.toString(),
      icon: Package,
    },
    {
      title: "Orders",
      value: stats.orders.toString(),
      icon: ShoppingBag,
    },
    {
      title: "AI Employees",
      value: stats.agents.toString(),
      icon: Bot,
    },
  ];

  const aiTools = [
    {
      title: "Generate Products",
      href: `/dashboard/business/${business.id}/products`,
    },
    {
      title: "Generate Sales Funnel",
      href: `/dashboard/business/${business.id}/sales`,
    },
    {
      title: "Generate Landing Page",
      href: `/dashboard/business/${business.id}/website`,
    },
    {
      title: "Generate Marketing Campaign",
      href: `/dashboard/business/${business.id}/marketing`,
    },
    {
      title: "Train AI Employee",
      href: `/dashboard/business/${business.id}/employees`,
    },
    {
      title: "Generate Emails",
      href: `/dashboard/business/${business.id}/content`,
    },
    {
      title: "Generate Ads",
      href: `/dashboard/business/${business.id}/marketing`,
    },
  ];

  const managementLinks = [
    {
      title: "Products",
      href: `/dashboard/business/${business.id}/products`,
      icon: Package,
    },
    {
      title: "Branding",
      href: `/dashboard/business/${business.id}/branding`,
      icon: BriefcaseBusiness,
    },
    {
      title: "Customers",
      href: `/dashboard/business/${business.id}/crm`,
      icon: Users,
    },
    {
      title: "Edit Business",
      href: `/dashboard/business/${business.id}/settings`,
      icon: Pencil,
    },
    {
      title: "AI Employees",
      href: `/dashboard/business/${business.id}/employees`,
      icon: Bot,
    },
  ];

  return (
    <main className="min-h-screen bg-black pb-24 text-white lg:pb-0">
      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="rounded-3xl border border-yellow-400/20 bg-yellow-400/10 p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-start">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-yellow-400">
                CreatorOS AI Business
              </p>

              <h1 className="mt-4 text-5xl font-bold">{business.name}</h1>

              <p className="mt-3 text-xl font-semibold text-yellow-300">
                {business.tagline || "AI-powered creator business"}
              </p>

              <p className="mt-5 max-w-3xl leading-7 text-zinc-300">
                {business.description ||
                  "Manage your storefront, products, customers, AI employees, and business tools from one command center."}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {business.industry && (
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-300">
                    {business.industry}
                  </span>
                )}

                {business.audience && (
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-300">
                    {business.audience}
                  </span>
                )}

                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs capitalize text-zinc-300">
                  {business.status || "draft"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/storefront/${business.slug}`}
                className="inline-flex items-center gap-2 rounded-2xl bg-yellow-400 px-6 py-3 font-bold text-black transition hover:bg-yellow-300"
              >
                <Globe size={18} />
                View Storefront
              </Link>

              <Link
                href={`/dashboard/business/${business.id}/settings`}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-6 py-3 font-bold text-white transition hover:border-yellow-400/50"
              >
                <Pencil size={18} />
                Edit Business
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-400/10 text-yellow-400">
                  <Icon size={22} />
                </div>

                <p className="text-sm text-zinc-400">{card.title}</p>
                <h2 className="mt-2 text-3xl font-bold">{card.value}</h2>
              </div>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Sparkles className="text-yellow-400" />
              <h2 className="text-2xl font-bold">AI Business Tools</h2>
            </div>

            <div className="space-y-4">
              {aiTools.map((tool) => (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-yellow-400"
                >
                  {tool.title}
                  <Sparkles size={18} className="text-yellow-400" />
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="mb-5 flex items-center gap-3">
              <Settings className="text-yellow-400" />
              <h2 className="text-2xl font-bold">Business Management</h2>
            </div>

            <div className="space-y-4">
              {managementLinks.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-4 transition hover:border-yellow-400"
                  >
                    {item.title}
                    <Icon />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">Products</h2>

              <Link
                href={`/dashboard/business/${business.id}/products`}
                className="text-sm font-semibold text-yellow-400 hover:text-yellow-300"
              >
                View All
              </Link>
            </div>

            {products.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                No products saved yet. Use AI Builder to generate products for
                this business.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {products.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-bold">{product.name}</h3>
                      <span className="text-sm font-bold text-yellow-400">
                        {formatCurrency(product.price_cents ?? 0)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-zinc-400">
                      {product.description || "No description yet."}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold">AI Employees</h2>

              <Link
                href={`/dashboard/business/${business.id}/employees`}
                className="text-sm font-semibold text-yellow-400 hover:text-yellow-300"
              >
                View All
              </Link>
            </div>

            {agents.length === 0 ? (
              <p className="mt-4 text-sm leading-6 text-zinc-400">
                No AI employees created yet. Your sales, support, and marketing
                AI employees will appear here.
              </p>
            ) : (
              <div className="mt-5 space-y-3">
                {agents.slice(0, 5).map((agent) => (
                  <div
                    key={agent.id}
                    className="rounded-2xl border border-white/10 bg-black/40 p-4"
                  >
                    <h3 className="font-bold">
                      {agent.name || "CreatorOS AI Employee"}
                    </h3>

                    <p className="mt-1 text-sm text-yellow-300">
                      {agent.role || "AI Sales Manager"}
                    </p>

                    <p className="mt-2 text-xs text-zinc-500">
                      {agent.is_active ? "Active" : "Inactive"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <MobileBusinessNav businessId={business.id} />
    </main>
  );
}